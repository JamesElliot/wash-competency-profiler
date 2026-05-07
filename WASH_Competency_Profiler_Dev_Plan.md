# WASH Competency Profiler — Development Plan
**Version:** 0.1 | **Author:** James Brown | **Date:** May 2026  
**Tool:** Claude Code + VS Code | **Target:** MVP as per PRD v0.1

---

## 1. Overview

This plan translates the WASH Competency Profiler PRD into a phased Claude Code development workflow. Each phase maps to a discrete set of Claude Code prompts, with clear acceptance criteria drawn from the PRD.

The approach is:
- **Single-page React app** built with Vite + TypeScript
- **Modular components** matching the file structure suggested in the PRD (`Questionnaire.tsx`, `ScoringEngine.ts`, etc.)
- **No backend at MVP** — all state in `localStorage` with anonymous sessions
- **Phase-by-phase delivery** so the app is testable at each stage

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Type safety; aligns with PRD component naming (.tsx/.ts) |
| Build tool | Vite | Fast dev server, minimal config |
| Styling | Tailwind CSS | Utility-first; rapid iteration without custom CSS |
| Routing | React Router v6 | Simple multi-step flow (landing → questionnaire → results) |
| Charts | Recharts (MVP) → D3 (Phase 2) | Recharts covers radar charts out of the box; D3 unlocks fingerprint rendering later |
| PDF export | `html2canvas` + `jsPDF` | Captures rendered DOM — charts included — without a server |
| State management | React Context + `useReducer` | Sufficient for MVP; avoids Redux overhead |
| Persistence | `localStorage` | Anonymous sessions, no backend required |
| Testing | Vitest + React Testing Library | Native Vite integration; minimal config |
| Linting | ESLint + Prettier | Standard TS/React ruleset |

**Key dependencies to install:**
```
react react-dom react-router-dom
recharts
html2canvas jspdf
tailwindcss @tailwindcss/forms
vitest @testing-library/react
```

---

## 3. Project Structure

```
wash-competency-profiler/
├── public/
├── src/
│   ├── data/
│   │   └── competencies.ts        # Competency domain/item data (source of truth)
│   ├── types/
│   │   └── index.ts               # Competency, Response, DomainScore, etc.
│   ├── lib/
│   │   ├── ScoringEngine.ts       # Gap, priority, domain aggregate calculations
│   │   └── storage.ts             # localStorage read/write helpers
│   ├── components/
│   │   ├── Questionnaire.tsx      # Multi-step assessment form
│   │   ├── RadarChart.tsx         # Domain radar chart wrapper (Recharts)
│   │   ├── ResultsDashboard.tsx   # Strengths, priorities, domain summary
│   │   ├── RecommendationPanel.tsx# Rule-based recommendation output
│   │   ├── ProgressBar.tsx        # Survey completion indicator
│   │   └── ExportButton.tsx       # PDF generation trigger
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── SetupPage.tsx          # Purpose and domain selection
│   │   ├── QuestionnairePage.tsx
│   │   └── ResultsPage.tsx
│   ├── context/
│   │   └── AssessmentContext.tsx  # Global state (responses, scores, metadata)
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Data Model

Defined in `src/types/index.ts` and `src/data/competencies.ts`.

```typescript
// src/types/index.ts

export type CompetencyItem = {
  id: string;
  domain: string;
  domainId: string;
  label: string;
  description: string;
};

export type Response = {
  competencyId: string;
  competence: 1 | 2 | 3 | 4 | 5 | null;  // null = skipped/N/A
  importance: 1 | 2 | 3 | 4 | 5 | null;
};

export type CompetencyScore = {
  competencyId: string;
  gap: number;           // importance - competence
  priority: number;      // gap × importance
  classification: 'strength' | 'development_priority' | 'monitor' | 'low_priority' | 'skipped';
};

