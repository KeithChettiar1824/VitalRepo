import pytest
from backend.models import SimulationRequest
from backend.services.simulation_service import run_risk_simulation
from backend.services.demo_data import get_demo_repository_data

def test_risk_simulator_deterministic():
    demo = get_demo_repository_data().model_dump()
    req = SimulationRequest(
        contributor_login="sophiebits",
        scenario_days=14,
        capacity_reduction_percent=100
    )

    result = run_risk_simulation(req, demo)
    assert result.selected_contributor == "sophiebits"
    assert result.scenario_duration_days == 14
    assert result.capacity_reduction_percent == 100
    assert result.estimated_lost_reviews > 0
    assert result.estimated_delayed_prs_count >= 1
    assert len(result.backup_contributors) > 0
    assert "sophiebits" not in [b.login for b in result.backup_contributors]
    assert "Estimated Lost Review Capacity" in result.formula_used
    assert len(result.assumptions) >= 3

def test_risk_simulator_capacity_scaling():
    demo = get_demo_repository_data().model_dump()
    req_full = SimulationRequest(contributor_login="sophiebits", scenario_days=14, capacity_reduction_percent=100)
    req_half = SimulationRequest(contributor_login="sophiebits", scenario_days=14, capacity_reduction_percent=50)

    res_full = run_risk_simulation(req_full, demo)
    res_half = run_risk_simulation(req_half, demo)

    # Half capacity reduction should result in approximately half lost reviews
    assert round(res_full.estimated_lost_reviews / 2, 1) == pytest.approx(res_half.estimated_lost_reviews, abs=0.2)
