# WASH Competency Profiler — Feedback Implementation Plan

**Date:** 3 July 2026
**Repository reviewed:** `JamesElliot/wash-competency-profiler` at `main` (`9e29edf`)
**Purpose:** Implementation plan for student and stakeholder feedback collected through Nicole Weber.

---

## 1. Current Codebase Baseline

The GitHub repository is an active Vite + React + TypeScript application, not just a design repo.

Relevant implementation files:

- `src/types/index.ts` — shared domain, competency, response, scoring, and session types.
- `src/data/Competencies.csv` — source competency data.
- `src/data/competencies.ts` — PapaParse CSV import and metadata helpers.
- `src/lib/ScoringEngine.ts` — classification, gap, priority, and domain score calculations.
- `src/lib/ScoringEngine.test.ts` — scoring unit tests.
- `src/context/AssessmentContext.tsx` — reducer, session state, localStorage persistence.
- `src/components/Questionnaire.tsx` — competency cards, Likert controls, skip checkbox, question-level GitHub feedback links.
- `src/components/ResultsDashboard.tsx` — domain summary, radar charts, strengths, priorities, recommendations.
- `src/components/RadarChart.tsx` — Recharts radar visualisation and chart image export.
- `src/components/ExportButton.tsx` — PDF-only report generation with jsPDF.
- `src/pages/ResultsPage.tsx` — results metadata, optional name, reset, and export entry point.
- `src/pages/LandingPage.tsx` — attribution text and framework link.
- `UPDATE_PLAN.md` — prior framework data update plan, largely implemented in the current CSV.

Current data state:

- `src/data/Competencies.csv` contains 219 rows.
- Domain counts now match `UPDATE_PLAN.md`: Core 66, Hygiene promotion 28, Vector control 14, Excreta management 38, Safe water supply 30, Solid waste management 43.
- No duplicate competency IDs were found.
- The previous `Solid Waste Management` capitalisation issue appears fixed in `src/data/Competencies.csv`.

Current feature state:

- N/A exists as a `Not applicable / Skip` checkbox, but it is encoded only as `competence: null` and `importance: null`.
- The app cannot distinguish `not applicable`, `intentionally skipped`, and `not yet answered`.
- PDF export exists, but Word export does not.
- PDF export includes strengths and priorities with full competency labels, but it does not include a full assessment record, N/A list, notes, or editable action planning.
- Question-level feedback links already exist via pre-filled GitHub issues.
- Attribution exists on the landing page, but not as centralised reusable content or in exports.

---

## 2. Implementation Priorities

### Priority 1 — Fix the response model before extending results or exports

This should be done first because N/A, progress, results counts, exports, and localStorage all depend on response semantics.

### Priority 2 — Rework results into clearer user-facing categories

Users need to understand why an item appears as a priority, monitor item, or strength. This is mostly a dashboard and copy change once the scoring engine is made explicit.

### Priority 3 — Build a shared export data layer

The PDF and future Word export should use the same prepared data. Do not duplicate filtering and label joins across export components.

### Priority 4 — Add Word export and notes/action planning

This is the highest-value new user-facing feature after N/A scoring because it turns assessment output into an editable professional development record.

---

## 3. Change Request Plans

## CR1 — Make N/A explicit and exclude it from scoring

**Current implementation:**
`src/components/Questionnaire.tsx` has a `Not applicable / Skip` checkbox. It writes `{ competence: null, importance: null }`. `src/lib/ScoringEngine.ts` treats null values as `skipped`.

**Issue:**
The app cannot tell whether an item is not applicable, unanswered, or intentionally skipped. This affects progress, results interpretation, exports, and analytics.

**Files to change:**

- `src/types/index.ts`
- `src/context/AssessmentContext.tsx`
- `src/components/Questionnaire.tsx`
- `src/pages/QuestionnairePage.tsx`
- `src/lib/ScoringEngine.ts`
- `src/lib/ScoringEngine.test.ts`
- `src/components/ResultsDashboard.tsx`
- `src/components/RadarChart.tsx`
- `src/components/ExportButton.tsx` initially, then later export modules
- `src/lib/storage.ts`