export type DomainScore = {
  domainId: string;
  domainLabel: string;
  avgCompetence: number;
  avgImportance: number;
  aggregatePriority: number;
  items: CompetencyScore[];
};
```

The `competencies.ts` file should be populated from `Updated_WASH_Core_Competencies_Self_Assessment_4_28_2026.docx`. Extract all domain headers and competency items from that document to build the array before starting development.

**Classification logic (for `ScoringEngine.ts`):**

| Condition | Classification |
|---|---|
| Importance ≥4 AND Competence ≥4 | `strength` |
| Importance ≥4 AND Competence ≤2 | `development_priority` |
| Importance ≥4 AND Competence = 3 | `monitor` |
| Importance ≤3 | `low_priority` |
| Either null | `skipped` |

---

## 5. Phased Development

### Phase 0 — Project Scaffolding
**Estimated time:** 30–60 minutes

**Claude Code prompt:**
```
Scaffold a new Vite + React + TypeScript project called wash-competency-profiler. 
Install and configure: react-router-dom, recharts, tailwindcss @tailwindcss/forms, 
html2canvas, jspdf, vitest, @testing-library/react.

Create the full folder structure:
src/data/, src/types/, src/lib/, src/components/, src/pages/, src/context/

Add a stub index.ts to each folder. Set up React Router with four routes:
/ (LandingPage), /setup (SetupPage), /assessment (QuestionnairePage), /results (ResultsPage).
Each page can be a placeholder div for now.

Configure Tailwind with a WASH-appropriate colour palette:
primary: blue-700, accent: teal-500, warning: amber-500, danger: red-600.
```

**Done when:** `npm run dev` serves the app; navigating to each route shows the correct placeholder.

---

### Phase 1 — Data Layer
**Estimated time:** 1–2 hours (plus manual data entry from DOCX)

**Step 1 — Extract competencies from the DOCX manually:**  
Open `Updated_WASH_Core_Competencies_Self_Assessment_4_28_2026.docx` and map each domain and competency item into the array format. This is the only manual step.

**Claude Code prompt:**
```
Create src/types/index.ts with these TypeScript types:
CompetencyItem, Response, CompetencyScore, DomainScore, AssessmentSession.

Create src/data/competencies.ts exporting a typed array of CompetencyItem objects.
Include at least two placeholder domains with three items each so the app can run 
end-to-end before the full data is entered.

Create src/lib/ScoringEngine.ts with pure functions:
- calculateItemScore(response: Response): CompetencyScore
- calculateDomainScore(items: CompetencyItem[], responses: Response[]): DomainScore
- calculateAllScores(competencies: CompetencyItem[], responses: Response[]): DomainScore[]

Use the classification logic:
- Importance ≥4 AND Competence ≥4 → 'strength'
- Importance ≥4 AND Competence ≤2 → 'development_priority'
- Importance ≥4 AND Competence = 3 → 'monitor'
- Importance ≤3 → 'low_priority'
- null input → 'skipped'

Write unit tests for ScoringEngine.ts covering boundary cases (score = 4, score = 2).
```

**Done when:** `npm run test` passes all ScoringEngine unit tests.

---

### Phase 2 — Assessment Context and Storage
**Estimated time:** 1 hour

**Claude Code prompt:**
```
Create src/context/AssessmentContext.tsx providing global state via useContext/useReducer.

State shape:
{
  purpose: 'current_role' | 'future_goals' | null,
  selectedDomainIds: string[],
  responses: Response[],
  scores: DomainScore[] | null,
  sessionId: string  // uuid, generated on start
}

Actions: SET_PURPOSE, SET_DOMAINS, SET_RESPONSE, SET_SCORES, RESET.

Create src/lib/storage.ts with:
- saveSession(session: AssessmentSession): void  // writes to localStorage
- loadSession(): AssessmentSession | null
- clearSession(): void

Auto-save to localStorage on every SET_RESPONSE action.
Wrap the router in AssessmentProvider in App.tsx.
```

**Done when:** Responses persist across page reloads in the browser.

---

### Phase 3 — Setup and Landing Pages
**Estimated time:** 1–2 hours

**Claude Code prompt:**
```
Build LandingPage.tsx: headline "WASH Competency Profiler", brief description (2–3 sentences),
a "Start Assessment" CTA button that navigates to /setup.
Include a note that the assessment takes approximately 20 minutes.

Build SetupPage.tsx with two steps:
1. Purpose selection: two radio cards — "Assess my current role" / "Plan for future goals"
2. Domain selection: checkbox cards, one per domain from competencies.ts.
   Show a "Select all" toggle. Require at least one domain selected.

A "Begin Assessment" button, disabled until both steps are complete, navigates to /assessment.
Dispatch SET_PURPOSE and SET_DOMAINS to context on submit.

Use Tailwind throughout. Keep mobile layout in mind (single column stack).
```

**Done when:** User can select purpose and domains and reach the questionnaire page.

---

### Phase 4 — Questionnaire Component
**Estimated time:** 2–3 hours

**Claude Code prompt:**
```
Build QuestionnairePage.tsx and Questionnaire.tsx.

