import httpx
import pytest

from app.main import app


@pytest.mark.asyncio
async def test_autonomous_mode_toggle() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Get default mode
        get_res = await client.get("/api/autonomous/mode")
        assert get_res.status_code == 200
        assert get_res.json()["data"]["enabled"] is False

        # Toggle to True
        post_res = await client.post("/api/autonomous/mode", json={"enabled": True})
        assert post_res.status_code == 200
        assert post_res.json()["data"]["enabled"] is True

        # Toggle back to False
        post_res_false = await client.post("/api/autonomous/mode", json={"enabled": False})
        assert post_res_false.status_code == 200
        assert post_res_false.json()["data"]["enabled"] is False


@pytest.mark.asyncio
async def test_list_pending_decisions() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/autonomous/decisions")
        assert res.status_code == 200
        data = res.json()["data"]
        assert len(data) > 0
        first = data[0]
        assert "id" in first
        assert "agent" in first
        assert "action" in first
        assert "target" in first
        assert "confidence" in first


@pytest.mark.asyncio
async def test_approve_and_history_learning_loop() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Approve crowd decision
        app_res = await client.post(
            "/api/autonomous/decisions/dec_crowd_001/approve",
            json={"operatorName": "test-operator-unit"},
        )
        assert app_res.status_code == 200
        res_data = app_res.json()["data"]
        assert res_data["actionType"] == "OPEN_GATE"
        assert res_data["operator"] == "test-operator-unit"

        # Check execution history
        hist_res = await client.get("/api/autonomous/history")
        assert hist_res.status_code == 200
        hist_data = hist_res.json()["data"]
        assert len(hist_data) > 0
        assert any(item["decisionId"] == "dec_crowd_001" for item in hist_data)

        # Check learning engine record logging
        learn_res = await client.get("/api/autonomous/learning")
        assert learn_res.status_code == 200
        learn_data = learn_res.json()["data"]
        assert len(learn_data) > 0
        assert any("OPEN_GATE (Gate B)" in record["action"] for record in learn_data)


@pytest.mark.asyncio
async def test_reject_decision() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        rej_res = await client.post("/api/autonomous/decisions/dec_emg_001/reject")
        assert rej_res.status_code == 200
        assert "rejected" in rej_res.json()["message"]


@pytest.mark.asyncio
async def test_run_vision_assessment() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Critical density test
        vis_res_crit = await client.post(
            "/api/vision/assess",
            json={
                "cameraId": "CAM-99",
                "zone": "Gate A Queue",
                "estimatedPeople": 3200,
                "density": "HIGH",
            },
        )
        assert vis_res_crit.status_code == 200
        data_crit = vis_res_crit.json()["data"]
        assert data_crit["riskLevel"] == "CRITICAL"
        assert data_crit["abnormalMovementDetected"] is True
        assert "Initialize secondary egress checkpoints" in data_crit["operationalRecommendation"]

        # Low density test
        vis_res_low = await client.post(
            "/api/vision/assess",
            json={
                "cameraId": "CAM-99",
                "zone": "Gate A Queue",
                "estimatedPeople": 100,
                "density": "LOW",
            },
        )
        assert vis_res_low.status_code == 200
        data_low = vis_res_low.json()["data"]
        assert data_low["riskLevel"] == "LOW"
        assert data_low["abnormalMovementDetected"] is False
        assert "Routine gate ingress surveillance" in data_low["operationalRecommendation"]
