# Remaining Tasks Master Sheet (For Interns & Captain)

> **AI-Powered Lead Intelligence, CRM & Outreach Automation Platform**  
> *Filtered task sheet containing **only the remaining 80 tasks** ready to be assigned to interns. Each ticket includes exact file targets, step-by-step instructions, out-of-scope boundaries, and reviewer acceptance criteria.*

---

## How to Use This Document

1. **For Captains & Team Leads**:
   - Copy the exact ticket text directly into a GitHub Issue on the Captain's repo.
   - Assign the intern and apply the corresponding label (`frontend`, `backend-core`, `database`, `automation`, `ai`).
   - Give each new intern an **S (Small)** task first as a warm-up, then **M (Medium)**, and an **L (Large)** only after two successful PRs.
2. **For Interns**:
   - Check the **Files** column: you are strictly allowed to modify **only** those files.
   - Branch name format: `feature/<TASK-ID>-<short-name>` (e.g., `feature/FE-09-lead-table`).
   - Every task must satisfy all points under **Acceptance Criteria** before raising your PR.

---

# 1. Frontend Remaining Tickets (`frontend/`)

---

### FE-09. Lead Pipeline Table
- **Domain**: Frontend
- **Assigned to**: Completed & Verified
- **Files**: `frontend/src/pages/LeadPipeline/LeadTable.jsx`, `frontend/src/api/leads.js`
- **Label**: `frontend`
- **Size**: L (Large ~1 week)
- **Needs**: `FE-04`, `FE-06`

#### What to build
- Render a high-performance CRM table with columns: `Organization`, `Job Title`, `Source`, `Experience Range`, `Quality Score Badge`, `Contact Status`, `Assigned To`, `Discovered Date`.
- Implement server-side pagination (page number, page size up to 100) and column-level sorting (`sort_by`, `sort_order`) matching query params in `contracts/openapi.yaml`.
- Wire row selection click callback `onSelect(leadId)` to open the lead detail drawer.
- Support responsive horizontal scrolling on viewports under 1024px.

#### Out of Scope
- Do not build filter dropdowns (covered in `FE-10`), detail drawer content (`FE-11`), or Kanban toggle (`FE-12`).

#### Acceptance Criteria
- [x] Loads and pages smoothly against mock leads.
- [x] Clicking column header triggers ascending/descending sort.
- [x] Clicking a row triggers `onSelect(leadId)`.
- [x] Table scrolls horizontally on mobile/tablet without breaking the viewport layout.

---

### FE-10. Filters and Search Controls
- **Domain**: Frontend
- **Assigned to**: Completed & Verified
- **Files**: `frontend/src/pages/LeadPipeline/LeadFilters.jsx`, `frontend/src/store/filters.js`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-09`

#### What to build
- Filter controls: Source multi-select, experience range slider/input, score band selector (`high`, `medium`, `low`, `suppressed`), contact status, and assigned user.
- Text search input with **300ms debounce** to avoid excessive re-renders/requests.
- Sync active filter parameters with URL query parameters so searches can be bookmarked/shared.
- Include a "Clear All Filters" button.

#### Out of Scope
- No saving custom filter presets to localStorage/database.

#### Acceptance Criteria
- [x] Typing in search waits 300ms before triggering filter refresh.
- [x] Reloading the browser page preserves the exact URL filter query parameters.
- [x] Clear All button resets all controls back to default state.

---

### FE-11. Lead Detail Drawer
- **Domain**: Frontend
- **Assigned to**: Completed & Verified
- **Files**: `frontend/src/pages/LeadPipeline/LeadDetailDrawer.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-09`

#### What to build
- Sliding side drawer showing detailed context for selected lead:
  - Source name, publication timestamp, discovery timestamp, and clickable external source listing URL.
  - Full opportunity description.
  - Associated contacts (name, role title, email, phone, verification chip).
  - Score breakdown factor scores and reason codes with explanations.
  - Placeholder section for immutable audit log history.

#### Out of Scope
- No editing of lead details or contacting recipients from this drawer.

#### Acceptance Criteria
- [x] Opens smoothly when a table row is clicked; closes on Escape key or close button.
- [x] Missing optional fields render a dash (`—`), never `undefined` or `null`.
- [x] Outbound source URL opens safely in a new tab (`target="_blank" rel="noreferrer"`).

---

### FE-12. Kanban View Toggle
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/LeadPipeline/LeadKanban.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-09`

#### What to build
- View switcher toggle (Table vs Kanban) in the pipeline header.
- Kanban columns representing lifecycle states: `New`, `Needs Enrichment`, `Verified`, `Draft Ready`, `Approved`, `Sent`.
- Cards display organization name, role title, source badge, and score badge.

#### Out of Scope
- No drag-and-drop state changes in this version (status transitions must occur via explicit backend actions).

#### Acceptance Criteria
- [ ] Switching between Table and Kanban maintains identical active filters.
- [ ] Cards display clean layout and link directly to lead drawer on click.

---

### FE-14. "My Leads" Page & Assignment Controls
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/MyLeads/index.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-09`

#### What to build
- Dedicated page listing leads currently assigned to the signed-in user (`assigned_to == current_user.id`).
- "Claim Lead" button on pipeline rows for researchers.
- "Assign to Teammate" dropdown for team leads and admins.

#### Out of Scope
- No bulk re-assignment or notification toasts.

#### Acceptance Criteria
- [ ] Claiming updates UI immediately (optimistic UI) and rolls back with an error banner if server rejects.
- [ ] A lead already claimed by someone else cannot be claimed again.

---

### FE-16. Enrichment Queue Page
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/EnrichmentQueue/index.jsx`, `frontend/src/api/enrichment.js`
- **Label**: `frontend`
- **Size**: L (Large ~1 week)
- **Needs**: `FE-09`

#### What to build
- Table of leads that have an organization or recruiter name but lack verified contact details.
- Columns: Contact Name, Organization, Missing Fields, Provider Selector (`ContactOut` / `Snov.io`), Estimated Credit Cost.
- Multi-select row checkboxes with batch selection.
- "Enrich Contact" button triggering the credit confirmation modal (`FE-17`).

