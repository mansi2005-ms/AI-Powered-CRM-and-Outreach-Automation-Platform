import pytest

from ai.extraction import company_matcher
from ai.extraction.company_matcher import (
    DUPLICATE_THRESHOLD,
    calculate_similarity,
    is_possible_duplicate,
)

# 10 pairs that ARE the same company (written differently): score high.
DUPLICATE_PAIRS = [
    ("Infosys Ltd", "Infosys Limited"),
    ("TCS", "Tata Consultancy Services"),
    ("Acme Healthcare Pvt Ltd", "Acme Healthcare"),
    ("Microsoft Corporation", "Microsoft Corp."),
    ("Marks & Spencer", "Marks and Spencer"),
    ("Microsft", "Microsoft"),
    ("HUL", "Hindustan Unilever Limited"),
    ("L&T", "Larsen and Toubro"),
    ("Info Sys", "Infosys"),
    ("IBM", "International Business Machines"),
]

# 10 DIFFERENT companies that share a root name: score low.
LOOKALIKE_PAIRS = [
    ("Acme Healthcare", "Acme Logistics"),
    ("Tata Steel", "Tata Motors"),
    ("Tata Consultancy Services", "Tata Steel"),
    ("Reliance Industries", "Reliance Jio"),
    ("HDFC Bank", "HDFC Life"),
    ("State Bank of India", "Bank of Baroda"),
    ("Alpha Pharma", "Alpha Logistics"),
    ("Sun Pharma", "Sun Microsystems"),
    ("Global Solutions", "Global Foods"),
    ("Bharat Petroleum", "Bharat Electronics"),
]


def test_has_20_pairs():
    assert len(DUPLICATE_PAIRS) + len(LOOKALIKE_PAIRS) == 20


@pytest.mark.parametrize("a,b", DUPLICATE_PAIRS)
def test_same_company_scores_high(a, b):
    result = calculate_similarity(a, b)
    assert result.score >= 0.85
    assert is_possible_duplicate(a, b)


@pytest.mark.parametrize("a,b", LOOKALIKE_PAIRS)
def test_lookalike_companies_score_low(a, b):
    result = calculate_similarity(a, b)
    assert result.score < 0.5
    assert not is_possible_duplicate(a, b)


@pytest.mark.parametrize("a,b", DUPLICATE_PAIRS + LOOKALIKE_PAIRS)
def test_score_is_in_range_and_symmetric(a, b):
    forward = calculate_similarity(a, b)
    backward = calculate_similarity(b, a)
    assert 0.0 <= forward.score <= 1.0
    assert forward.score == backward.score
    assert forward.explanation


# ---------------- explanations ----------------
def test_explanation_mentions_suffix_removal():
    result = calculate_similarity("Acme Healthcare Pvt Ltd", "Acme Healthcare")
    assert "Suffix removal" in result.explanation


def test_explanation_mentions_abbreviation_match():
    result = calculate_similarity("TCS", "Tata Consultancy Services")
    assert "Abbreviation match" in result.explanation


def test_explanation_mentions_token_overlap():
    result = calculate_similarity("Acme Healthcare", "Acme Logistics")
    assert "Token overlap" in result.explanation
    assert "'acme'" in result.explanation


def test_explanation_mentions_lookalike_guard():
    result = calculate_similarity("Acme Healthcare", "Acme Logistics")
    assert "Look-alike guard" in result.explanation
    assert "healthcare" in result.explanation
    assert "logistics" in result.explanation


def test_result_can_be_unpacked_as_score_and_explanation():
    score, explanation = calculate_similarity("Zoho Corp", "ZOHO Corporation")
    assert score == 1.0
    assert isinstance(explanation, str)


# ---------------- edge cases ----------------
def test_identical_names_score_one():
    assert calculate_similarity("Acme", "Acme").score == 1.0


@pytest.mark.parametrize("a,b", [("", "Acme"), (None, "Acme"), ("  ", None)])
def test_empty_or_missing_name_scores_zero(a, b):
    assert calculate_similarity(a, b).score == 0.0


def test_generic_word_difference_still_a_possible_duplicate():
    # "Technologies" is a generic word, so it should not hide the match.
    result = calculate_similarity("Wipro Technologies Ltd", "Wipro")
    assert result.score >= DUPLICATE_THRESHOLD


def test_only_proposes_never_merges():
    # The module exposes scoring only; there is no merge function.
    assert not any("merge" in n.lower() for n in dir(company_matcher))
    assert isinstance(is_possible_duplicate("Acme", "Acme Inc"), bool)


@pytest.mark.parametrize("short,long", [
    ("TCS", "Tata Steel"),
    ("ABC", "Alpha Beta Gamma"),
    ("IBM", "International Business Software"),
])
def test_abbreviation_needs_matching_initials(short, long):
    # The initials must really spell the short name to count as an acronym.
    result = calculate_similarity(short, long)
    assert "Abbreviation match" not in result.explanation
    assert result.score < 0.5
