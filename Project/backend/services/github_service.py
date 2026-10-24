import re
import time
from typing import Tuple, Dict, Any, List, Optional
import httpx
from backend.config import GITHUB_TOKEN, CACHE_TTL_SECONDS

class GitHubAPIError(Exception):
    def __init__(self, message: str, status_code: int = 400, rate_limit_info: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.rate_limit_info = rate_limit_info

# In-memory cache: key -> {"data": ..., "timestamp": float}
_cache: Dict[str, Dict[str, Any]] = {}

def parse_github_url(url: str) -> Tuple[str, str]:
    """
    Parses a GitHub repository URL or shorthand 'owner/repo' into (owner, repo).
    Accepts:
      - https://github.com/owner/repo
      - https://github.com/owner/repo/
      - http://github.com/owner/repo.git
      - github.com/owner/repo
      - owner/repo
    """
    cleaned = url.strip()
    if not cleaned:
        raise GitHubAPIError("Repository URL cannot be empty.", status_code=400)

    # Match standard patterns
    patterns = [
        r'^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+?)(?:\.git|\/)?$',
        r'^([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)$'
    ]

    for pattern in patterns:
        match = re.match(pattern, cleaned)
        if match:
            owner, repo = match.group(1), match.group(2)
            if repo.endswith(".git"):
                repo = repo[:-4]
            # Disallow reserved names or dotpaths
            if owner in (".", "..") or repo in (".", ".."):
                break
            return owner, repo

    raise GitHubAPIError(
        f"Invalid GitHub repository URL: '{url}'. Expected format: 'https://github.com/owner/repo' or 'owner/repo'.",
        status_code=400
    )

def clear_cache():
    """Clear all in-memory cache."""
    _cache.clear()

def get_cache_stats() -> Dict[str, Any]:
    now = time.time()
    valid_entries = sum(1 for v in _cache.values() if now - v["timestamp"] < CACHE_TTL_SECONDS)
    return {
        "total_cached_keys": len(_cache),
        "valid_cached_keys": valid_entries,
        "ttl_seconds": CACHE_TTL_SECONDS
    }

class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self.token = token or GITHUB_TOKEN
        self.base_url = "https://api.github.com"

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "VitalRepo-Sustainability-Analyzer/1.0"
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def _fetch_json(self, client: httpx.AsyncClient, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Tuple[Any, Dict[str, Any]]:
        cache_key = f"{endpoint}:{str(params)}"
        now = time.time()

        if cache_key in _cache:
            entry = _cache[cache_key]
            if now - entry["timestamp"] < CACHE_TTL_SECONDS:
                return entry["data"], entry.get("rate_limit", {})

        url = f"{self.base_url}{endpoint}"
        try:
            response = await client.get(url, headers=self._get_headers(), params=params, timeout=15.0)
        except httpx.TimeoutException:
            raise GitHubAPIError(f"Request to GitHub API timed out for endpoint {endpoint}.", status_code=504)
        except httpx.RequestError as exc:
            raise GitHubAPIError(f"Network error communicating with GitHub: {str(exc)}", status_code=502)

        rate_limit = {
            "limit": response.headers.get("x-ratelimit-limit"),
            "remaining": response.headers.get("x-ratelimit-remaining"),
            "reset": response.headers.get("x-ratelimit-reset"),
            "used": response.headers.get("x-ratelimit-used")
        }

        if response.status_code == 404:
            raise GitHubAPIError(f"Repository or resource not found at GitHub ({endpoint}). Verify the repository exists and is public.", status_code=404)
        elif response.status_code == 403 or response.status_code == 429:
            remaining = rate_limit.get("remaining")
            reset_ts = rate_limit.get("reset")
            reset_str = f" Rate limit resets around timestamp {reset_ts}." if reset_ts else ""
            if remaining == "0" or "rate limit" in response.text.lower():
                token_hint = " You can configure a GITHUB_TOKEN in your environment or Settings to increase your hourly rate limit to 5,000 requests." if not self.token else ""
                raise GitHubAPIError(
                    f"GitHub API rate limit exceeded.{reset_str}{token_hint}",
                    status_code=429,
                    rate_limit_info=rate_limit
                )
            raise GitHubAPIError(f"GitHub API access denied: {response.text}", status_code=403, rate_limit_info=rate_limit)
        elif response.status_code >= 400:
            raise GitHubAPIError(f"GitHub API returned error {response.status_code}: {response.text}", status_code=response.status_code)

        data = response.json()
        _cache[cache_key] = {"data": data, "timestamp": now, "rate_limit": rate_limit}
        return data, rate_limit

    async def fetch_repository_data(self, owner: str, repo: str) -> Dict[str, Any]:
        """
        Retrieves repository metadata, contributors, issues, pull requests, and bounded review samples.
        """
        async with httpx.AsyncClient() as client:
            # 1. Repo Metadata
            metadata, rate_info = await self._fetch_json(client, f"/repos/{owner}/{repo}")

            # 2. Contributors (up to 100)
            try:
                contributors, _ = await self._fetch_json(client, f"/repos/{owner}/{repo}/contributors", {"per_page": 100})
                if not isinstance(contributors, list):
                    contributors = []
            except GitHubAPIError as e:
                # Some empty repos or repos without commits return 204 or error
                contributors = []

            # 3. Issues & Pull Requests
            # GitHub's /repos/{owner}/{repo}/issues returns both issues and PRs unless filtered.
            # We fetch up to 100 recent issues (state=all) to analyze recent backlog & resolution.
            issues_raw, _ = await self._fetch_json(client, f"/repos/{owner}/{repo}/issues", {
                "state": "all",
                "per_page": 100,
                "sort": "created",
                "direction": "desc"
            })

            # 4. Pull Requests specifically (up to 100, state=all)
            pulls_raw, _ = await self._fetch_json(client, f"/repos/{owner}/{repo}/pulls", {
                "state": "all",
                "per_page": 100,
                "sort": "created",
                "direction": "desc"
            })

            # Separate true issues (excluding those with 'pull_request' key)
            issues_only = [item for item in issues_raw if "pull_request" not in item]

            # 5. Bounded reviews sampling:
            # Bounded to at most 15 recent closed/merged or open PRs to calculate time to review
            # and maintainer review workload concentration without exhausting rate limits.
            sampled_prs = pulls_raw[:15] if isinstance(pulls_raw, list) else []
            reviews_by_pr: Dict[int, List[Dict[str, Any]]] = {}

            for pr in sampled_prs:
                pr_number = pr.get("number")
                if not pr_number:
                    continue
                try:
                    reviews_data, _ = await self._fetch_json(
                        client, f"/repos/{owner}/{repo}/pulls/{pr_number}/reviews", {"per_page": 20}
                    )
                    if isinstance(reviews_data, list):
                        reviews_by_pr[pr_number] = reviews_data
                except Exception:
                    # Non-fatal if single PR review fetch fails
                    continue

            return {
                "metadata": metadata,
                "contributors": contributors,
                "issues": issues_only,
                "pull_requests": pulls_raw,
                "reviews_by_pr": reviews_by_pr,
                "rate_limit": rate_info,
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