**Implementation steps:**

1. Add response status:
   ```ts
   export type ResponseStatus = 'answered' | 'not_applicable' | 'unanswered';

   export type Response = {
     competencyId: string;
     competence: 1 | 2 | 3 | 4 | 5 | null;
     importance: 1 | 2 | 3 | 4 | 5 | null;
     status: ResponseStatus;
     note?: string;
   };
   ```
2. Add a migration in `loadSession()` so old localStorage sessions still load:
   - if both values are null, migrate to `status: 'not_applicable'` only if the old response exists because the skip checkbox created it
   - if values are present, migrate to `status: 'answered'`
   - missing response remains `unanswered` and does not need to be stored
3. Update `Questionnaire.tsx`:
   - replace local `skipped` state with derived `response?.status === 'not_applicable'`
   - when N/A is checked, write `status: 'not_applicable'`, `competence: null`, `importance: null`
   - when either rating is changed, write `status: 'answered'`
   - label the checkbox `Not applicable to my role` rather than `Not applicable / Skip`
4. Update `classifyResponse()`:
   - `not_applicable` -> `skipped`
   - `unanswered` or missing response -> `skipped`
   - only `answered` responses with both ratings participate in scoring
5. Extend `DomainScore`:
   ```ts
   answeredCount: number;
   notApplicableCount: number;
   unansweredCount: number;
   ```
6. In `scoreDomain()`, calculate averages only from valid answered items.
7. For all-N/A or all-unanswered domains, return averages as `null` or continue using `0` but expose counts so UI can show `No applicable competencies assessed`. Prefer `number | null` for clarity if the refactor is acceptable.
8. Update `RadarChart.tsx`:
   - N/A items should render as null/omitted where possible, not as zero-rated weak points.
   - tooltip should say `Not applicable` or `Not rated`, not `Not rated` for both.
9. Update tests with explicit cases for:
   - answered response
   - not applicable response
   - missing/unanswered response
   - mixed answered/N/A domain
   - all-N/A domain

**Acceptance criteria:**

- N/A does not lower averages, priority scores, or radar charts.
- N/A items do not appear in strengths, monitor, or development priorities.
- Domain summaries show assessed and N/A counts.
- Old saved sessions do not crash the app.

---

## CR2 — Clarify priority logic and separate monitor items

**Current implementation:**
`ResultsDashboard.tsx` shows strengths and development priorities. `monitor` items are calculated but not surfaced. `RecommendationPanel.tsx` only receives strengths and priorities.

**Issue:**
Users asked whether proficient competencies can still show as priorities. The logic needs to be visible and plain.

**Files to change:**

- `src/lib/ScoringEngine.ts`
- `src/components/ResultsDashboard.tsx`
- `src/components/RecommendationPanel.tsx`
- `src/lib/ScoringEngine.test.ts`

**Implementation steps:**

1. Add helper:
   ```ts
   export function getMonitorItems(scores: DomainScore[]): CompetencyScore[]
   ```
2. In `ResultsDashboard.tsx`, add a third section:
   - `Maintain and monitor`
   - rule: important to role and currently proficient
   - include competence and importance values where available
3. Change explanatory copy:
   - `Development priorities` = high importance and competence of 1-2
   - `Maintain and monitor` = high importance and competence of 3
   - `Strengths to use or share` = high importance and competence of 4-5
4. Update `RecommendationPanel.tsx` to accept monitor items and include a short recommendation when there are no high-priority gaps but several monitor items.
5. Consider changing priority formula in README or code for consistency. The README says `importance × (5 − competence)`, while `ScoringEngine.ts` currently uses `(importance - competence) × importance`. Decide one formula and make README/tests match. The PRD specifies `gap = Importance - Competence; priority = gap × Importance`, so the code currently matches the PRD.

**Acceptance criteria:**

