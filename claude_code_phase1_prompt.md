# Claude Code Prompt — Phase 1: Data Layer

Paste this prompt directly into a Claude Code session opened in the project root.

---

## PROMPT

I have a CSV file at `Competencies.csv` in the project root. It has five columns:

```
Code, Domain, Theme, Sub-theme, Competency activity
```

**Example rows:**
- `CORE-01-01, Core humanitarian WASH competencies, Standards quality and duty of care, (empty), Explain relevant standards...`
- `EM-03a-01, Excreta management, Implementing excreta management programs, User interface, Select appropriate toilet user interfaces...`
- `SWS-03a-01, Safe water supply, Implementing water supply systems, Feasibility studies design and sizing of water supply systems, Select the appropriate site...`


---

### Task 1 — Create `src/types/index.ts`

Define these TypeScript types:

```typescript
export type DomainMeta = {
  id: string;          // e.g. 'core', 'hp', 'vc', 'em', 'sws', 'swm'
  label: string;       // e.g. 'Core humanitarian WASH competencies'
  prefix: string;      // e.g. 'CORE', 'HP', 'VC', 'EM', 'SWS', 'SWM'
};

export type ThemeMeta = {
  id: string;          // e.g. 'core-01', 'hp-02', 'em-03a'
  domainId: string;
  label: string;
};

export type SubThemeMeta = {
  id: string;          // slugified sub-theme label
  themeId: string;
  domainId: string;
  label: string;
};

export type CompetencyItem = {
  id: string;          // e.g. 'CORE-01-01' — use the Code column verbatim
  domainId: string;
  themeId: string;
  subThemeId: string | null;   // null if Sub-theme column is empty
  label: string;       // the Competency activity text
};

export type Response = {
  competencyId: string;
  competence: 1 | 2 | 3 | 4 | 5 | null;   // null = skipped / N/A
  importance: 1 | 2 | 3 | 4 | 5 | null;
};

export type CompetencyScore = {
  competencyId: string;
  domainId: string;
  themeId: string;
  subThemeId: string | null;
  gap: number;                 // importance - competence (0 if either is null)
  priority: number;            // gap × importance (0 if either is null)
  classification:
    | 'strength'               // competence ≥4 AND importance ≥4
    | 'development_priority'   // importance ≥4 AND competence ≤2
    | 'monitor'                // importance ≥4 AND competence = 3
    | 'low_priority'           // importance ≤3
    | 'skipped';               // either value is null
};

export type DomainScore = {
  domainId: string;
  domainLabel: string;
  avgCompetence: number;
  avgImportance: number;
  aggregatePriority: number;
  itemScores: CompetencyScore[];
};

export type AssessmentSession = {
  sessionId: string;
  startedAt: string;              // ISO date string
  purpose: 'current_role' | 'future_goals' | null;
  selectedDomainIds: string[];
  responses: Response[];
  scores: DomainScore[] | null;
};
```

---

### Task 2 — Create `src/data/competencies.ts`

Read and parse `Competencies.csv`. Skip the header row and any row where `Code` is empty or blank.

Generate and export the following four typed arrays:

**`DOMAINS: DomainMeta[]`**  
One entry per unique Domain value. Derive `id` and `prefix` from the code prefix before the first hyphen. The six domains are:

| CSV Domain label | id | prefix |
|---|---|---|
| Core humanitarian WASH competencies | core | CORE |
| Hygiene promotion | hp | HP |
| Vector control | vc | VC |
| Excreta management | em | EM |
| Safe water supply | sws | SWS |
| Solid waste management | swm | SWM |

**`THEMES: ThemeMeta[]`**  
One entry per unique Domain + Theme combination. Derive `id` by combining the domain prefix and the theme number extracted from the Code column (e.g., codes `CORE-01-01` through `CORE-01-03` → theme id `core-01`; codes `EM-03a-01` through `EM-03a-07` → theme id `em-03a`). The theme number is everything between the first and last hyphen-separated segment of the code.

