from starlette.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "github_api" in data
    assert "ollama_ai" in data

def test_demo_endpoint():
    response = client.get("/api/demo")
    assert response.status_code == 200
    data = response.json()
    assert data["is_demo"] is True
    assert data["metadata"]["owner"] == "facebook"
    assert data["metadata"]["name"] == "react"
    assert len(data["top_contributors"]) > 0
    assert data["health"]["overall_score"] > 0
    assert len(data["signals"]) > 0

def test_simulation_endpoint():
    demo_res = client.get("/api/demo")
    demo_data = demo_res.json()

    payload = {
        "contributor_login": "gaearon",
        "scenario_days": 14,
        "capacity_reduction_percent": 100,
        "repo_context": demo_data
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["selected_contributor"] == "gaearon"
    assert result["scenario_duration_days"] == 14
    assert result["estimated_lost_reviews"] > 0

def test_ai_offline_fallback():
    # Should not throw 500 error when Ollama is offline; should return is_available=False with instructions
    payload = {
        "selected_contributor": "test_user",
        "scenario_duration_days": 14,
        "capacity_reduction_percent": 100,
        "contributor_daily_review_rate": 0.5,
        "estimated_lost_reviews": 7.0,
        "estimated_delayed_prs_count": 5,
        "total_open_prs_at_risk": 10,
        "backup_coverage_status": "Fragile",
        "assumptions": ["test assumption"]
    }
    response = client.post("/api/ai/explain-simulation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "is_available" in data
    if not data["is_available"]:
        assert "Ollama" in data["error_message"] or "reach" in data["error_message"]
