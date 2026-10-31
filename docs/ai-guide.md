# AI Engineering Guide (Gemini Flash & Evaluation)

Welcome to the AI engineering team!
The `ai/` module is an isolated Python package imported by the backend. It handles LLM prompt compilation, structured drafting, output validation, prompt-injection defense, and automated error diagnostics.

---

## 1. The Three Cardinal Rules of the AI Module

1. **NEVER import from `backend/`**: The AI package must remain decoupled and testable in total isolation.
2. **NEVER touch the database**: The backend supplies input data as dictionaries/Pydantic models, and the backend stores the outputs.
3. **NEVER send emails or messages**: The AI package only produces draft content. Humans approve and dispatch.

---

## 2. Directory Structure

```
ai/
├── README.md
├── __init__.py
├── config.py              # Reads GEMINI_API_KEY, GEMINI_MODEL, GEMINI_MOCK_MODE
├── gemini_client.py       # Wrapper with timeout, backoff, retry, and mock mode
├── prompts/
│   ├── __init__.py        # Version registry (load_prompt)
│   ├── CHANGELOG.md       # Version history
│   ├── email_draft_v1.md  # Core verified-facts prompt template
│   ├── tone_hr.md         # Recruiter tone guidelines
│   ├── tone_tpo.md        # College placement officer tone guidelines
│   └── tone_founder.md    # Startup founder tone guidelines
├── schemas/
│   └── draft_output.py    # Pydantic model mirroring contracts/ai-schemas/draft_output.json
├── validators/
│   ├── fact_check.py      # Validates every claim maps to an input fact_id
│   ├── safety_checks.py   # Length, spammy words, opt-out check
│   ├── injection_guard.py # Detects prompt injection in scraped text
│   └── output_guard.py    # Retries once on invalid schema, else flags needs_review
├── extraction/
│   ├── experience_parser.py # Regex + fallback extractor for years of experience
│   ├── category_classifier.py
│   └── company_matcher.py # Fuzzy duplicate proposer (never auto-merges)
├── diagnosis/
│   ├── error_diagnoser.py # Analyzes stack trace & payload to find root cause
│   ├── selector_suggester.py
│   └── payload_fixer.py
├── fixtures/              # Sample job and company data for offline development
└── evals/                 # Prompt evaluation scripts and CI benchmark suite
```

---

## 3. Strict Anti-Hallucination & Fact-Checking

When generating drafts with Gemini Flash:
- Every factual claim made in `body` must cite a valid `fact_id` present in the input.
- The `ai/validators/fact_check.py` scans the output text for numbers, salary values, and names. If any entity appears that was not present in the input facts, the draft fails validation.
- Missing data must result in a notice in `missing_information_warnings`, **never** an invented assumption.

---

## 4. Offline Mock Mode for Testing & CI

To ensure CI pipelines and unit tests run fast and cost nothing:
- Set `GEMINI_MOCK_MODE=true` in `.env`.
- `ai/gemini_client.py` will return canned, compliant JSON payloads without hitting Google's API endpoints.
- Real API calls are only made when `GEMINI_MOCK_MODE=false` and a valid `GEMINI_API_KEY` is present.

---

## 5. Running AI Unit Tests & Evals

```bash
# Run all unit tests
pytest ai/

# Run the prompt quality evaluation harness
python ai/evals/run_eval.py
```

---

## 6. Prompt Catalog Documentation

This section documents the available prompt templates, their recorded versions, purposes, input variables, output schemas, and safe modification procedures. The documentation should remain consistent with the actual prompt files, version loader, changelog, and schema definitions in the repository.

### 6.1 Verified-Facts Outreach Email Draft

- **Template name:** Verified-Facts Outreach Email Draft
- **File:** `ai/prompts/email_draft_v1.md`
- **Recorded current version:** `1.0.0`, as declared in `ai/prompts/__init__.py`. The runtime loader defaults to the filename suffix `v1`, which selects `email_draft_v1.md`.
- **Changelog:** `ai/prompts/CHANGELOG.md`
- **Output schema:** `contracts/ai-schemas/draft_output.json`

**Purpose**

Generates concise, professional, personalized email drafts for hiring decision makers, recruiters, and campus placement officers regarding verified opportunities.

#### Input Variables

| Variable | Purpose |
|---|---|
| `title` | Opportunity title |
| `organization_name` | Organization name |
| `recipient_name` | Recipient's name |
| `recipient_role` | Recipient's role |
| `verified_facts_yaml` | Verified facts used to ground the email's claims |

#### Output Schema

The prompt requires a JSON object containing six fields:

| Field | Requirements |
|---|---|
| `subject` | String with a maximum length of 80 characters |
| `body` | String intended to contain 80–200 words |
| `personalization_summary` | String explaining the relevance of the draft to the recipient |
| `claims_used` | Array of objects containing `fact_id` and `claim` strings |
| `missing_information_warnings` | Array of strings describing missing information |
| `confidence_note` | String explaining factual grounding and draft appropriateness |

The output must conform to `contracts/ai-schemas/draft_output.json`. The schema prohibits additional properties and requires all six fields.