**`SUB_THEMES: SubThemeMeta[]`**  
One entry per unique Domain + Theme + Sub-theme combination, only where the Sub-theme column is non-empty. Generate `id` by slugifying the sub-theme label (lowercase, replace spaces and special chars with hyphens).

**`COMPETENCIES: CompetencyItem[]`**  
One entry per CSV row (excluding header and empty-code rows). Map columns directly:
- `id` ← `Code` (verbatim)
- `domainId` ← derived from prefix
- `themeId` ← derived as above
- `subThemeId` ← slugified sub-theme or `null`
- `label` ← `Competency activity`

Export a helper function:
```typescript
export function getCompetenciesByDomain(domainId: string): CompetencyItem[]
export function getCompetenciesByTheme(themeId: string): CompetencyItem[]
export function getDomainById(domainId: string): DomainMeta | undefined
```

---

### Task 3 — Create `src/lib/ScoringEngine.ts`

Implement pure functions (no side effects, no imports from React):

```typescript
// Classify a single response
export function classifyResponse(response: Response): CompetencyScore['classification']

// Score a single competency
export function scoreCompetency(item: CompetencyItem, response: Response | undefined): CompetencyScore

// Aggregate scores for one domain
export function scoreDomain(
  domainId: string,
  items: CompetencyItem[],
  responses: Response[]
): DomainScore

// Score all selected domains
export function scoreAllDomains(
  selectedDomainIds: string[],
  competencies: CompetencyItem[],
  responses: Response[]
): DomainScore[]

// Filter helpers used by ResultsDashboard
export function getStrengths(scores: DomainScore[]): CompetencyScore[]
export function getDevelopmentPriorities(scores: DomainScore[]): CompetencyScore[]
```

Classification rules:
- `competence ≥4 AND importance ≥4` → `'strength'`
- `importance ≥4 AND competence ≤2` → `'development_priority'`
- `importance ≥4 AND competence === 3` → `'monitor'`
- `importance ≤3 AND importance !== null` → `'low_priority'`
- Either value is `null` → `'skipped'`

For `avgCompetence` and `avgImportance` on `DomainScore`: exclude skipped items from the average. If all items are skipped, return 0.

---

### Task 4 — Create `src/lib/storage.ts`

```typescript
const SESSION_KEY = 'wash_profiler_session';

export function saveSession(session: AssessmentSession): void
export function loadSession(): AssessmentSession | null
export function clearSession(): void
export function generateSessionId(): string  // use crypto.randomUUID() with Date.now() fallback
```

---

### Task 5 — Write unit tests in `src/lib/ScoringEngine.test.ts`

Use Vitest. Cover:

1. `classifyResponse` — all five classifications, including boundary values (competence=4, importance=4; competence=2, importance=4; competence=3, importance=4; importance=3)
2. `scoreCompetency` — gap and priority calculations for a known response
3. `scoreDomain` — avgCompetence excludes skipped items; aggregatePriority sums correctly
4. `getStrengths` and `getDevelopmentPriorities` — correct filtering across a mixed set of scores

---

### Task 6 — Move `Competencies.csv` to `src/data/Competencies.csv`

Update any import paths accordingly if the CSV is read at build time. If it is parsed at runtime (imported as a raw string via Vite's `?raw` suffix), add the following to `vite.config.ts` to allow raw imports:

```typescript
// No config change needed — Vite supports ?raw out of the box
// Import in competencies.ts as:
// import rawCsv from './Competencies.csv?raw'
// Then parse with a lightweight CSV parser
```

Install a minimal CSV parser: `npm install papaparse` and `npm install -D @types/papaparse`.

Parse synchronously at module load time (this runs once at startup, not on every render).

---

### Acceptance criteria

- `npm run test` passes all ScoringEngine tests
- `console.log(COMPETENCIES.length)` returns the correct count (≥210 items)
- `getCompetenciesByDomain('core')` returns only CORE-prefixed items
- TypeScript reports zero errors on `npm run tsc --noEmit`
