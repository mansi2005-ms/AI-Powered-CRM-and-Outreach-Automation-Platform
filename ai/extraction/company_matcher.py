"""AI-07: Fuzzy company-name matcher.

``calculate_similarity(company_a, company_b)`` returns a similarity score
(0.0 to 1.0) and a plain-English explanation.

How the score is built:
  1. Normalise both names (lowercase, accents, punctuation, ``&``).
  2. Remove legal suffixes such as ``Pvt Ltd`` / ``Inc`` / ``LLC``.
  3. Exact / spacing match, then abbreviation match (``TCS``).
  4. Weighted token overlap, with tolerance for small typos.
  5. Look-alike guard: if both names share a root word but each has its
     own distinguishing word (``Acme Healthcare`` vs ``Acme Logistics``),
     the score is capped low.

This module only PROPOSES duplicate candidates. It never merges records
and has no side effects. Only the standard library is used.
"""
from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher
from typing import List, NamedTuple, Optional, Tuple

# Score at or above this value means "possible duplicate, ask a human".
DUPLICATE_THRESHOLD = 0.75
# Highest score allowed when both names have their own distinguishing word.
LOOKALIKE_CAP = 0.45
ABBREVIATION_SCORE = 0.90
SPACING_SCORE = 0.95
FUZZY_TOKEN_THRESHOLD = 0.85
FUZZY_MIN_LENGTH = 5
GENERIC_WEIGHT = 0.3

# Legal-form words. Removed only from the END of a name.
_SUFFIXES = frozenset({
    "pvt", "private", "ltd", "limited", "inc", "incorporated", "corp",
    "corporation", "co", "company", "llc", "llp", "plc", "gmbh", "ag",
    "sa", "bv", "nv", "pte", "pty", "lp", "opc",
})
_STOPWORDS = frozenset({"and", "of", "the", "for"})
# Common descriptive words: kept, but they count for much less than a
# distinctive word such as "healthcare" or "logistics".
_GENERIC_WORDS = frozenset({
    "technologies", "technology", "tech", "solutions", "solution",
    "services", "service", "systems", "system", "software", "group",
    "global", "international", "india", "labs", "lab", "consulting",
    "enterprises", "enterprise", "industries", "industry", "holdings",
    "ventures", "digital", "networks", "network",
})


class SimilarityResult(NamedTuple):
    score: float        # 0.0 (different) to 1.0 (same)
    explanation: str    # why the score is what it is


# --------------------------------------------------------------------------
# Step 1: clean the names
# --------------------------------------------------------------------------
def _normalize(name: str) -> str:
    text = unicodedata.normalize("NFKD", name)
    text = "".join(c for c in text if not unicodedata.combining(c)).lower()
    # "L&T" -> "lt", "AT&T" -> "att" (short pieces around an ampersand)
    text = re.sub(r"\b(\w{1,2})\s*&\s*(\w{1,2})\b", r"\1\2", text)
    text = text.replace("&", " and ")
    text = text.replace(".", "")          # "T.C.S." -> "tcs"
    return re.sub(r"[\W_]+", " ", text).strip()


def _join_initials(tokens: List[str]) -> List[str]:
    """Join runs of single letters: ["t", "c", "s"] -> ["tcs"]."""
    merged: List[str] = []
    run = ""
    for token in tokens + [""]:
        if len(token) == 1 and token.isalpha():
            run += token
            continue
        if run:
            merged.append(run)
            run = ""
        if token:
            merged.append(token)
    return merged


def _split(name: Optional[str]) -> Tuple[List[str], List[str], List[str]]:
    """Return (clean_tokens, removed_suffixes, all_tokens)."""
    if not isinstance(name, str):
        name = ""
    tokens = [t for t in _normalize(name).split() if t not in _STOPWORDS]
    tokens = _join_initials(tokens)
    clean = list(tokens)
    removed: List[str] = []
    while len(clean) > 1 and clean[-1] in _SUFFIXES:
        removed.insert(0, clean.pop())
    return clean, removed, tokens


# --------------------------------------------------------------------------
# Step 2: abbreviation match (TCS = Tata Consultancy Services)
# --------------------------------------------------------------------------
def _acronym(tokens: List[str]) -> str:
    return "".join(t[0] for t in tokens)


def _is_acronym_of(short: List[str], long_clean: List[str],
                   long_all: List[str]) -> bool:
    if len(short) != 1 or len(long_clean) < 2:
        return False
    word = short[0]
    if not word.isalpha() or not 2 <= len(word) <= 6:
        return False
    # "HUL" counts the "L" of "Limited", so also try all tokens.
    return word in (_acronym(long_clean), _acronym(long_all))


# --------------------------------------------------------------------------
# Step 3: weighted token overlap with small-typo tolerance
# --------------------------------------------------------------------------
def _weight(token: str) -> float:
    return GENERIC_WEIGHT if token in _GENERIC_WORDS else 1.0


