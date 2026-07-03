# WASH Competency Profiler

A structured self-assessment tool for humanitarian WASH practitioners. Evaluate your competencies across core and technical domains, visualise strengths and gaps, and get tailored development recommendations.

**Live site:** [wash-competency-profiler.netlify.app](https://wash-competency-profiler.netlify.app)

---

## Features

- **219 competencies** across 6 WASH domains (Core, Hygiene Promotion, Vector Control, Excreta Management, Safe Water Supply, Solid Waste Management)
- **Dual Likert scales** — rate both your current competence level and the importance of each competency to your role
- **Explicit N/A handling** — mark competencies as not applicable to your role and exclude them from scoring
- **Radar chart visualisation** — per-domain competency profiles with competence vs. importance overlay
- **Priority scoring** — automatically surfaces high-priority development gaps (high importance, low competence)
- **PDF and Word export** — download a polished PDF or an editable Word professional development record
- **Development notes** — capture general reflections and priority-specific action notes
- **Local persistence** — responses auto-save to the browser; resume an incomplete assessment at any time
- **Competency feedback** — flag any competency for review via a pre-filled GitHub issue

---

## Domains

| ID | Domain | Items |
|----|--------|-------|
| CORE | Core humanitarian WASH competencies | 66 |
| HP | Hygiene promotion | 28 |
| VC | Vector control | 14 |
| EM | Excreta management | 38 |
| SWS | Safe water supply | 30 |
| SWM | Solid waste management | 43 |

---

## Getting started (local development)

**Prerequisites:** Node.js ≥ 18

```bash
# Clone the repo
git clone https://github.com/JamesElliot/wash-competency-profiler.git
cd wash-competency-profiler

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5173`.

### Other commands

```bash
npm run build       # Production build → dist/
npm run preview     # Preview the production build locally
npm test            # Run unit tests (Vitest)
```

---

## Tech stack

| Layer | Library |
|-------|---------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 2 |
| PDF export | jsPDF 4 + html2canvas |
| Word export | docx + file-saver |
| CSV parsing | PapaParse 5 |
| Testing | Vitest |

---

## Project structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx      # Top-level error boundary
│   ├── ExportButton.tsx       # PDF and Word generation controls
│   ├── ProgressBar.tsx        # Assessment progress indicator
│   ├── Questionnaire.tsx      # Competency cards + Likert scales
│   ├── RadarChart.tsx         # Per-domain radar chart
│   ├── RecommendationPanel.tsx
│   └── ResultsDashboard.tsx   # Full results layout
├── context/
│   └── AssessmentContext.tsx  # Global state + localStorage persistence
├── data/
│   ├── appContent.ts          # Framework metadata, feedback links, acknowledgements
│   ├── Competencies.csv       # Source competency data
│   └── competencies.ts        # Parsed data + lookup helpers
├── lib/
│   ├── exportData.ts          # Shared report data model for exports
│   ├── ScoringEngine.ts       # Gap/priority scoring logic
│   ├── ScoringEngine.test.ts  # Unit tests
│   ├── storage.ts             # localStorage helpers
│   └── wordExport.ts          # Editable DOCX export
├── pages/
│   ├── LandingPage.tsx
│   ├── SetupPage.tsx
│   ├── QuestionnairePage.tsx
│   └── ResultsPage.tsx
└── types/
    └── index.ts               # Shared TypeScript types
```

---

## Competency data

The competency framework is stored in `src/data/Competencies.csv`. Each row has the following columns:

| Column | Description |
|--------|-------------|
| `Code` | Unique competency ID (e.g. `CORE-01-01`) |
| `Domain` | Domain full name |
| `Theme` | Theme name |
| `Sub-theme` | Sub-theme (optional grouping) |
| `Competency activity` | Competency statement |

To update or extend the competency framework, edit the CSV and restart the dev server.

---

## Scoring methodology

Gap score = **importance − competence**

Priority score = **gap × importance**

- **Strength:** competence ≥ 4 and importance ≥ 4
- **Development priority:** importance ≥ 4 and competence ≤ 2
- **Maintain and monitor:** importance ≥ 4 and competence = 3
- **Low priority:** importance ≤ 3
- **Not applicable / unanswered:** excluded from all averages and scoring

Domain aggregate priority is the sum of individual item priority scores across all assessed items.

---

## Submitting feedback on competencies

Each competency card has a flag icon that opens a pre-filled GitHub issue. This is the preferred way to suggest corrections, additions, or rewording of specific competencies.

For general bugs, pilot feedback, or feature requests, please [open an issue](https://github.com/JamesElliot/wash-competency-profiler/issues/new) manually or use the feedback link on the results page.

---

## Deployment

The app is a static SPA deployed on Netlify. Any push to `main` triggers an automatic redeploy.

A `public/_redirects` file handles client-side routing:
```
/* /index.html 200
```

To deploy your own instance:
1. Fork this repo
2. Connect to [Netlify](https://netlify.com) (or Vercel)
3. Set build command: `npm run build`, publish directory: `dist`

---

## License

MIT — see [LICENSE](LICENSE) for details.
