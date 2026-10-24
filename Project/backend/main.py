import time
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import GITHUB_TOKEN, OLLAMA_BASE_URL, OLLAMA_MODEL
from backend.models import (
    RepoAnalyzeRequest,
    FullRepoAnalysis,
    SimulationRequest,
    SimulationResult,
    AISimulationExplanation,
    AIHealthExplanation,
    RepoMetadata
)
from backend.services.github_service import (
    parse_github_url,
    GitHubService,
    GitHubAPIError,
    clear_cache,
    get_cache_stats
)
from backend.services.metrics_calculator import (
    calculate_maintainer_concentration,
    calculate_issue_backlog,
    calculate_pr_bottlenecks,
    calculate_health_score,
    generate_signals_and_evidence,
    build_activity_trends
)
from backend.services.simulation_service import run_risk_simulation
from backend.services.ai_service import AIService
from backend.services.demo_data import get_demo_repository_data

app = FastAPI(
    title="VitalRepo API",
    description="AI-powered open-source repository health analyzer and maintainer risk simulator.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Runtime state for optional runtime token override
runtime_settings = {
    "github_token": GITHUB_TOKEN,
    "ollama_base_url": OLLAMA_BASE_URL,
    "ollama_model": OLLAMA_MODEL
}

def get_github_service() -> GitHubService:
    return GitHubService(token=runtime_settings["github_token"])

def get_ai_service() -> AIService:
    return AIService(
        base_url=runtime_settings["ollama_base_url"],
        model=runtime_settings["ollama_model"]
    )

@app.get("/")
def read_root():
    return {
        "app": "VitalRepo API",
        "status": "running",
        "documentation": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    ai_status = await get_ai_service().check_availability()
    cache_stats = get_cache_stats()
    has_token = bool(runtime_settings["github_token"])
    return {
        "status": "healthy",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "github_api": {
            "token_configured": has_token,
            "rate_limit_tier": "5,000 req/hr (Authenticated)" if has_token else "60 req/hr (Unauthenticated)",
        },
        "ollama_ai": ai_status,
        "cache": cache_stats
    }

class SettingsUpdate(BaseModel):
    github_token: Optional[str] = None
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None

@app.post("/api/settings")
def update_settings(payload: SettingsUpdate):
    if payload.github_token is not None:
        runtime_settings["github_token"] = payload.github_token.strip()
    if payload.ollama_base_url is not None:
        runtime_settings["ollama_base_url"] = payload.ollama_base_url.strip()
    if payload.ollama_model is not None:
        runtime_settings["ollama_model"] = payload.ollama_model.strip()
    return {
        "status": "updated",
        "has_github_token": bool(runtime_settings["github_token"]),
        "ollama_base_url": runtime_settings["ollama_base_url"],
        "ollama_model": runtime_settings["ollama_model"]
    }

@app.post("/api/cache/clear")
def handle_clear_cache():
    clear_cache()
    return {"status": "cleared", "message": "In-memory cache cleared successfully."}

@app.get("/api/demo", response_model=FullRepoAnalysis)
def get_demo():
    """Returns curated demo dataset for react repository."""
    return get_demo_repository_data()

@app.post("/api/analyze", response_model=FullRepoAnalysis)
async def analyze_repository(req: RepoAnalyzeRequest):
    """
    Analyzes a public GitHub repository URL, calculates real metrics, and returns evidence.
    """
    owner, repo = parse_github_url(req.url)
    gh = get_github_service()

    try:
        raw_data = await gh.fetch_repository_data(owner, repo)
    except GitHubAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error retrieving repository: {str(e)}")

    meta_raw = raw_data.get("metadata", {})
    contributors_raw = raw_data.get("contributors", [])
    issues_raw = raw_data.get("issues", [])
    pulls_raw = raw_data.get("pull_requests", [])
    reviews_by_pr = raw_data.get("reviews_by_pr", {})
    rate_info = raw_data.get("rate_limit", {})
    fetched_at = raw_data.get("fetched_at", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))

    # Build Metadata Model
    metadata = RepoMetadata(
        owner=owner,
        name=repo,
        full_name=meta_raw.get("full_name", f"{owner}/{repo}"),
        description=meta_raw.get("description"),
        html_url=meta_raw.get("html_url", f"https://github.com/{owner}/{repo}"),
        language=meta_raw.get("language"),
        stars_count=meta_raw.get("stargazers_count", 0),
        forks_count=meta_raw.get("forks_count", 0),
        open_issues_count=meta_raw.get("open_issues_count", 0),
        license_name=meta_raw.get("license", {}).get("name") if meta_raw.get("license") else None,
        default_branch=meta_raw.get("default_branch", "main"),
        created_at=meta_raw.get("created_at", ""),
        pushed_at=meta_raw.get("pushed_at", ""),
        last_analyzed_at=fetched_at,
        is_demo=False
    )

    # 1. Maintainer Concentration
    concentration, contributor_stats = calculate_maintainer_concentration(contributors_raw)

    # 2. Issue Backlog
    backlog = calculate_issue_backlog(meta_raw, issues_raw, req.period_days)

    # 3. PR Bottlenecks
    pr_bottleneck, pending_items, rev_counts = calculate_pr_bottlenecks(pulls_raw, reviews_by_pr, req.period_days)

    # Attach observed reviews to contributor stats where applicable
    for c in contributor_stats:
        if c.login in rev_counts:
            c.reviews_count = rev_counts[c.login]

    # 4. Overall Health Indicator
    health = calculate_health_score(concentration, backlog, pr_bottleneck, meta_raw.get("pushed_at"))

    # 5. Signals Worth Attention & Evidence
    signals = generate_signals_and_evidence(
        repo_url=metadata.html_url,
        concentration=concentration,
        backlog=backlog,
        pr_metric=pr_bottleneck,
        top_contributors=contributor_stats,
        pending_items=pending_items,
        period_days=req.period_days
    )

    # 6. Activity Trends
    activity_trends = build_activity_trends(issues_raw, pulls_raw, req.period_days)

    return FullRepoAnalysis(
        metadata=metadata,
        health=health,
        maintainer_concentration=concentration,
        issue_backlog=backlog,
        pr_bottleneck=pr_bottleneck,
        top_contributors=contributor_stats[:25],
        signals=signals,
        activity_trends=activity_trends,
        pending_prs_sample=pending_items[:15],
        data_coverage={
            "contributors_sampled": len(contributors_raw),
            "issues_sampled": len(issues_raw),
            "prs_sampled": len(pulls_raw),
            "reviews_sampled": len(reviews_by_pr),
            "is_complete_history": False,
            "period_days": req.period_days,
            "mode": "LIVE_GITHUB_API"
        },
        rate_limit_info=rate_info,
        is_demo=False
    )

@app.post("/api/simulate", response_model=SimulationResult)
def simulate_maintainer_risk(req: SimulationRequest):
    """
    Runs a deterministic what-if simulation evaluating the temporary unavailability of a key maintainer.
    """
    if req.repo_context:
        repo_data = req.repo_context
    elif req.repo_url:
        # If demo url or no context, use demo data as baseline
        repo_data = get_demo_repository_data().model_dump()
    else:
        raise HTTPException(status_code=400, detail="Either repo_context or repo_url must be provided for simulation.")

    result = run_risk_simulation(req, repo_data)
    return result

@app.post("/api/ai/explain-simulation", response_model=AISimulationExplanation)
async def explain_simulation_with_ai(sim_result: Dict[str, Any]):
    """
    Invokes Ollama with the configured open-weight model to explain deterministic simulation results.
    """
    ai = get_ai_service()
    return await ai.explain_simulation(sim_result)

@app.post("/api/ai/explain-health", response_model=AIHealthExplanation)
async def explain_health_with_ai(health_payload: Dict[str, Any]):
    """
    Invokes Ollama to provide executive recommendations on repository sustainability.
    """
    ai = get_ai_service()
    return await ai.explain_health(health_payload)
