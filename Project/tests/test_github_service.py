import pytest
from backend.services.github_service import parse_github_url, GitHubAPIError

def test_parse_valid_github_urls():
    assert parse_github_url("https://github.com/facebook/react") == ("facebook", "react")
    assert parse_github_url("https://github.com/facebook/react/") == ("facebook", "react")
    assert parse_github_url("http://github.com/fastapi/fastapi") == ("fastapi", "fastapi")
    assert parse_github_url("https://github.com/owner/repo.git") == ("owner", "repo")
    assert parse_github_url("github.com/torvalds/linux") == ("torvalds", "linux")
    assert parse_github_url("pallets/flask") == ("pallets", "flask")

def test_parse_invalid_github_urls():
    with pytest.raises(GitHubAPIError):
        parse_github_url("")

    with pytest.raises(GitHubAPIError):
        parse_github_url("https://notgithub.com/facebook/react")

    with pytest.raises(GitHubAPIError):
        parse_github_url("justausername")

    with pytest.raises(GitHubAPIError):
        parse_github_url("https://github.com/")

    with pytest.raises(GitHubAPIError):
        parse_github_url("owner/repo/extra/path")