- Competence 3 / importance 4 appears under `Maintain and monitor`, not `Development priorities`.
- Results page explains the categories without technical language.
- README and tests describe the same priority formula as the code.

---

## CR3 — Include full competency text and full assessment record in exports

**Current implementation:**
`ExportButton.tsx` maps IDs to competency labels and writes priority/strength text into a PDF. It does not include all competencies, N/A items, monitor items, or notes.

**Files to change/add:**

- Add `src/lib/exportData.ts`
- Update `src/components/ExportButton.tsx`
- Later add `src/lib/pdfExport.ts`
- Later add `src/lib/wordExport.ts`

**Implementation steps:**

1. Add a shared export row type:
   ```ts
   export type ExportCompetencyRow = {
     competencyId: string;
     domainLabel: string;
     themeLabel: string;
     subThemeLabel?: string;
     competencyText: string;
     competence: number | null;
     importance: number | null;
     status: ResponseStatus;
     classification: CompetencyScore['classification'];
     priority: number;
     note?: string;
   };
   ```
2. Add `buildExportAssessmentRecord(session, scores)` that joins:
   - `COMPETENCIES`
   - `DOMAINS`
   - `THEMES`
   - `SUB_THEMES`
   - responses
   - item scores
3. Export sections should include:
   - domain summary
   - development priorities
   - maintain and monitor
   - strengths
   - not applicable items
   - full assessment record
   - general development notes
4. Refactor `ExportButton.tsx` so it no longer performs label joins directly.

**Acceptance criteria:**

- Export logic has one source of truth for filtering and labels.
- Every exported item uses the full competency statement from the CSV.
- Full assessment record can be included without relying on chart screenshots.

---

## CR4 — Add editable Word export

**Current implementation:**
PDF export only.

**Files to change/add:**

- `package.json`
- `src/lib/wordExport.ts`
- `src/components/ExportButton.tsx`, or replace with `src/components/ExportControls.tsx`
- `src/pages/ResultsPage.tsx`

**Dependencies:**

```bash
npm install docx file-saver
npm install -D @types/file-saver
```

**Implementation steps:**

1. Rename `ExportButton.tsx` to `ExportControls.tsx` or add a sibling component.
2. Add two buttons:
   - `Download PDF`
   - `Download editable Word document`
3. Generate `.docx` with:
   - title and assessment metadata
   - domain summary table
   - development priorities with full competency text
   - maintain and monitor items
   - strengths
   - N/A list
   - editable action plan table
   - acknowledgements and framework link
4. Include radar chart images only if the chart refs can be converted reliably to PNG; the Word export must remain useful even without charts.
5. Keep the file name pattern:
   - `WASH_Competency_Profile_YYYY-MM-DD.docx`

**Acceptance criteria:**

- Word export opens in Word and Google Docs.
- The document is editable and useful as a professional development plan.
- It includes notes and full competency text.
- It does not fail if chart capture fails.

---

## CR5 — Add notes and professional development action planning

**Current implementation:**
There are no notes fields in session state or exports.

**Files to change:**

- `src/types/index.ts`
- `src/context/AssessmentContext.tsx`
- `src/components/ResultsDashboard.tsx`
- `src/pages/ResultsPage.tsx`
- `src/lib/storage.ts`
- `src/lib/exportData.ts`
- `src/lib/pdfExport.ts`
- `src/lib/wordExport.ts`

**Implementation steps:**

1. Add session-level notes:
   ```ts
   generalDevelopmentNotes: string;
   ```
2. Add per-competency notes using `Response.note`.
3. Add reducer actions:
   - `SET_GENERAL_NOTES`
   - `SET_RESPONSE_NOTE`
4. On results page, add a notes section:
   - `Professional development notes`
   - `Training, mentoring, or practice opportunities I want to pursue`
5. In development priorities, add compact textarea controls per item:
   - planned action
   - support needed
   - timeframe, if using structured notes
6. Persist notes in localStorage.
7. Include notes in both PDF and Word exports.