#### Out of Scope
- The page must NEVER call third-party APIs directly; all requests route through backend endpoints.

#### Acceptance Criteria
- [ ] "Enrich Contact" button stays disabled if zero rows are selected.
- [ ] After successful enrichment, the lead transitions out of the queue or is marked `needs_research`.

---

### FE-17. Enrich Confirm Modal with Credit Guard
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/EnrichmentQueue/EnrichConfirmModal.jsx`
- **Label**: `frontend`
- **Size**: S (Small ~1 day)
- **Needs**: `FE-16`

#### What to build
- Confirmation modal displaying:
  - Selected provider (`ContactOut` or `Snov.io`).
  - Total records selected.
  - Total estimated credit cost.
  - Remaining daily and monthly credit budget.
- Explicit "Confirm & Deduct Credits" button requiring deliberate user click.

#### Out of Scope
- No auto-enrichment or bypassing credit limits.

#### Acceptance Criteria
- [ ] Confirm button is disabled if estimated credits exceed remaining budget, displaying clear reason.
- [ ] Pressing Escape or Cancel never triggers an API call.

---

### FE-18. Enrichment History Panel
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/EnrichmentQueue/History.jsx`
- **Label**: `frontend`
- **Size**: S (Small ~1 day)
- **Needs**: `FE-16`

#### What to build
- Paginated table showing audit history of past enrichment lookups:
  - Requester name, timestamp, provider used, result outcome, credits consumed, contact email provenance.

#### Acceptance Criteria
- [ ] Displays newest lookups first.
- [ ] Shows clean empty state if no history exists.

---

### FE-19. Verify Email Button & Status Chips
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/components/verification/VerificationChips.jsx`
- **Label**: `frontend`
- **Size**: S (Small ~1 day)
- **Needs**: `FE-04`

#### What to build
- "Verify Email" action button for single leads and batch selection.
- Distinct status chips: `Deliverable` (Green), `Undeliverable` (Red), `Catch-All` (Amber), `Risky` (Orange), `Unknown` (Grey), `Verification Failed` (Grey).
- Displays relative time of last verification (e.g., "Verified 2 days ago").

#### Acceptance Criteria
- [ ] Button shows loading spinner during execution and prevents double-clicking.
- [ ] Status chips contain descriptive text, never relying on color alone.

---

### FE-20. Credit Usage Meter Widget
- **Domain**: Frontend
- **Assigned to**: Completed & Verified
- **Files**: `frontend/src/components/credits/CreditMeter.jsx`
- **Label**: `frontend`
- **Size**: S (Small ~1 day)
- **Needs**: `FE-04`

#### What to build
- Visual progress bar widgets showing:
  - Daily credit usage vs daily budget limit.
  - Monthly credit usage vs monthly budget limit.
- Color shifts: Normal (Blue/Green) < 80%, Warning (Amber) >= 80%, Danger (Red) at 100%.

#### Acceptance Criteria
- [x] Handles zero budget gracefully without division by zero (`NaN%`).
- [x] ARIA progressbar attributes included for screen readers.

---

### FE-21. Campaign Audience Review List
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/CampaignManager/Audience.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-09`

#### What to build
- Audience selection interface for outreach campaigns:
  - Campaign selector dropdown.
  - Table of eligible leads (strictly score >= 80).
  - Displays recipient name, email deliverability status, organization, and opportunity context.
  - Greyed-out, unselectable rows for suppressed emails/domains with reason badge.

#### Acceptance Criteria
- [ ] Only qualified, non-suppressed leads can be selected.
- [ ] Counter showing "X leads selected for outreach" always visible.

---

### FE-22. AI Draft Review & Editor Screen
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/CampaignManager/DraftEditor.jsx`
- **Label**: `frontend`
- **Size**: L (Large ~1 week)
- **Needs**: `FE-21`

#### What to build
- Split-screen drafting workbench:
  - **Left side (Read-Only)**: Verified input facts extracted from opportunity (role, company, recruiter name, fact IDs).
  - **Right side (Editable)**: AI-generated draft subject line and email body.
  - Displays claims cited with fact IDs, missing information notices, Gemini model name, and prompt version.
  - "Save Edits" button and "Regenerate Draft" button.

#### Acceptance Criteria
- [ ] Retains original AI text separately from human edits to display a diff view.
- [ ] Open warnings must be checked/acknowledged before allowing approval.

---

### FE-23. Campaign Approval Screen
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/CampaignManager/Approval.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-22`

#### What to build
- Pre-send checklist summary modal/screen:
  - Verified recipient email & deliverability status.
  - Exact subject line and body to be dispatched.
  - Suppression list check confirmation.
  - Remaining daily send limit counter.
- Prominent "Approve & Lock Message" button. Once approved, content becomes read-only.

#### Acceptance Criteria
- [ ] Approve button disabled if any checklist item fails.
- [ ] Approved content cannot be edited without revoking approval.

---

### FE-24. Dispatch Send, Schedule & Pause Controls
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/CampaignManager/Controls.jsx`
- **Label**: `frontend`
- **Size**: S (Small ~1 day)
- **Needs**: `FE-23`

#### What to build
- Control toolbar:
  - "Send Now" button.
  - "Schedule Dispatch" date & time picker.
  - "Pause Campaign" emergency pause toggle with confirmation dialog.

#### Acceptance Criteria
- [ ] Every destructive/send action prompts an explicit confirmation dialog.
- [ ] Paused campaigns display a prominent red "PAUSED" banner across the screen.

---

### FE-25. Campaign Outcomes Dashboard
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/CampaignManager/Outcomes.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-21`

#### What to build
- Metrics overview cards and event table:
  - Total Sent, Delivered, Replied, Bounced, Unsubscribed.
  - Event stream showing timestamp, recipient domain, and event type.

#### Acceptance Criteria
- [ ] Displays placeholder note if provider has not yet reported metrics.
- [ ] Metric counts match API response totals exactly.

---