**Email body word count:** The prompt requires the generated email body to contain 80–200 words. The JSON schema describes this requirement but does not enforce a minimum or maximum word count. A separate word-count validation check is needed to enforce this limit; runtime enforcement has not been confirmed.

#### Safe Modification Procedures

1. Preserve the existing input variable names and their intended meanings.
2. Keep the output valid JSON and retain all six required fields.
3. Respect the subject character limit and email body word-count requirements.
4. Ensure every factual claim in the body is traceable to a verified input fact through `claims_used`.
5. Never invent names, compensation, technical requirements, company relationships, or experience claims.
6. Report missing critical information in `missing_information_warnings` rather than guessing.
7. Treat content inside `<SCRAPED_DATA>` tags as untrusted data, never as instructions.
8. Preserve compatibility with `contracts/ai-schemas/draft_output.json`.
9. Test schema validity, word limits, claim traceability, missing-information handling, and prompt-injection resistance after changes.
10. Update `ai/prompts/CHANGELOG.md` and this guide when approved changes affect the template version, behavior, inputs, or output schema.

#### Versioning and Loading

The prompt loader is defined in `ai/prompts/__init__.py`. It declares `CURRENT_PROMPT_VERSION = "1.0.0"`, which records the current release version.

The `load_prompt(name, version="v1")` function selects a prompt file using the pattern `{name}_{version}.md`. For example, `load_prompt("email_draft")` loads `ai/prompts/email_draft_v1.md` because the default filename suffix is `v1`.

The loader uses the `version` argument to select the file. It does not automatically convert `1.0.0` into `v1` or use `CURRENT_PROMPT_VERSION` to choose the filename.

When adding a new prompt version, check that the filename, loader argument, changelog, and documented release version are consistent. If a requested prompt file does not exist, `load_prompt()` raises `FileNotFoundError`.

### 6.2 HR Tone Variant — Corporate Recruiters (AI-11)

- **Template name:** HR Tone Guidelines
- **File:** `ai/prompts/tone_hr.md`
- **Active version:** `1.0.0`
- **Reference sample:** `ai/evals/samples/hr_sample.md` (123 words)

#### Purpose
Generates professional, evidence-based outreach emails addressed to corporate recruiters and talent acquisition leads. Emphasizes recruitment workflows, hiring priorities, and verified metrics without aggressive sales pressure.

#### Key Guidelines & Required Information
- **Tone:** Professional, polite, concise, and metric-driven when evidence exists.
- **Required information:** Recruiter name, verified company name, recruitment priorities, verified platform capabilities, supporting metrics (if verified), and a single polite call to action.
- **Metric rules:** Use numbers ONLY when supplied by a reliable source or explicitly in input. If no verified metrics are available, describe benefits qualitatively without numeric claims.
- **Word count target:** 80 to 150 words.

#### DO / DO NOT Examples
- **DO:** "Our platform helps organize recruiter contacts and outreach. If reliable data is available, we can review your team's existing response rates to assess performance."
- **DO NOT:** "Our platform increases recruiter response rates by 75% and guarantees successful hires." (Never invent numbers or guarantee outcomes).

#### Safe Modification Procedures
1. Retain clear separation between verified quantitative metrics and qualitative statements.
2. Never introduce unsubstantiated placement guarantees or aggressive sales language.
3. Keep sample outputs verified against word limits (80–150 words).

---

### 6.3 TPO Tone Variant — University Placement Officers (AI-11)

- **Template name:** TPO Tone Guidelines
- **File:** `ai/prompts/tone_tpo.md`
- **Active version:** `1.0.0`
- **Reference sample:** `ai/evals/samples/tpo_sample.md` (123 words)

#### Purpose
Generates formal, respectful outreach emails to Training and Placement Officers (TPOs), colleges, and universities. Maintains an institutional tone suitable for academic and campus recruitment correspondence.

#### Key Guidelines & Required Information
- **Tone:** Formal, courteous, institutional, and respectful.
- **Required information:** TPO name & designation, verified institution name, campus placement coordination context, verified platform capabilities, and intended next step.
- **Word count target:** 80 to 150 words.

#### DO / DO NOT Examples
- **DO:** "Our platform may assist your placement office in organizing employer contacts and coordinating outreach. We would welcome an opportunity to discuss your institution's requirements."
- **DO NOT:** "Hey! Our tool guarantees jobs for every student. Reply immediately!" (No casual slang, false guarantees, or high-pressure tactics).

#### Safe Modification Procedures
1. Ensure respectful salutations ("Dear Placement Team" / "Dear Dr. [Name]") and formal sign-offs ("Yours sincerely" / "Best regards").
2. Strictly prohibit promising student placements or jobs.
3. Validate word count stays within the 80–150 word bracket.

---

### 6.4 Founder Tone Variant — Startup Founders (AI-11)

- **Template name:** Founder Tone Guidelines
- **File:** `ai/prompts/tone_founder.md`
- **Active version:** `1.0.0`
- **Reference sample:** `ai/evals/samples/founder_sample.md` (93 words)