**Acceptance criteria:**

- Notes persist across reload.
- Notes export to PDF and Word.
- Empty notes do not create distracting blank sections.

---

## CR6 — Centralise acknowledgements, framework link, and app metadata

**Current implementation:**
Landing page hard-codes attribution and framework contributor text. README and `UPDATE_PLAN.md` mention attribution and links.

**Files to change/add:**

- Add `src/data/appContent.ts`
- Update `src/pages/LandingPage.tsx`
- Update export modules
- Optionally update `README.md`

**Implementation steps:**

1. Add:
   ```ts
   export const APP_CONTENT = {
     appVersion: '0.1.0',
     frameworkVersion: 'Humanitarian WASH Competency Technical Framework, 6 June 2026 review version',
     frameworkUrl: 'https://redr.org.uk/publication/wash-competency-framework-for-low-resource-contexts/',
     acknowledgement: '...',
     contributorCredits: '...',
     disclaimer: '...',
     feedbackUrl: 'https://github.com/JamesElliot/wash-competency-profiler/issues/new',
   };
   ```
2. Replace hard-coded landing page text with content constants.
3. Add acknowledgement/disclaimer to PDF and Word exports.
4. Add framework version to results page and exports.
5. When the final framework PDF exists, update `frameworkUrl` only.

**Acceptance criteria:**

- Attribution is updated in one file.
- Exports include acknowledgements/disclaimer.
- Results include framework version/date.

---

## CR7 — Improve handling of uneven domain sizes and radar readability

**Current implementation:**
Domain summary uses averages and aggregate priority. Radar charts hide axis labels when more than 20 items, which affects Core and Solid waste management. Large domains are still visually dense.

**Files to change:**

- `src/components/ResultsDashboard.tsx`
- `src/components/RadarChart.tsx`
- `src/lib/ScoringEngine.ts`

**Implementation steps:**

1. Add domain summary counts:
   - assessed
   - N/A
   - total
2. Add copy explaining that scores are averages and item counts vary by domain.
3. For domains over 20 items, consider one of:
   - theme-level radar aggregation
   - show item radar but add a theme summary table
   - add toggle: `Items` / `Themes`
4. Avoid ranking labels like `best` or `worst`.
5. In PDF/Word export, include item counts and assessed counts.

**Acceptance criteria:**

- Large domains are still interpretable.
- Users can see how many competencies informed each score.
- Domains with more items are not framed as automatically more important.

---

## CR8 — Extend feedback capture beyond question-level GitHub issues

**Current implementation:**
`Questionnaire.tsx` has a flag icon that opens a pre-filled GitHub issue for a competency.

**Files to change:**

- `src/data/appContent.ts`
- `src/pages/ResultsPage.tsx`
- `src/components/ResultsDashboard.tsx`

**Implementation steps:**

1. Keep the existing competency feedback link.
2. Move repo URL to `APP_CONTENT`.
3. Add a general feedback link on the results page:
   - usefulness of outputs
   - export usefulness
   - confusing/missing competencies
4. Use either GitHub issues or an external form URL.
5. If GitHub issues remain the only feedback path, add a general issue template URL with labels such as `pilot-feedback`.

**Acceptance criteria:**

- Users can provide feedback on individual competencies and on the app/results overall.
- Feedback links do not require editing component code when the repo/form changes.

---

## CR9 — Document hosting and maintenance ownership

**Current implementation:**
README says the live site is on Netlify and pushes to `main` redeploy. It still contains placeholder wording for custom domain.

**Files to change/add:**

- Add `DEPLOYMENT.md`
- Update `README.md`
- Add `APP_CONTENT.appVersion` and `frameworkVersion`

**Implementation steps:**

1. Create `DEPLOYMENT.md` covering:
   - repository owner
   - Netlify site owner
   - deploy branch
   - build command
   - publish directory
   - who approves content changes
   - how competency CSV updates are validated
2. Add version metadata to app footer/results.
3. Decide whether the app remains under James's GitHub or moves under institutional ownership.

