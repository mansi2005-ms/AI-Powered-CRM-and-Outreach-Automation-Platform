
import copy
import json
import logging
import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from ai.config import get_ai_config
from ai.gemini_client import GeminiClient
from ai.diagnosis.error_diagnoser import redact_sensitive_data

logger = logging.getLogger(__name__)

BLOCKED_RETRY_CATEGORIES = {
    "send_timeout",
    "provider_rejection",
    "permanent_provider_rejection",
}


class PayloadChange(BaseModel):
    """Describe one proposed change to a JSON payload."""

    model_config = ConfigDict(extra="forbid")

    path: str
    issue: str
    new_value: Any = None


class PayloadFixOutput(BaseModel):
    """Validated payload correction proposal."""

    model_config = ConfigDict(extra="forbid")

    summary: str
    corrected_payload: Optional[Dict[str, Any]] = None
    changes: List[PayloadChange] = Field(default_factory=list)
    needs_human_input: List[str] = Field(default_factory=list)
    retry_parameters: Optional[Dict[str, Any]] = None


def _fallback_payload_fix() -> Dict[str, Any]:
    """Return a safe response when analysis fails."""
    return PayloadFixOutput(
        summary="Payload analysis unavailable. Manual review required.",
        corrected_payload=None,
        changes=[],
        needs_human_input=[
            "Review the original payload and error message."
        ],
        retry_parameters=None,
    ).model_dump()


def _mock_payload_fix(
    payload: Dict[str, Any],
    error_message: str,
) -> Dict[str, Any]:
    """Offline response without Gemini API calls."""
    return PayloadFixOutput(
        summary="Mock mode: manual payload review required.",
        corrected_payload=None,
        changes=[],
        needs_human_input=[
            "Review the failing payload and error message."
        ],
        retry_parameters=None,
    ).model_dump()


def _get_value(payload: Dict[str, Any], path: str):
    """Read a value using paths such as items[0].age."""
    parts = re.findall(r"[^.\[\]]+", path)
    current = payload

    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list) and part.isdigit():
            index = int(part)
            if index >= len(current):
                raise KeyError(path)
            current = current[index]
        else:
            raise KeyError(path)

    return current


def _set_value(payload: Dict[str, Any], path: str, value: Any):
    """Update an existing field without creating missing fields."""
    parts = re.findall(r"[^.\[\]]+", path)
    if not parts:
        raise KeyError(path)

    current = payload

    for part in parts[:-1]:
        if isinstance(current, dict):
            current = current[part]
        elif isinstance(current, list) and part.isdigit():
            current = current[int(part)]
        else:
            raise KeyError(path)

    last = parts[-1]

    if isinstance(current, dict) and last in current:
        current[last] = value
    elif isinstance(current, list) and last.isdigit():
        current[int(last)] = value
    else:
        raise KeyError(path)


def _safe_conversion(old_value: Any, new_value: Any, issue: str) -> bool:
    """Allow only simple, explicitly supported type conversions."""
    description = issue.lower()

    if isinstance(old_value, str):
        if (
            "integer" in description
            and type(new_value) is int
            and re.fullmatch(r"[+-]?\d+", old_value.strip())
        ):
            return int(old_value.strip()) == new_value

        if (
            ("number" in description or "float" in description)
            and type(new_value) in (int, float)
        ):
            try:
                return float(old_value.strip()) == float(new_value)
            except (ValueError, OverflowError):
                return False

        if "boolean" in description and type(new_value) is bool:
            text = old_value.strip().lower()
            return (
                (text == "true" and new_value is True)
                or (text == "false" and new_value is False)
            )

    return False


def _check_proposed_changes(
    original_payload: Dict[str, Any],
    result: PayloadFixOutput,
) -> PayloadFixOutput:
    """Accept only supported changes and flag uncertain proposals."""
    corrected = copy.deepcopy(original_payload)
    accepted_changes = []
    warnings = list(result.needs_human_input)

    for change in result.changes:
        try:
            old_value = _get_value(original_payload, change.path)

            if _safe_conversion(
                old_value,
                change.new_value,
                change.issue,
            ):
                _set_value(
                    corrected,
                    change.path,
                    change.new_value,
                )
                accepted_changes.append(change)
            else:
                warnings.append(
                    f"Manual review required for '{change.path}': "
                    f"{change.issue}"
                )

        except (KeyError, IndexError, TypeError, ValueError):
            warnings.append(
                f"Missing or unsupported field '{change.path}' "
                "requires manual review."
            )

    result.changes = accepted_changes
    result.needs_human_input = list(dict.fromkeys(warnings))
    result.corrected_payload = (
        corrected if accepted_changes else None
    )

    return result


def _validate_retry_parameters(
    params: Optional[Dict[str, Any]],
) -> bool:
    """Validate retry suggestions without executing any retries."""
    if not isinstance(params, dict) or not params:
        return False

    allowed_keys = {
        "retry_count",
        "delay_seconds",
        "batch_size",
    }

    if not set(params).issubset(allowed_keys):
        return False

    for key, value in params.items():
        if type(value) is not int:
            return False

        if key == "batch_size":
            if not 1 <= value <= 200:
                return False
        elif value < 0:
            return False

    return True


def suggest_payload_fix(
    payload: Dict[str, Any],
    error_message: str,
    category: str = "invalid_input",
    client=None,
) -> Dict[str, Any]:
    """Suggest corrections without modifying or retrying the original."""
    try:
        safe_payload = redact_sensitive_data(payload)
        safe_error = redact_sensitive_data(error_message)
        safe_category = redact_sensitive_data(category)

        config = get_ai_config()

        if client is None and config.mock_mode:
            return _mock_payload_fix(safe_payload, safe_error)

        schema = PayloadFixOutput.model_json_schema()

        prompt = (
            "You are an n8n JSON payload repair assistant.\n"
            "Analyse the failing JSON payload and error message.\n"
            "Work with generic JSON payloads, not one fixed schema.\n"
            "Never invent missing values, emails, IDs, or URLs.\n"
            "List unknown values in needs_human_input.\n"
            "Propose corrected_payload and field-level changes.\n"
            "Use paths such as items[0].age.\n"
            "Suggest retry parameters only when appropriate.\n"
            "Batch size must not exceed 200.\n"
            "Never retry send_timeout, provider_rejection, "
            "or permanent_provider_rejection.\n"
            "Never execute or submit anything.\n"
            "Return JSON matching the supplied schema.\n\n"
            f"Category: {safe_category}\n"
            f"Error: {safe_error}\n"
            f"Payload: {json.dumps(safe_payload, ensure_ascii=False)}"
        )

        ai_client = client if client is not None else GeminiClient()
        response, _usage = ai_client.generate(
            prompt,
            schema=schema,
            temperature=0.1,
        )

        validated = PayloadFixOutput.model_validate(response)

        validated = _check_proposed_changes(
            safe_payload,
            validated,
        )

        if safe_category in BLOCKED_RETRY_CATEGORIES:
            validated.retry_parameters = None

        elif validated.retry_parameters is not None:
            if not _validate_retry_parameters(
                validated.retry_parameters
            ):
                validated.retry_parameters = None
                validated.needs_human_input.append(
                    "Review invalid retry parameters manually."
                )

        return validated.model_dump()

    except Exception:
        logger.warning(
            "Payload fix analysis failed; returning safe fallback."
        )
        return _fallback_payload_fix()