The questionnaire shows one domain at a time. For each competency item in the selected domains, display:
- The competency label (bold) and description (smaller text)
- Two 1–5 Likert scale inputs: "My current level" and "How important is this to my role"
- Each scale rendered as 5 radio buttons with labels: 1=Novice, 2=Developing, 3=Proficient, 4=Advanced, 5=Expert (for competence) and 1=Not important, 3=Moderately important, 5=Critical (for importance)
- A "Not applicable / Skip" checkbox that sets both values to null

Show a ProgressBar at the top: "Domain 2 of 5 — 40% complete" based on domains answered.

Navigation: "Next Domain" button advances; "Previous" goes back. Final domain shows "View Results".

On "View Results": dispatch SET_RESPONSE for all collected responses, run calculateAllScores, dispatch SET_SCORES, navigate to /results.

Dispatch SET_RESPONSE incrementally as the user moves between domains so progress is saved.
```

**Done when:** User can complete all domains and reach the results page with scores populated.

---

### Phase 5 — Radar Chart Component
**Estimated time:** 1–2 hours

**Claude Code prompt:**
```
Build RadarChart.tsx using Recharts RadarChart.

Props:
- domain: DomainScore
- showImportance?: boolean  // overlay a second trace for importance (default false)

The chart shows:
- Axes = competency item labels (short form, max 20 chars, truncate if needed)
- Primary area = competence scores (blue, 60% opacity fill)
- Optional secondary area = importance scores (teal, 40% opacity fill, dashed stroke)
- Score range 0–5

Add a legend. Make the chart responsive using Recharts ResponsiveContainer (width 100%, height 300px).

Export the chart as a PNG: expose a ref-based exportAsImage() method that uses html2canvas on the chart container.

Write a simple render test using React Testing Library: given a DomainScore with 3 items, it renders without crashing.
```

**Done when:** Charts render for each selected domain with correct axis labels and values.

---

### Phase 6 — Results Dashboard
**Estimated time:** 2–3 hours

**Claude Code prompt:**
```
Build ResultsDashboard.tsx and ResultsPage.tsx.

ResultsPage layout (top to bottom):
1. Header: user's name (optional input field) and assessment date
2. Domain summary table: rows = domains, columns = Avg Competence | Avg Importance | Priority Score. Sort by priority score descending.
3. Radar charts: one per selected domain (use RadarChart.tsx), displayed in a 2-column grid on desktop, 1-column on mobile.
4. Strengths panel: list all competencies classified as 'strength', grouped by domain.
5. Development priorities panel: list all 'development_priority' competencies, sorted by priority score descending.
6. RecommendationPanel: rule-based text recommendations per the PRD logic.
7. ExportButton: triggers PDF export.

RecommendationPanel.tsx logic:
- For each 'development_priority' item: output "High priority development area: [label]"
- For each 'strength' item: output "Strength – potential for mentoring: [label]"
- If no development priorities: output "No high-priority gaps identified. Focus on maintaining strengths."
- Never render an empty panel.

Ensure no empty state is possible for any panel (add appropriate fallback messages).
```

**Done when:** Results page renders all sections with correct data from a completed assessment.

---

### Phase 7 — PDF Export
**Estimated time:** 1–2 hours

**Claude Code prompt:**
```
Build ExportButton.tsx that generates a downloadable PDF of the results.

Use html2canvas to capture the results page sections sequentially, then jsPDF to assemble a multi-page A4 PDF.

PDF structure:
- Page 1: Title, assessment date, domain summary table (rendered as jsPDF table, not screenshot)
- Subsequent pages: one radar chart per domain (captured with html2canvas)
- Final page: Strengths list, development priorities list, recommendations (text rendered directly in jsPDF)

File name format: WASH_Competency_Profile_YYYY-MM-DD.pdf

The button should show a loading spinner while generating and revert to "Download PDF" when complete.
Download must complete within 5 seconds for a typical 5-domain assessment.