**Acceptance criteria:**

- Maintenance process is clear enough for handover.
- App version and framework version are visible.
- README no longer has placeholder deployment language.

---

## 4. Recommended Code Change Sequence

### Phase 1 — Response model and scoring

1. Update types for `ResponseStatus`, response notes, domain counts, and session notes.
2. Add localStorage migration in `storage.ts`.
3. Update reducer actions in `AssessmentContext.tsx`.
4. Update N/A handling in `Questionnaire.tsx`.
5. Update `ScoringEngine.ts` and tests.
6. Update `RadarChart.tsx` to handle N/A/unanswered distinctly.

Run:

```bash
npm test
npm run build
```

### Phase 2 — Results dashboard clarity

1. Add `getMonitorItems()`.
2. Add assessed/N/A counts to domain summary.
3. Add monitor section.
4. Update priority explanation copy.
5. Update recommendations.

Run:

```bash
npm test
npm run build
```

### Phase 3 — Notes and export data layer

1. Add session and per-competency notes.
2. Add `src/lib/exportData.ts`.
3. Refactor existing PDF export to consume export data.
4. Add full assessment record and N/A sections to PDF.

Run:

```bash
npm test
npm run build
```

### Phase 4 — Word export

1. Install `docx` and `file-saver`.
2. Add `src/lib/wordExport.ts`.
3. Replace single export button with export controls.
4. Test exported `.docx` in Word/Google Docs.

Run:

```bash
npm test
npm run build
```

### Phase 5 — Content centralisation, feedback, and deployment docs

1. Add `APP_CONTENT`.
2. Refactor landing attribution.
3. Add acknowledgement/framework metadata to exports.
4. Add results-page feedback link.
5. Add `DEPLOYMENT.md`.
6. Update README.

Run:

```bash
npm test
npm run build
```

---

## 5. Testing Checklist

### Automated tests

- `classifyResponse()` for answered, not applicable, unanswered/missing.
- `scoreDomain()` excludes N/A from averages and aggregate priority.
- all-N/A domain returns no misleading score.
- `getMonitorItems()` returns only monitor items.
- export data builder returns full text and correct sections.
- storage migration handles old response objects without `status`.

### Manual QA

- Resume an old saved session after the response model migration.
- Complete one domain with a mix of answered and N/A responses.
- Mark an entire domain as N/A.
- Confirm domain summary counts are correct.
- Confirm radar chart does not show N/A as zero competence.
- Confirm no proficient item appears as a development priority.
- Add notes, reload, and confirm notes persist.
- Export PDF and confirm full text, N/A, monitor items, and notes appear.
- Export Word and confirm it is editable.
- Check mobile layout at 375px width.

---

## 6. Open Product Decisions

1. Should the app label the option `Not applicable to my role`, `Not relevant to my role`, or both?
2. Should all competencies be included in the default export, or should `Full assessment record` be a separate option?
3. Should Word export include radar chart images, or prioritise clean editable text and tables?
4. What is the final framework version label and URL?
5. Should general feedback go to GitHub issues or a non-GitHub form for classroom users?
6. Does the app remain hosted under James's GitHub/Netlify, or move to an institutional account before wider review?

---

## 7. Estimated Effort

| Phase | Scope | Estimate |
|---|---|---:|
| 1 | Response model, N/A semantics, scoring tests | 0.5-1 day |
| 2 | Results clarity, monitor section, counts | 0.5 day |
| 3 | Notes plus export data refactor and PDF updates | 1 day |
| 4 | Word export | 0.5-1 day |
| 5 | Content centralisation, feedback link, deployment docs | 0.5 day |
| QA | Manual export/mobile/accessibility checks | 0.5 day |
| **Total** | | **3.5-4.5 days** |

The main risk is export complexity, especially keeping PDF chart capture reliable while adding long competency text. The mitigation is to build `exportData.ts` first and make both PDF and Word exports text/table-driven, with radar charts treated as useful but non-blocking.
