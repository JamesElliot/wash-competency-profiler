# PRODUCT REQUIREMENTS DOCUMENT (PRD)  
## Product: WASH Competency Profiler  
## Version: v0.1 (MVP)  
## Author: James Brown  
## Status: Draft (for development)

---

# 1. Executive Summary

The WASH Competency Profiler is a web-based self-assessment tool that enables humanitarian WASH practitioners to evaluate their competencies across core and technical domains, visualise strengths and gaps through distinctive radar-based “fingerprint” charts, and receive tailored recommendations for professional development.

The MVP will focus on:
- Structured competency questionnaire
- Scoring and gap analysis
- Visual outputs (radar charts)
- Individualised summary and recommendations
- Exportable results

---

# 2. Problem Statement

## Problem
The current competency framework:
- Exists as a static document
- Is difficult to operationalise for individuals
- Does not provide structured outputs or comparisons
- Does not easily translate into actionable development plans

## Impact
- Limited uptake and engagement
- Weak linkage between competency assessment and capacity development
- No consistent method to identify priority gaps across individuals or teams

## Opportunity
A digital tool can:
- Standardise self-assessment
- Generate structured outputs
- Support evidence-based professional development
- Potentially scale to organisational and sector-level insights

---

# 3. Target Users

## Primary users
- Field-level WASH staff
- Programme managers and technical specialists
- Trainers and capacity development leads

## Secondary users (future)
- HR / learning teams
- Donors (aggregated insights)

---

# 4. Product Goals

## Primary goals
1. Enable structured self-assessment of WASH competencies  
2. Provide clear, visual representation of strengths and gaps  
3. Generate actionable development recommendations  

## Success metrics (MVP)
- Completion rate > 60%
- Average session completion time < 25 minutes
- ≥70% users report outputs are “useful” (post-survey)
- ≥50% export or share results

---

# 5. Scope

## In scope (MVP)
- Core WASH competencies module
- Questionnaire interface
- Scoring and gap logic
- Radar chart visualisation (basic version)
- Summary dashboard
- PDF export

## Out of scope (MVP)
- User accounts (optional)
- Team dashboards
- Benchmarking across users
- Advanced fingerprint visual styling
- Mobile app (web only)

---

# 6. User Flow

Landing page  
→ Start assessment  
→ Select purpose (current role / future goals)  
→ Select competency domains  
→ Complete questionnaire  
→ View results dashboard  
→ Export / share report  

---

# 7. Functional Requirements

## 7.1 Questionnaire

### Requirements
- Display competencies grouped by domain
- For each competency:
  - Input: Competence (1–5)
  - Input: Importance (1–5)
- Allow:
  - Skip / “not applicable”
  - Save progress (optional)

### Acceptance criteria
- User can complete full assessment without errors
- All inputs stored locally (MVP) or in DB

---

## 7.2 Scoring Engine

### Calculations

For each competency:
- Gap score = Importance – Competence
- Priority score = Gap × Importance

For each domain:
- Average competence
- Average importance
- Aggregate priority score

### Acceptance criteria
- Scores update dynamically or on submission
- Results are consistent across sessions

---

## 7.3 Visualisation

### MVP requirement
- Radar chart per domain:
  - Axes = competencies
  - Values = competence score

### Future requirement (not MVP)
- Fingerprint-style rendering using curved contours

### Acceptance criteria
- Charts render correctly for all domains
- Charts exportable as image

---

## 7.4 Results Dashboard

### Components

#### A. Strengths
- Competencies where:
  - Competence ≥4 AND Importance ≥4

#### B. Development priorities
- Competencies where:
  - Importance ≥4 AND Competence ≤2

#### C. Domain summary
- Average scores per domain

---

## 7.5 Recommendation Engine

### MVP logic (rule-based)

IF:
- Importance ≥4 AND Competence ≤2  
→ Output:
- “High priority development area”

IF:
- Competence ≥4 AND Importance ≥4  
→ Output:
- “Strength – potential for mentoring”

### Acceptance criteria
- Recommendations generated for all users
- No empty states

---

## 7.6 Export

### Requirements
- Generate PDF report including:
  - Charts
  - Summary
  - Recommendations

### Acceptance criteria
- PDF renders consistently
- File downloadable within 5 seconds

---

# 8. Non-Functional Requirements

## Performance
- Page load < 2 seconds
- Chart rendering < 1 second

## Usability
- Mobile responsive (basic)
- Clear navigation across sections

## Accessibility
- WCAG basic compliance (labels, contrast)

## Data handling
- MVP: local storage or anonymous session
- Future: secure user accounts

---

# 9. Data Model (MVP)

## Competency
```json
{
  "id": "string",
  "domain": "string",
  "description": "string"
}
```

## Response
```json
{
  "competency_id": "string",
  "competence": 1-5,
  "importance": 1-5
}
```

---

# 10. Technical Constraints

- Must support custom visualisation (D3 integration later)
- Must allow modular addition of competency domains
- Must support export (PDF + image)

---

# 11. Risks

## Risk: survey fatigue  
Mitigation:
- Modular sections
- Progress indicator

## Risk: self-assessment bias  
Mitigation (future):
- Supervisor mode
- Comparative scoring

## Risk: complexity of visual design  
Mitigation:
- Start with basic radar charts
- Layer fingerprint design later

---

# 12. Milestones

## Phase 1 (MVP – ~4–6 weeks)
- Questionnaire UI
- Scoring engine
- Basic charts
- Dashboard
- PDF export

## Phase 2
- Fingerprint visualisation
- User accounts
- Save/load assessments

## Phase 3
- Team analytics
- Benchmarking
- Role templates

---

# 13. Open Questions

- Should users be able to customise competency sets at MVP stage?
- Should results be anonymous or linked to accounts from the start?
- How prescriptive should recommendations be (generic vs curated resources)?

---

# 14. Notes for Codex Development

When prompting Codex, structure tasks as:

- “Build questionnaire component with dynamic competency list”
- “Implement scoring function using gap and priority logic”
- “Render radar chart from JSON data”
- “Generate PDF from dashboard state”

Keep components modular:
- Questionnaire.tsx
- ScoringEngine.ts
- RadarChart.tsx
- ResultsDashboard.tsx