Add a basic test: clicking the button calls jsPDF.save() (mock html2canvas and jsPDF).
```

**Done when:** Clicking "Download PDF" produces a well-formatted A4 PDF within 5 seconds.

---

### Phase 8 — Polish and QA
**Estimated time:** 1–2 hours

**Claude Code prompts (run separately):**

**Accessibility:**
```
Audit the full app for WCAG 2.1 AA compliance. Specifically:
- Add aria-labels to all Likert scale radio groups (e.g., "Competence rating for [label]")
- Ensure colour contrast meets 4.5:1 for body text and 3:1 for large text using the Tailwind palette
- Add keyboard navigation support for the domain navigation buttons
- Ensure all chart elements have aria-label attributes
```

**Mobile responsiveness:**
```
Review all pages for mobile layout at 375px viewport width.
Ensure the Likert scale radio buttons stack vertically on small screens.
Ensure the domain summary table scrolls horizontally rather than overflowing.
Ensure radar charts display at a minimum height of 250px on mobile.
```

**Error handling:**
```
Add error boundaries around the Questionnaire and ResultsDashboard components.
Add a loading state to ResultsPage while scores are being calculated.
Handle the case where a user navigates directly to /results without completing the questionnaire 
— redirect to / with a toast notification: "Please complete the assessment first."
```

---

## 6. VS Code Workspace Configuration

Create `.vscode/settings.json` in the project root:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.includeLanguages": { "typescript": "html", "typescriptreact": "html" },
  "editor.quickSuggestions": { "strings": true },
  "vitest.enable": true
}
```

**Recommended extensions** (add to `.vscode/extensions.json`):

| Extension | Purpose |
|---|---|
| `esbenp.prettier-vscode` | Auto-formatting |
| `bradlc.vscode-tailwindcss` | Tailwind class autocomplete |
| `vitest.explorer` | Inline test runner |
| `ms-vscode.vscode-typescript-next` | Latest TS language features |
| `formulahendry.auto-rename-tag` | JSX tag pair editing |
| `usernamehw.errorlens` | Inline TS/lint errors |

---

## 7. Claude Code Workflow Notes

**Starting a session:** Always open the project in VS Code, then launch Claude Code from the terminal in the project root (`claude`). This gives Claude Code full context of the file tree.

**Providing context per prompt:** Each Phase prompt above is self-contained, but prefix it with the relevant file path when asking Claude Code to edit an existing file:
```
Edit src/lib/ScoringEngine.ts to add a calculateAllScores function...
```

**Iterating on components:** After each phase, run the dev server (`npm run dev`), test manually, then describe what needs adjusting. Claude Code handles incremental edits well — there is no need to re-paste the full component.

**Testing before moving on:** Run `npm run test` after Phases 1, 5, and 7. Don't carry failing tests into the next phase.

**Data entry (Phase 1, Step 1):** This is the only step that cannot be done by Claude Code alone. You will need to manually transfer the competency framework from the DOCX into `src/data/competencies.ts`. A practical approach: open the DOCX, copy each domain's competencies as a structured list, paste into a new chat with the prompt:
```
Convert this list of WASH competencies into a TypeScript array of CompetencyItem objects
matching this type: { id: string, domain: string, domainId: string, label: string, description: string }
```
Then paste the output into `competencies.ts`.

---

## 8. Open Questions (from PRD)

These should be resolved before Phase 3 (Setup page):

| Question | Default assumption for MVP | Action required |
|---|---|---|
| Can users customise competency sets? | No — fixed set from DOCX | Confirm with stakeholders |
| Anonymous or linked to accounts? | Anonymous (localStorage only) | Confirm — affects Phase 2 storage design |
| Generic vs curated recommendations? | Generic rule-based text | Confirm — curated resources require content authoring |

---

## 9. Phase Summary

| Phase | Deliverable | Est. time |
|---|---|---|
| 0 | Scaffolded project, routing, Tailwind | 0.5–1 hr |
| 1 | Data types, competency data, scoring engine + tests | 1–2 hrs |
| 2 | Context, localStorage persistence | 1 hr |
| 3 | Landing and setup pages | 1–2 hrs |
| 4 | Questionnaire with Likert scales, progress, navigation | 2–3 hrs |
| 5 | Radar chart component + export method | 1–2 hrs |
| 6 | Results dashboard, recommendations | 2–3 hrs |
| 7 | PDF export | 1–2 hrs |
| 8 | Accessibility, mobile, error handling | 1–2 hrs |
| **Total** | | **~11–18 hrs** |

This maps to roughly 2–3 focused working days, consistent with the PRD's 4–6 week estimate when accounting for review cycles, data entry, and stakeholder feedback loops.