### FE-26. Suppression Management Page
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/Suppression/index.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-04`

#### What to build
- Searchable table of suppressed emails and blocked domains.
- "Add Suppression Entry" modal (Value, Type: email/domain, Reason: unsubscribe/bounce/manual).
- Delete/unblock action requiring admin role and a mandatory written explanation.

#### Acceptance Criteria
- [ ] Remove button hidden for non-admin users.
- [ ] Duplicate entries return a clear user error without crashing.

---

### FE-27. System Health Dashboard
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/SystemHealth/index.jsx`
- **Label**: `frontend`
- **Size**: L (Large ~1 week)
- **Needs**: `FE-04`

#### What to build
- High-level system monitoring view:
  - n8n workflow engine status (Online / Offline).
  - Scraper queue size and database connection health.
  - 24-hour error count.
  - Auto-refresh toggle (every 30 seconds) with "Last updated" timestamp.

#### Acceptance Criteria
- [ ] If one status endpoint fails, only that card shows an error state while other cards continue updating.
- [ ] Auto-refresh polling pauses automatically when browser tab is inactive.

---

### FE-28. Automation Error Center Page
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/ErrorCenter/index.jsx`
- **Label**: `frontend`
- **Size**: L (Large ~1 week)
- **Needs**: `FE-04`

#### What to build
- Error tracking table: Workflow name, Job ID, Correlation ID, Failed Step, Error Category, Retry Count, Next Retry At, Owner.
- Slide-over detail panel showing redacted stack trace, payload snapshot, resolution notes input, and AI-suggested root cause.
- "Replay Job" button (disabled for non-replayable send errors).

#### Acceptance Criteria
- [ ] Filterable by error category and status (`open`, `retrying`, `resolved`).
- [ ] Replay button disabled for send timeouts and rejections.

---

### FE-29. Source Health Monitoring Panel
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/SystemHealth/SourceHealth.jsx`
- **Label**: `frontend`
- **Size**: S (Small ~1 day)
- **Needs**: `FE-27`

#### What to build
- Source cards for each approved portal (Internshala, Naukri, Apna, etc.):
  - Last run timestamp, records extracted, failure rate percentage, health badge (`healthy`, `quarantined`, `rate_limited`).

#### Acceptance Criteria
- [ ] Quarantined sources are automatically highlighted at the top of the list.

---

### FE-30. Admin Users and Roles Management
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/Admin/Users.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-04`

#### What to build
- Table of team members with assigned roles (`admin`, `researcher`, `campaign_manager`, `developer`).
- Create user form, change role dropdown, and activate/deactivate user switch.

#### Acceptance Criteria
- [ ] Accessible only by users with the `admin` role (others receive 403 No Access page).
- [ ] An admin cannot deactivate their own active account.

---

### FE-31. Admin Source Registry & Budget Configuration
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/pages/Admin/Sources.jsx`
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `FE-04`

#### What to build
- Source enable/disable toggles for scrapers.
- Budget settings inputs: Monthly credit budget per enrichment provider, Daily outreach send limit.

#### Acceptance Criteria
- [ ] Changes require explicit confirmation dialog showing old value vs new value.
- [ ] Negative or non-numeric values are rejected with form validation.

---

