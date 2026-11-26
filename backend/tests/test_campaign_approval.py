from contextlib import contextmanager

import pytest
from fastapi.testclient import TestClient

from backend.app.core import security
from backend.app.main import app
from backend.app.api.v1 import approvals as approvals_api


client = TestClient(app)


def test_build_content_hash_is_deterministic_and_recipient_locked():
    first = approvals_api.build_content_hash(
        "candidate@example.com",
        "Hello",
        "Welcome to our team.",
    )
    second = approvals_api.build_content_hash(
        "candidate@example.com",
        "Hello",
        "Welcome to our team.",
    )

    assert first == second
    assert len(first) == 64
    assert first != approvals_api.build_content_hash(
        "other@example.com",
        "Hello",
        "Welcome to our team.",
    )


def test_edit_draft_invalidates_active_approval(monkeypatch):
    class FakeCursor:
        def __init__(self):
            self.executions = []

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def execute(self, sql, params=None):
            self.executions.append((sql, params))

    class FakeConnection:
        def __init__(self):
            self.cur = FakeCursor()

        def cursor(self):
            return self.cur

    fake_connection = FakeConnection()

    @contextmanager
    def fake_transaction():
        yield fake_connection

    monkeypatch.setattr(approvals_api, "_fetch_draft", lambda draft_id: (
        draft_id,
        {"subject": "Original", "body": "Original body"},
        "Original",
        "Original body",
        "approved",
        "candidate@example.com",
    ))
    monkeypatch.setattr(approvals_api, "transaction", fake_transaction)

    result = approvals_api.edit_approved_draft(
        "draft-123",
        approvals_api.DraftEditRequest(
            edited_subject="Revised",
            edited_body="Revised body",
        ),
        {"id": "manager-1", "role": "campaign_manager"},
    )

    assert result == {"status": "invalidated", "draft_id": "draft-123"}
    assert len(fake_connection.cur.executions) == 2
    assert "UPDATE campaign_drafts" in fake_connection.cur.executions[0][0]
    assert "UPDATE approvals" in fake_connection.cur.executions[1][0]


def test_approval_requires_campaign_manager_or_admin(monkeypatch):
    app.dependency_overrides[security.get_current_user] = lambda: {
        "id": "developer-1",
        "email": "developer@example.com",
        "role": "developer",
    }

    try:
        response = client.post(
            "/api/v1/approvals",
            json={"draft_id": "draft-123", "approved": True},
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(security.get_current_user, None)


@pytest.mark.parametrize(
    "role",
    ["admin", "campaign_manager"],
)
def test_allowed_roles_can_create_content_hash(monkeypatch, role):
    class FakeCursor:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def execute(self, sql, params=None):
            pass

        def fetchone(self):
            return ("approval-123",)

    class FakeConnection:
        def cursor(self):
            return FakeCursor()

    @contextmanager
    def fake_transaction():
        yield FakeConnection()

    monkeypatch.setattr(
        approvals_api,
        "_fetch_draft",
        lambda draft_id: (
            draft_id,
            {"subject": "AI subject", "body": "AI body"},
            None,
            None,
            "generated",
            "candidate@example.com",
        ),
    )
    monkeypatch.setattr(approvals_api, "transaction", fake_transaction)

    app.dependency_overrides[security.get_current_user] = lambda: {
        "id": "manager-1",
        "email": "manager@example.com",
        "role": role,
    }

    try:
        response = client.post(
            "/api/v1/approvals",
            json={
                "draft_id": "draft-123",
                "approved": True,
                "edited_subject": "Locked subject",
                "edited_body": "Locked body",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["draft_id"] == "draft-123"
        assert data["approval_id"] == "approval-123"
        assert len(data["content_hash"]) == 64
        assert data["content_hash"] == approvals_api.build_content_hash(
            "candidate@example.com",
            "Locked subject",
            "Locked body",
        )
    finally:
        app.dependency_overrides.pop(security.get_current_user, None)
