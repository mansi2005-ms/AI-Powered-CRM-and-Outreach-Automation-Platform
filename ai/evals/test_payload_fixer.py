
import pytest

from ai.diagnosis.payload_fixer import suggest_payload_fix


class FakeGeminiClient:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error

    def generate(self, prompt, schema=None, temperature=0.1):
        if self.error:
            raise self.error
        return self.response, {}


def make_response(changes, corrected_payload=None, retry=None):
    return {
        "summary": "Payload validation error.",
        "corrected_payload": corrected_payload,
        "changes": changes,
        "needs_human_input": [],
        "retry_parameters": retry,
    }


def test_valid_integer_conversion():
    payload = {"age": "20"}
    response = make_response(
        [{"path": "age", "issue": "Expected integer", "new_value": 20}],
        {"age": 20},
    )

    result = suggest_payload_fix(
        payload,
        "age must be integer",
        client=FakeGeminiClient(response),
    )

    assert result["corrected_payload"] == {"age": 20}
    assert len(result["changes"]) == 1
    assert result["needs_human_input"] == []


def test_reject_invented_value():
    payload = {"age": "wrong"}
    response = make_response(
        [{"path": "age", "issue": "Expected integer", "new_value": 20}],
        {"age": 20},
    )

    result = suggest_payload_fix(
        payload,
        "age must be integer",
        client=FakeGeminiClient(response),
    )

    assert result["corrected_payload"] is None
    assert result["changes"] == []
    assert result["needs_human_input"]


def test_missing_required_field():
    payload = {"name": "Test"}
    response = make_response(
        [{
            "path": "email",
            "issue": "Required field missing",
            "new_value": "test@example.com",
        }],
        {"name": "Test", "email": "test@example.com"},
    )

    result = suggest_payload_fix(
        payload,
        "Missing required email",
        client=FakeGeminiClient(response),
    )

    assert result["corrected_payload"] is None
    assert result["changes"] == []
    assert result["needs_human_input"]


def test_nested_array_conversion():
    payload = {
        "items": [
            {"quantity": "3"},
            {"quantity": 2},
        ]
    }

    response = make_response(
        [{
            "path": "items[0].quantity",
            "issue": "Expected integer",
            "new_value": 3,
        }]
    )

    result = suggest_payload_fix(
        payload,
        "First quantity must be integer",
        client=FakeGeminiClient(response),
    )

    assert result["corrected_payload"] == {
        "items": [
            {"quantity": 3},
            {"quantity": 2},
        ]
    }


def test_uncertain_iso_date():
    payload = {"delivery_date": "20/11/2026"}
    response = make_response(
        [{
            "path": "delivery_date",
            "issue": "Expected ISO 8601 date",
            "new_value": "2026-11-20",
        }]
    )

    result = suggest_payload_fix(
        payload,
        "Invalid ISO date",
        client=FakeGeminiClient(response),
    )

    assert result["corrected_payload"] is None
    assert result["needs_human_input"]


@pytest.mark.parametrize(
    "category",
    [
        "send_timeout",
        "provider_rejection",
        "permanent_provider_rejection",
    ],
)
def test_blocked_retry_categories(category):
    response = make_response(
        [],
        retry={"retry_count": 3, "delay_seconds": 60},
    )

    result = suggest_payload_fix(
        {"job_id": "123"},
        "Delivery failed",
        category=category,
        client=FakeGeminiClient(response),
    )

    assert result["retry_parameters"] is None


def test_api_failure_fallback():
    result = suggest_payload_fix(
        {"name": "Test"},
        "Validation error",
        client=FakeGeminiClient(error=TimeoutError("API timeout")),
    )

    assert result["corrected_payload"] is None
    assert result["retry_parameters"] is None
    assert result["needs_human_input"]


def test_invalid_ai_response_fallback():
    result = suggest_payload_fix(
        {"name": "Test"},
        "Validation error",
        client=FakeGeminiClient({"unexpected": "data"}),
    )

    assert result["corrected_payload"] is None
    assert result["needs_human_input"]


@pytest.mark.parametrize(
    "retry_params",
    [
        {"retry_count": -1},
        {"delay_seconds": -10},
        {"batch_size": 201},
        {"batch_size": 0},
        {"batch_size": "100"},
        {"retry_count": True},
        {"unknown_parameter": 5},
    ],
)
def test_invalid_retry_parameters(retry_params):
    response = make_response(
        [],
        retry=retry_params,
    )

    result = suggest_payload_fix(
        {"job_id": "123"},
        "Temporary processing failure",
        category="temporary_error",
        client=FakeGeminiClient(response),
    )

    assert result["retry_parameters"] is None
    assert result["needs_human_input"]


def test_valid_retry_parameters():
    response = make_response(
        [],
        retry={
            "retry_count": 2,
            "delay_seconds": 30,
            "batch_size": 100,
        },
    )

    result = suggest_payload_fix(
        {"job_id": "123"},
        "Temporary processing failure",
        category="temporary_error",
        client=FakeGeminiClient(response),
    )

    assert result["retry_parameters"] == {
        "retry_count": 2,
        "delay_seconds": 30,
        "batch_size": 100,
    }