def _token_credit(a: str, b: str) -> float:
    if a == b:
        return 1.0
    if min(len(a), len(b)) < FUZZY_MIN_LENGTH:
        return 0.0
    ratio = SequenceMatcher(None, a, b).ratio()
    return ratio if ratio >= FUZZY_TOKEN_THRESHOLD else 0.0


def _match_tokens(a: List[str], b: List[str]) -> List[Tuple[int, int, float]]:
    """Greedy one-to-one matching, best matches first."""
    pairs = []
    for i, token_a in enumerate(a):
        for j, token_b in enumerate(b):
            credit = _token_credit(token_a, token_b)
            if credit > 0:
                pairs.append((credit, i, j))
    pairs.sort(key=lambda p: (-p[0], p[1], p[2]))
    used_a, used_b = set(), set()
    matches = []
    for credit, i, j in pairs:
        if i in used_a or j in used_b:
            continue
        used_a.add(i)
        used_b.add(j)
        matches.append((i, j, credit))
    return matches


# --------------------------------------------------------------------------
# Public functions
# --------------------------------------------------------------------------
def calculate_similarity(
    company_a: Optional[str], company_b: Optional[str]
) -> SimilarityResult:
    """Compare two company names.

    Returns ``SimilarityResult(score, explanation)``. The score is between
    0.0 and 1.0. Names that only share a root word but differ in the rest
    (``Acme Healthcare`` vs ``Acme Logistics``) score low.

    This only proposes duplicate candidates; it never merges anything.
    """
    a_clean, a_removed, a_all = _split(company_a)
    b_clean, b_removed, b_all = _split(company_b)
    if not a_clean or not b_clean:
        return SimilarityResult(0.0, "One or both company names are empty.")

    reasons: List[str] = []
    removed = sorted(set(a_removed + b_removed))
    if removed:
        reasons.append("Suffix removal: dropped " + ", ".join(removed))

    if a_clean == b_clean:
        reasons.insert(
            0, "Exact match after ignoring case, punctuation and suffixes"
        )
        return SimilarityResult(1.0, "; ".join(reasons))

    if "".join(a_clean) == "".join(b_clean):
        reasons.insert(0, "Same letters, only the spacing differs")
        return SimilarityResult(SPACING_SCORE, "; ".join(reasons))

    if _is_acronym_of(a_clean, b_clean, b_all):
        reasons.insert(0, f"Abbreviation match: '{company_a}' is the "
                          f"acronym of '{company_b}'")
        return SimilarityResult(ABBREVIATION_SCORE, "; ".join(reasons))
    if _is_acronym_of(b_clean, a_clean, a_all):
        reasons.insert(0, f"Abbreviation match: '{company_b}' is the "
                          f"acronym of '{company_a}'")
        return SimilarityResult(ABBREVIATION_SCORE, "; ".join(reasons))

    matches = _match_tokens(a_clean, b_clean)
    used_a = {i for i, _, _ in matches}
    used_b = {j for _, j, _ in matches}

    overlap = sum(
        min(_weight(a_clean[i]), _weight(b_clean[j])) * credit
        for i, j, credit in matches
    )
    total_a = sum(_weight(t) for t in a_clean)
    total_b = sum(_weight(t) for t in b_clean)
    union = total_a + total_b - overlap
    score = overlap / union if union > 0 else 0.0

    if matches:
        shared = [a_clean[i] for i, j, c in matches if c == 1.0]
        if shared:
            reasons.append("Token overlap: shared " +
                           ", ".join(f"'{t}'" for t in shared))
        for i, j, credit in matches:
            if credit < 1.0:
                reasons.append(f"Typo-tolerant match: '{a_clean[i]}' ~ "
                               f"'{b_clean[j]}'")
    else:
        reasons.append("Token overlap: no shared words")

    # Look-alike guard: a shared root, but each side has its own
    # distinguishing word (not just a generic one like "technologies").
    only_a = [t for i, t in enumerate(a_clean)
              if i not in used_a and _weight(t) == 1.0]
    only_b = [t for j, t in enumerate(b_clean)
              if j not in used_b and _weight(t) == 1.0]
    if matches and only_a and only_b:
        reasons.append("Look-alike guard: different distinguishing words "
                       f"'{' '.join(only_a)}' vs '{' '.join(only_b)}'")
        if score > LOOKALIKE_CAP:
            score = LOOKALIKE_CAP
            reasons.append(f"Score capped at {LOOKALIKE_CAP}")

    score = max(0.0, min(1.0, score))
    return SimilarityResult(round(score, 2), "; ".join(reasons))


def is_possible_duplicate(
    company_a: Optional[str],
    company_b: Optional[str],
    threshold: float = DUPLICATE_THRESHOLD,
) -> bool:
    """True if the pair should be shown to a human as a duplicate candidate.

    This never merges anything; a person always makes the final decision.
    """
    return calculate_similarity(company_a, company_b).score >= threshold
