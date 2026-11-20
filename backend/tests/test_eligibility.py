import pytest

from backend.app.services.eligibility import is_eligible_for_campaign


@pytest.mark.parametrize(
    "opportunity, expected",
    [
        ({"score": 59}, "Held"),
        ({"score": 60}, "Researcher Review Required"),
        ({"score": 79}, "Researcher Review Required"),
        ({"score": 80}, "Eligible"),
        (
            {"score": 95, "is_suppressed": True},
            "Strictly Not Eligible"
        ),
    ],
)
def test_is_eligible_for_campaign(opportunity, expected):
    assert is_eligible_for_campaign(opportunity) == expected