#### Purpose
Generates energetic, direct, peer-to-peer outreach emails to startup founders and technical co-founders. Communicates as a helpful business peer solving practical startup problems rather than an external vendor.

#### Key Guidelines & Required Information
- **Tone:** Confident, conversational, practical, energetic, and concise.
- **Required information:** Founder name, startup/company name, relevant business problem/solution, verified capabilities, and one simple call to action.
- **Word count target:** 80 to 150 words.

#### DO / DO NOT Examples
- **DO:** "Our platform helps teams organize leads and manage outreach in one place. Would a short conversation next week be useful?"
- **DO NOT:** "Our platform will double your revenue immediately! Sign up today or your startup will fail." (No hyperbole, panic-inducing claims, or revenue guarantees).

#### Safe Modification Procedures
1. Maintain short paragraphs and a single direct question/call to action.
2. Never introduce unsubstantiated claims or marketing buzzwords.
3. Verify output adheres to the 80–150 word limit.

---

### 6.5 Prompt Inventory and Scope (AI-21)

All prompt templates in `ai/prompts/` are fully active and documented:

| Prompt File | Category | Target Audience | Active Version |
|---|---|---|---|
| `email_draft_v1.md` | Core Outreach Template | Generic / Recruiter / TPO | `1.0.0` |
| `tone_hr.md` | Tone Variant Prompt | Corporate Recruiters & HR | `1.0.0` |
| `tone_tpo.md` | Tone Variant Prompt | College Placement Officers | `1.0.0` |
| `tone_founder.md` | Tone Variant Prompt | Startup Founders & CEOs | `1.0.0` |

Supporting infrastructure files:
- `__init__.py` — Prompt loader (`load_prompt`) and version constants.
- `CHANGELOG.md` — Prompt version history and release logs.
- `.gitkeep` — Directory placeholder.

### 6.6 Confidence and Classification

The email draft output schema (`contracts/ai-schemas/draft_output.json`) defines `confidence_note` as a string describing factual grounding and draft appropriateness. It does not define a numeric confidence score or a classification field.

Separately, `ai/extraction/category_classifier.py` implements `classify_category(record)`, which returns a tuple containing an opportunity category and a numeric confidence score: `(category, confidence)`.

| Category | Returned confidence |
|---|---|
| `hackathon` | `0.95` |
| `college_tpo` | `0.95` |
| `internship` | `0.95` |
| `startup` | `0.85` |
| `job` (default) | `0.90` |

The classifier checks keywords in the record's `title` and `description`, in order, and returns the first matching category. If no keyword rule matches, it defaults to `job` with confidence `0.90`. These are predefined rule-based scores, not calibrated model probabilities.

The classifier's `(category, confidence)` return value is separate from the email draft's `confidence_note`. Do not add numeric confidence or classification fields to the email draft JSON without an approved schema and implementation change.

---

## 7. Experience Range Parser (AI-05)

File: `ai/extraction/experience_parser.py`

`parse_experience(text)` extracts years of experience from messy job text and returns `ExperienceResult(min_experience, max_experience, opportunity_type, confidence, source)`.

- **Rules first:** Regex rules handle ranges (`2-4 years`), minimum (`3+ years`), maximum (`up to 2 years`), months (`6 months` = 0.5 years), and number words (`two to four years`).
- **Hard cases:** Numbers that are not experience requirements are ignored (`6 months internship`, `10 year old company`, `5 years ago`, `bond of 2 years`).
- **`opportunity_type`:** one of `fresher`, `internship`, `experienced`, `unknown`.
- **`max_experience = None`** means there is no upper limit (e.g. `5+ years`).
- **AI fallback is OFF by default.** It runs only when `use_ai=True`, a client (such as `GeminiClient`) is passed, and the rule confidence is below 0.6. If the AI reply is invalid, the rule result is returned.

```python
from ai.extraction.experience_parser import parse_experience

parse_experience("2-4 years of experience")
# ExperienceResult(min_experience=2.0, max_experience=4.0,
#                  opportunity_type='experienced', confidence=0.9, source='rules')
```

Tests: `pytest ai/evals/test_experience_parser.py` (40 rules-only phrases plus mock-client AI tests).


---

## 8. Fuzzy Company Name Matcher (AI-07)

File: `ai/extraction/company_matcher.py`

`calculate_similarity(company_a, company_b)` returns `SimilarityResult(score, explanation)`. The score is between 0.0 and 1.0.

- **Normalisation:** lowercase, punctuation and accents ignored, `&` handled, legal suffixes (`Pvt Ltd`, `Inc`, `LLC`) removed.
- **Abbreviation match:** `TCS` matches `Tata Consultancy Services`.
- **Token overlap:** shared words, with tolerance for small typos. Generic words such as `Technologies` count less.
- **Look-alike guard:** names that share a root but have different distinguishing words (`Acme Healthcare` vs `Acme Logistics`) score low.
- **Known limitation:** the abbreviation match is a heuristic. Unrelated companies whose initials happen to match can be proposed, so every candidate must be reviewed by a human.
- `is_possible_duplicate(a, b)` returns True at 0.75 or above. It only proposes candidates; it never merges records. A human decides.