### FE-32. Accessibility and Responsive Audit Pass
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/styles/`, small fixes across pages
- **Label**: `frontend`
- **Size**: M (Medium ~2-3 days)
- **Needs**: Most pages completed

#### What to build
- Test all screens with Lighthouse and Axe accessibility tools.
- Fix color contrast, focus rings, ARIA labels, and touch target sizes.
- Verify layouts at 360px (mobile), 768px (tablet), and 1280px (desktop).

#### Acceptance Criteria
- [ ] Zero critical Axe accessibility violations.
- [ ] Summary of fixes documented in `docs/frontend-guide.md`.

---

### FE-33. Frontend Component Tests (Vitest)
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `frontend/src/**/__tests__/*.test.jsx`
- **Label**: `frontend`, `tests`
- **Size**: M per page
- **Needs**: Page completed

#### What to build
- Vitest + React Testing Library suites for each completed page covering:
  - Initial loading state.
  - Successful data render.
  - Empty state.
  - Error banner on API failure.
  - Primary button interaction.

#### Acceptance Criteria
- [ ] Minimum 5 test cases per page, passing in CI.
- [ ] Tests execute against mock data only.

---

### FE-35. Frontend User Guide with Screenshots
- **Domain**: Frontend
- **Assigned to**: TBD
- **Files**: `docs/frontend-guide.md`
- **Label**: `frontend`, `docs`
- **Size**: S (Small ~1 day)
- **Needs**: All UI pages completed

#### What to build
- Write user documentation for each screen: intended role, key workflows, button descriptions, and UI screenshots.

#### Acceptance Criteria
- [ ] A new team member can execute the full discovery-to-outreach workflow relying solely on this guide.

---

# 2. Backend Remaining Tickets (`backend/`, `database/`, `automation/`, `infra/`)

---

### BE-15. Leads Repository in Raw Parameterised SQL
- **Domain**: Backend Core
- **Assigned to**: Completed & Verified
- **Files**: `backend/app/repositories/leads_repo.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-06`

#### What to build
- Direct SQL repository functions:
  - `list_leads(filters, page, page_size)` with joins on organizations, sources, and data quality scores.
  - `get_lead_by_id(id)` returning full nested details.
  - `upsert_lead(record)` by `(source_id, source_identifier)`.
- Enforce strict parameterisation (`%s`); cap page size at 100.

#### Out of Scope
- No ORMs or string concatenation (`f"SELECT..."` is strictly forbidden).

#### Acceptance Criteria
- [x] SQL queries use tuple parameters exclusively.
- [x] Query execution plan (`EXPLAIN`) is included in the PR description.

---

### BE-16. Leads Endpoints (`GET /leads` & `GET /leads/{id}`)
- **Domain**: Backend Core
- **Assigned to**: Completed & Verified
- **Files**: `backend/app/api/v1/leads.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-15`

#### What to build
- Wire `/api/v1/leads` and `/api/v1/leads/{id}` to call `leads_repo.py`.
- Support filtering by source, experience min/max, score band, status, assigned user, and text search.
- Return structured response adhering to `contracts/openapi.yaml`.

#### Acceptance Criteria
- [x] All query parameters from OpenAPI contract work as expected.
- [x] Non-existent ID returns 404 with standard error envelope.

---

### BE-17. Claim and Assign Endpoint
- **Domain**: Backend Core
- **Assigned to**: Completed & Verified
- **Files**: `backend/app/api/v1/leads.py`
- **Label**: `backend-core`
- **Size**: S (Small ~1 day)
- **Needs**: `BE-16`

#### What to build
- `POST /api/v1/leads/{id}/claim`
- Atomic SQL `UPDATE opportunities SET assigned_to = %s, claimed_at = NOW() WHERE id = %s AND assigned_to IS NULL`.
- Optional `user_id` parameter permitted only for admins and campaign managers.
- Record action in `audit_logs`.

#### Acceptance Criteria
- [x] Two simultaneous claim requests: one succeeds (200), the second receives 409 Conflict.
- [x] Researchers can only claim leads for themselves.

---

### BE-18. Duplicate Detection Service
- **Domain**: Backend Core
- **Assigned to**: Completed & Verified
- **Files**: `backend/app/services/dedup_service.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-15`

#### What to build
- Comprehensive deduplication logic:
  - Exact match: `(source_id, source_identifier)` or `source_url`.
  - Fuzzy company matching: Strip legal entity suffixes (`Pvt Ltd`, `LLC`, `Inc`), punctuation, and normalize whitespace.
  - Return existing match ID or list of suspected near-duplicates for researcher review.

#### Out of Scope
- Never merge opportunities automatically based on name similarity alone.

#### Acceptance Criteria
- [x] Minimum 15 unit tests covering exact matches and near-misses that must NOT be merged.

---

### BE-19. Audit Log Writer
- **Domain**: Backend Core
- **Assigned to**: Completed & Verified
- **Files**: `backend/app/services/audit_service.py`
- **Label**: `backend-core`
- **Size**: S (Small ~1 day)
- **Needs**: `BE-10`

#### What to build
- Reusable helper `log_action(conn, actor, action, entity_type, entity_id, details_dict)` writing inside the active transaction.
- Mask emails, phone numbers, and auth tokens before persisting details JSONB.

#### Acceptance Criteria
- [x] A rolled-back transaction creates no audit row.
- [x] Test verifies personal email inside `details` is redacted.

---

### BE-21. Scraper Base Class & Exception Wrapper
- **Domain**: Backend Automation
- **Assigned to**: Completed & Verified
- **Files**: `automation/scrapers/base.py`
- **Label**: `automation`
- **Size**: M (Medium ~2-3 days)
- **Needs**: None

#### What to build
- `BaseScraper` class with `fetch()`, `parse()`, `run()` lifecycle.
- Resilient exception wrapper catching: Network timeouts, Missing DOM selectors, HTTP 403/429.
- Save size-capped HTML snapshot (max 50KB) on selector failure for AI diagnosis.
- Inject random delay between requests (1–3s).

#### Acceptance Criteria
- [x] Test fixture simulates timeout, selector change, and 429 response to verify structured error handling.
- [x] HTTP 429 immediately stops further requests for that source.

---

### BE-22. Approved Source Registry
- **Domain**: Backend Automation
- **Assigned to**: Completed & Verified
- **Files**: `automation/scrapers/registry.py`
- **Label**: `automation`
- **Size**: S (Small ~1 day)
- **Needs**: `BE-05`

#### What to build
- Dynamic loader fetching enabled sources from the `sources` table and mapping each to its scraper class.

#### Acceptance Criteria
- [x] A disabled or unlisted source can never be executed.
- [x] Unrecognized source key throws a clean configuration error.

---

### BE-23. Scraper Field Normalizer
- **Domain**: Backend Automation
- **Assigned to**: TBD
- **Files**: `automation/scrapers/normalizer.py`
- **Label**: `automation`
- **Size**: M (Medium ~2-3 days)
- **Needs**: None

#### What to build
- Standardize messy text:
  - Experience: `"0-2 yrs"`, `"Fresher"`, `"No experience required"` ➔ `(min_exp, max_exp)`.
  - Salary: Clean formatting while preserving original string.
  - Location: Clean city name and remote tags.

#### Acceptance Criteria
- [ ] Minimum 30 test strings verified.
- [ ] Unparseable strings return `None`, never raise unhandled exceptions.

---

### BE-24. Scraper Ingest Webhook
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/webhooks.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-18`

#### What to build
- `POST /api/v1/webhooks/scraper-ingest`
- Validate `X-Scraper-Secret` header.
- Ingest batch of up to 200 records: run deduplication, bulk upsert into `organizations` and `opportunities` in a single transaction.
- Return counts: `{ inserted, updated, skipped, rejected }`.

#### Acceptance Criteria
- [ ] Posting the identical batch twice produces zero duplicate rows.
- [ ] Invalid records are rejected with specific error reasons without failing the entire batch.

---

### BE-25 to BE-32. Individual Source Scrapers (Parallel Intern Tasks!)
*Ideal for multiple backend interns working simultaneously in independent files.*

| Task ID | Source Name | File Target | Size |
| :--- | :--- | :--- | :---: |
| **BE-25** | Internshala | `automation/scrapers/sources/internshala.py` | M |
| **BE-26** | Naukri Freshers | `automation/scrapers/sources/naukri.py` | M |
| **BE-27** | Apna Jobs | `automation/scrapers/sources/apna.py` | M |
| **BE-28** | WorkIndia | `automation/scrapers/sources/workindia.py` | M |
| **BE-29** | Shine Freshers | `automation/scrapers/sources/shine.py` | M |
| **BE-30** | Hackathons (Devpost/Unstop) | `automation/scrapers/sources/hackathons.py` | M |
| **BE-31** | College TPO Public Directories | `automation/scrapers/sources/college_tpo.py` | M |
| **BE-32** | Startup Portals (Workatastartup) | `automation/scrapers/sources/startups.py` | M |

#### What to build for each scraper
- Subclass `BaseScraper`.
- Extract Company, Title, Description, Experience, Salary/Stipend, Location, Listing URL, and Source ID.
- Provide saved offline HTML fixture in `automation/tests/fixtures/` and unit test parsing from it.

#### Out of Scope
- Strictly NO login, no CAPTCHA bypassing, and no scraping private data behind accounts.

#### Acceptance Criteria (Applies to each scraper)
- [ ] Unit test parses offline HTML fixture accurately into ingest schema.
- [ ] Cleanly halts on HTTP 403 or 429 without endless retry loops.
- [ ] Every record retains source URL for complete audit provenance.

---

### BE-33. n8n Daily Discovery Workflow
- **Domain**: Backend Automation
- **Assigned to**: TBD
- **Files**: `automation/n8n/workflows/daily_discovery.json`
- **Label**: `automation`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-24`

#### What to build
- Configure scheduled n8n workflow:
  - Daily trigger ➔ iterate over enabled sources ➔ run scraper runner ➔ POST batch to `/webhooks/scraper-ingest`.
  - Connect error output to `global_error_workflow.json`.

#### Acceptance Criteria
- [ ] Exported JSON contains no raw passwords or secrets.
- [ ] A single failing scraper source does not stop other sources from executing.

---

### BE-34. Scraper Runner with Concurrency Limits
- **Domain**: Backend Automation
- **Assigned to**: TBD
- **Files**: `automation/scrapers/runner.py`
- **Label**: `automation`
- **Size**: S (Small ~1 day)
- **Needs**: `BE-21`

#### What to build
- CLI runner: `python -m automation.scrapers.runner --source internshala`.
- Enforce strict concurrency cap (max 2 browser instances simultaneously) to preserve Oracle Free VM memory.
- Enforce 60-second per-source timeout.

#### Acceptance Criteria
- [ ] Never exceeds configured concurrency limit.
- [ ] A hung scraper process is killed at timeout and reported.

---

### BE-35. Email Verification Client
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/integrations/email_verifier.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: None

#### What to build
- Client class with `verify(email)` method returning standardized status: `deliverable`, `undeliverable`, `catch_all`, `risky`, `unknown`, `failed`.
- Read API key from environment variables.
- Include sandbox mode switch returning mock status without calling provider.

#### Acceptance Criteria
- [ ] Tests use mocked provider responses for all 6 status outcomes.
- [ ] API keys are loaded strictly from env; emails in log output are masked.

---

### BE-36. Verify Lead Contact Endpoint
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/verification.py`, `backend/app/services/verification_service.py`
- **Label**: `backend-core`
- **Size**: S (Small ~1 day)
- **Needs**: `BE-35`

#### What to build
- `POST /api/v1/leads/{id}/verify`
- Call verification client, store record in `verification_results`, and update `contact_methods.verified_status`.
- Skip API call if email was already verified within the last 7 days.

#### Acceptance Criteria
- [ ] Calling verify a second time within 7 days skips external API lookup and returns existing cached status.
- [ ] Requires researcher or admin role.

---

### BE-37. ContactOut Enrichment Client
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/integrations/contactout_client.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: None

#### What to build
- Lookup contact by name + company domain.
- Query `credit_service` before every request; abort if budget exceeded.
- Sandbox mode fallback from environment variable.

#### Acceptance Criteria
- [ ] Credit-exhausted response is never retried.
- [ ] Unit tests cover: contact found, not found, and provider error.

---

### BE-38. Snov.io Enrichment Client
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/integrations/snov_client.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: None

#### What to build
- Implement identical interface to `BE-37` so enrichment service can swap providers seamlessly.

#### Acceptance Criteria
- [ ] Returns identical normalized contact schema as `BE-37`.

---

### BE-39. Enrichment Endpoint with Credit Confirmation
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/enrichment.py`, `backend/app/services/enrichment_service.py`
- **Label**: `backend-core`
- **Size**: L (Large ~1 week)
- **Needs**: `BE-37`, `BE-38`

#### What to build
- `POST /api/v1/leads/{id}/enrich` requiring `provider` and `confirmed_credits` in request body.
- Verify user-confirmed credits matches estimate and does not exceed monthly budget.
- Persist result in `enrichment_requests` and new contacts in `contacts`.

#### Out of Scope
- This endpoint must NEVER be called from an automated schedule or unconstrained loop.

#### Acceptance Criteria
- [ ] Missing `confirmed_credits` returns 422 Unprocessable Entity and consumes zero credits.
- [ ] Result stores exact provider name and timestamp for provenance.

---

### BE-40. Credit Tracking Service
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/services/credit_service.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-07`

#### What to build
- Methods: `estimate_credits(provider, count)`, `check_budget(provider)`, `record_usage(provider, credits, user_id)`.
- Raise `BudgetExceededError` when daily or monthly budget cap is reached.

#### Acceptance Criteria
- [ ] Credit usage counters persist across server restarts (stored in database).
- [ ] Concurrent requests cannot exceed the budget limit.

---

### BE-41. Contact Fallback Logic
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/services/contact_fallback.py`
- **Label**: `backend-core`
- **Size**: S (Small ~1 day)
- **Needs**: `BE-39`

#### What to build
- Resolution hierarchy:
  1. Use existing verified contact for the organization.
  2. Fall back to official published careers/contact email already stored.
  3. If no contact found, mark opportunity status as `needs_research`.

#### Out of Scope
- Strictly NO guessing email patterns (e.g. `first.last@domain`).

#### Acceptance Criteria
- [ ] Test covers all 3 branches; missing contact correctly sets `needs_research`.

---

### BE-42. Confidence Scoring Engine
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/services/scoring_service.py`
- **Label**: `backend-core`
- **Size**: L (Large ~1 week)
- **Needs**: `BE-07`

#### What to build
- 5-factor scoring engine (0 to 100):
  1. Source reliability (max 25)
  2. Organization & contact association (max 25)
  3. Contact verification evidence (max 20)
  4. Data freshness (max 15)
  5. Completeness & consistency (max 15)
- Return numeric score, band (`high`, `medium`, `low`, `suppressed`), factor breakdown dictionary, and list of reason codes.
- Store `scoring_version = "1.0.0"` with every score row.

#### Out of Scope
- Strictly NO AI in the scoring engine. Must be 100% deterministic rules.

#### Acceptance Criteria
- [ ] Identical input data always produces identical score.
- [ ] Edge cases for each factor are covered by unit tests.

---

### BE-43. Score Bands & Campaign Eligibility Gate
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/services/eligibility.py`
- **Label**: `backend-core`
- **Size**: S (Small ~1 day)
- **Needs**: `BE-42`

#### What to build
- Gate function `is_eligible_for_campaign(opportunity)`:
  - Score >= 80: **Eligible**
  - Score 60–79: **Researcher Review Required**
  - Score < 60: **Held**
  - Suppressed recipient: **Strictly Not Eligible** regardless of score.

#### Acceptance Criteria
- [ ] Table-driven tests verify scores 59, 60, 79, 80, and a suppressed 95.

---

### BE-44. Campaign Draft Endpoints
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/campaigns.py`, `backend/app/services/draft_service.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `AI-08`

#### What to build
- `POST /api/v1/campaigns/{id}/drafts`
- Gate check: Reject non-eligible leads with 409 Conflict.
- Build verified facts dictionary, invoke `ai.gemini_client`, and persist output in `campaign_drafts`.
- On AI validation failure, retry once; if failing again, mark status `needs_review`.

#### Out of Scope
- This endpoint only drafts; it NEVER dispatches messages.

#### Acceptance Criteria
- [ ] Non-eligible lead returns 409.
- [ ] Runs with mock AI client in tests.

---

### BE-45. Campaign Approval Endpoints
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/approvals.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-44`

#### What to build
- `POST /api/v1/approvals`
- Campaign manager approves exact recipient, subject, and body.
- Generate and store SHA-256 `content_hash`.
- Any subsequent edit invalidates the approval.

#### Acceptance Criteria
- [x] Editing draft content after approval invalidates approval record.
- [x] Only users with `campaign_manager` or `admin` role can approve.

#### Implementation Summary
- Campaign Manager and Admin users can approve or reject campaign drafts.
- Approved recipient, subject, and body are locked with a SHA-256 `content_hash`.
- Editing an approved draft revokes its active approval and changes the draft status to `needs_review`.
- `backend/tests/test_campaign_approval.py` covers role restrictions, content hashing, and approval invalidation.

---

### BE-46. Pre-Send Validation Checks
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/services/dispatch_service.py`
- **Label**: `backend-core`
- **Size**: L (Large ~1 week)
- **Needs**: `BE-45`

#### What to build
- Sequential pre-send validation gate:
  1. Recipient email format valid and verified deliverable.
  2. Recipient email/domain NOT in `suppression_entries`.
  3. Approval record exists and `content_hash` matches current draft content.
  4. Idempotency key has not been previously sent.
  5. Campaign is active and within daily send limit.
- Return `{ allowed: bool, reason: Optional[str] }`.

#### Acceptance Criteria
- [ ] Unit tests verify each check halts execution if failing.
- [ ] Sending same message twice is blocked by idempotency key.

---

### BE-47. Email Provider Integration
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/integrations/email_provider.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: None

#### What to build
- Client wrapping email API (e.g. Resend or SendGrid).
- Add standard `List-Unsubscribe` headers to every outbound message.
- Sandbox mode enabled by default (routes emails to sandbox in non-production environments).
- On timeout, query provider status before retrying (prevent duplicate sends).

#### Acceptance Criteria
- [ ] Non-production sends strictly route to sandbox recipients.
- [ ] Network timeout never triggers a blind second send.

---

### BE-48. Provider Callback Webhook
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/callbacks.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-47`

#### What to build
- `POST /api/v1/callbacks`
- Verify HMAC signature and timestamp (within 5 minutes).
- Store events in `message_events` once per `provider_event_id`.
- Automatically add recipient to `suppression_entries` on hard bounce or unsubscribe.

#### Acceptance Criteria
- [ ] Duplicate event ID is ignored.
- [ ] Invalid HMAC signature returns 401.

---

### BE-49. Suppression Service and Endpoints
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/suppression.py`, `backend/app/services/suppression_service.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-09`

#### What to build
- `GET /api/v1/suppression` and `POST /api/v1/suppression`.
- Helper `is_suppressed(email)` checking both exact email and domain (`@company.com`).
- Deleting an entry requires `admin` role and a recorded justification.

#### Acceptance Criteria
- [ ] Suppressing `@example.com` blocks all addresses under that domain.
- [ ] Removals are written to `audit_logs`.

---

### BE-50. Follow-up Cancellation Rules
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/services/followup_service.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-46`

#### What to build
- Cancel all scheduled follow-up steps for an opportunity if:
  - Recipient replies.
  - Recipient bounces or unsubscribes.
  - Campaign is paused.

#### Acceptance Criteria
- [ ] Unit tests verify each trigger event cancels pending messages.

---

### BE-51. n8n Operational Workflows
- **Domain**: Backend Automation
- **Assigned to**: TBD
- **Files**: `automation/n8n/workflows/` (enrichment, verification, dispatch, callbacks)
- **Label**: `automation`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-39`, `BE-46`

#### What to build
- Workflows for Enrichment, Verification, Dispatch, and Callbacks.
- Enrichment and dispatch trigger strictly from explicit dashboard actions.
- Each links to `global_error_workflow.json`.

#### Out of Scope
- n8n must NEVER make scoring, validation, or approval decisions (FastAPI is the sole authority).

#### Acceptance Criteria
- [ ] No hardcoded passwords or API keys in exported JSON files.
- [ ] Replaying an n8n workflow never sends an email twice.

---

### BE-52. Error Webhook & Storage
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/guardrails.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-10`

#### What to build
- `POST /api/v1/guardrails/error-webhook`
- Redact secrets and persist in `automation_errors`.
- Classify into categories: `temporary_network`, `rate_limit`, `invalid_input`, `expired_credential`, `credit_exhaustion`, `source_layout_changed`, `ai_output_invalid`, `send_timeout`, `permanent_provider_rejection`.
- Automatically mark `replay_eligible = false` for send timeouts and provider rejections.

#### Acceptance Criteria
- [ ] Stack traces and payloads are redacted before database write.
- [ ] Unit tests cover all error categories.

---

### BE-53. n8n Global Error Trap Workflow
- **Domain**: Backend Automation
- **Assigned to**: TBD
- **Files**: `automation/n8n/workflows/global_error_workflow.json`
- **Label**: `automation`
- **Size**: S (Small ~1 day)
- **Needs**: `BE-52`

#### What to build
- n8n Error Trigger that captures execution ID, failing node name, redacted input, and posts to `BE-52` webhook.

#### Acceptance Criteria
- [ ] Deliberately failing test node triggers webhook successfully.

---

### BE-55. Error Center & Health Endpoints
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/app/api/v1/error_center.py`
- **Label**: `backend-core`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-52`

#### What to build
- `GET /api/v1/error_center`: List recent errors with filters.
- `POST /api/v1/error_center/{id}/replay`: Trigger replay for eligible errors; return 409 Conflict if not replay-eligible.
- `GET /api/v1/system/health`: Return queue metrics, credit usage, and source health.

#### Acceptance Criteria
- [ ] Replaying a send timeout returns 409.
- [ ] System health responds in under 1 second.

---

### BE-56. Backend Pytest Suites
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `backend/tests/<module>/test_*.py`
- **Label**: `backend-core`, `tests`
- **Size**: M per module
- **Needs**: Module completed

#### What to build
- Unit test suites for each module (auth, leads, enrichment, scoring, dispatch, callbacks) using test database and fixtures.

#### Acceptance Criteria
- [ ] Every public function has a success and a failure test.
- [ ] Tests run cleanly in CI on an empty database.

---

### BE-57. PostgreSQL Backup & Export Script
- **Domain**: Backend Automation
- **Assigned to**: TBD
- **Files**: `infra/backup/backup.sh`, `infra/backup/restore_guide.md`
- **Label**: `infra`
- **Size**: S (Small ~1 day)
- **Needs**: None

#### What to build
- Automated `pg_dump` script rotating 7 daily and 4 weekly compressed copies.
- Step-by-step restoration verification guide.

#### Acceptance Criteria
- [ ] A generated dump successfully restores into an empty database in a test environment.

---

### BE-58. Security Review & Audit
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `docs/security-review.md`
- **Label**: `backend-core`, `docs`
- **Size**: M (Medium ~2-3 days)
- **Needs**: Most modules completed

#### What to build
- Security audit report: Rate limit verification, CORS policies, scan Git history for leaked secrets, verify log redaction, run `pip-audit`.

#### Acceptance Criteria
- [ ] Zero secrets found in Git history.
- [ ] Every finding has an assigned severity and remediation plan.

---

### BE-59. Postman Collection & Backend Documentation
- **Domain**: Backend Core
- **Assigned to**: TBD
- **Files**: `docs/backend-guide.md`, `docs/postman/outreach_crm.json`
- **Label**: `backend-core`, `docs`
- **Size**: S (Small ~1 day)
- **Needs**: All endpoints completed

#### What to build
- Complete Postman collection covering every endpoint with example request bodies.
- Update `backend-guide.md` with instructions on local execution and database seeding.

#### Acceptance Criteria
- [ ] A new teammate can run the backend and log in using only the guide.

---

### BE-60. Oracle VM Setup Guide & Caddy Config
- **Domain**: Backend Automation
- **Assigned to**: TBD
- **Files**: `infra/oracle-vm-setup.md`, `infra/caddy/Caddyfile`
- **Label**: `infra`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `BE-12`

#### What to build
- Complete deployment guide for Oracle Cloud Always Free VM: Docker setup, UFW firewall (ports 80/443 only), automatic Caddy HTTPS, and fallback hosting plan.

#### Acceptance Criteria
- [ ] A team member can set up a fresh VM relying solely on the guide.

---

# 3. AI Team Remaining Tickets (`ai/`)

---

### AI-05. Experience Range Parser (Hard Cases)
- **Domain**: AI
- **Assigned to**: Completed & Verified
- **Files**: `ai/extraction/experience_parser.py`
- **Label**: `ai`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `AI-04`

#### What to build
- Extract `(min_experience, max_experience, opportunity_type, confidence)` from messy, unstructured job descriptions.
- Regex rules first; optional Gemini Flash fallback when rule confidence is below 0.6.

#### Acceptance Criteria
- [x] 40 test phrases pass in rules-only mode.
- [x] AI fallback is disabled by default and tested with mock client.

---

### AI-06. Lead Category Classifier
- **Domain**: AI
- **Assigned to**: Completed & Verified
- **Files**: `ai/extraction/category_classifier.py`
- **Label**: `ai`
- **Size**: S (Small ~1 day)
- **Needs**: `AI-04`

#### What to build
- Classify opportunity into: `job`, `startup`, `internship`, `hackathon`, `college_tpo` with confidence score.

#### Acceptance Criteria
- [x] Correctly classifies at least 90% of fixtures in `ai/fixtures/jobs/sample_jobs.json`.

---

### AI-07. Fuzzy Company Name Matcher
- **Domain**: AI
- **Assigned to**: TBD
- **Files**: `ai/extraction/company_matcher.py`
- **Label**: `ai`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `AI-04`

#### What to build
- `calculate_similarity(company_a, company_b)` returning similarity score (0.0 to 1.0) and explanation (token overlap, abbreviation match, suffix removal).
- Distinguishes look-alikes (e.g. "Acme Healthcare" vs "Acme Logistics" must score low).

#### Out of Scope
- This function only proposes duplicate candidates; it NEVER automatically merges records.

#### Acceptance Criteria
- [ ] 20 test pairs evaluated; distinct companies with shared root names score low.

---

### AI-11. Tone Variants Prompts
- **Domain**: AI
- **Assigned to**: Completed & Verified
- **Files**: `ai/prompts/tone_hr.md`, `ai/prompts/tone_tpo.md`, `ai/prompts/tone_founder.md`
- **Label**: `ai`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `AI-08`

#### What to build
- Specialized tone guidelines for:
  - `tone_hr.md`: Professional, concise, metric-driven for corporate recruiters.
  - `tone_tpo.md`: Formal, respectful, institutional for university placement officers.
  - `tone_founder.md`: Energetic, peer-to-peer, direct for startup founders.
- Include explicit "DO" and "DO NOT" examples for each.

#### Acceptance Criteria
- [x] Sample outputs for each tone saved in `ai/evals/samples/`.
- [x] Each sample stays within 80 to 150 words.

---

### AI-12. Invalid Output Handling & Retry Guard
- **Domain**: AI
- **Assigned to**: TBD
- **Files**: `ai/validators/output_guard.py`
- **Label**: `ai`
- **Size**: S (Small ~1 day)
- **Needs**: `AI-10`

#### What to build
- `draft_with_guard(facts, tone)` wrapper:
  1. Call Gemini to generate draft.
  2. Run Pydantic schema validation, fact-check, and safety checks.
  3. If check fails, retry once passing the specific validation error to the model.
  4. If failing a second time, return draft marked `status = "needs_review"`.

#### Out of Scope
- Never raises unhandled exception for bad model output and never sends emails.

#### Acceptance Criteria
- [ ] Tests verify pass, fail-then-pass, and fail-twice scenarios using mock client.

---

### AI-13. Outreach Safety & Compliance Checks
- **Domain**: AI
- **Assigned to**: Completed & Verified
- **Files**: `ai/validators/safety_checks.py`
- **Label**: `ai`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `AI-03`

#### What to build
- Rule-based safety checker:
  - Subject length <= 80 characters.
  - Body length between 80 and 200 words.
  - Scan for spam-trigger words (e.g., "guaranteed", "100% free", "urgent prize", "act now").
  - Mandatory unsubscribe / opt-out sentence present.
  - Detect links or phone numbers not present in verified facts.

#### Acceptance Criteria
- [x] Each rule has one passing and one failing test case.

---

### AI-15. Draft Quality Evaluation Harness
- **Domain**: AI
- **Assigned to**: Completed & Verified
- **Files**: `ai/evals/run_eval.py`, `ai/evals/cases/test_cases.json`
- **Label**: `ai`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `AI-08`

#### What to build
- 20 realistic test cases and evaluation rubric (Relevance, Factual Accuracy, Tone, Word Count).
- Script outputs formatted summary table and exports results to `eval_results.csv`.

#### Acceptance Criteria
- [x] Runs fully offline in mock mode and online with a live API key.

---

### AI-16. Error Diagnosis Engine
- **Domain**: AI
- **Assigned to**: TBD
- **Files**: `ai/diagnosis/error_diagnoser.py`, `ai/prompts/error_diagnosis_v1.md`
- **Label**: `ai`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `AI-02`

#### What to build
- Takes failed component name, redacted stack trace, and payload snapshot.
- Returns structured diagnosis conforming to `contracts/ai-schemas/error_diagnosis.json`:
  - `likely_root_cause`, `confidence`, `suggested_action`, `is_transient`.
- Strip all credentials and personal emails before sending prompt to Gemini.

#### Out of Scope
- Suggestions only; the AI never modifies code or retries actions autonomously.

#### Acceptance Criteria
- [ ] 10 fixture errors return valid structured output.
- [ ] Returns empty fallback suggestion on API timeout instead of raising.

---

### AI-17. Selector Suggester for Broken HTML
- **Domain**: AI
- **Assigned to**: TBD
- **Files**: `ai/diagnosis/selector_suggester.py`
- **Label**: `ai`
- **Size**: L (Large ~1 week)
- **Needs**: `AI-16`

#### What to build
- Input: Broken HTML snippet, expired CSS selector, target field description.
- Model suggests new resilient CSS selector.
- Verify suggestion using Python HTML parser (`BeautifulSoup`): must match exactly 1 DOM element.

#### Acceptance Criteria
- [ ] Tested on 5 broken HTML snippets; suggestions matching 0 or >1 elements are rejected.

---

### AI-18. n8n Payload Fix Suggester
- **Domain**: AI
- **Assigned to**: TBD
- **Files**: `ai/diagnosis/payload_fixer.py`
- **Label**: `ai`
- **Size**: M (Medium ~2-3 days)
- **Needs**: `AI-16`

#### What to build
- Input: Failing JSON payload and error message.
- Output: Corrected JSON payload or adjusted retry parameters.

#### Acceptance Criteria
- [ ] Tested across 5 failure fixtures (missing field, wrong data type, nested array mismatch, bad ISO date).

---

### AI-20. Token Usage & In-Memory Hash Cache
- **Domain**: AI
- **Assigned to**: TBD
- **Files**: `ai/usage.py`
- **Label**: `ai`
- **Size**: S (Small ~1 day)
- **Needs**: `AI-02`

#### What to build
- Record prompt and completion token counts per call.
- In-memory cache keyed by SHA-256 hash of prompt input; identical repeated prompts return cached output with 0 new token cost.

#### Acceptance Criteria
- [ ] Calling with identical input returns cached output and reports 0 new tokens.

---

### AI-21. Prompt Catalog Documentation
- **Domain**: AI
- **Assigned to**: Completed & Verified
- **Files**: `docs/ai-guide.md`
- **Label**: `ai`, `docs`
- **Size**: S (Small ~1 day)
- **Needs**: All prompts completed

#### What to build
- Catalog documenting every prompt: Template name, active version, purpose, input variables, output schema, and safe modification procedures.

#### Acceptance Criteria
- [x] Every file in `ai/prompts/` is documented.
