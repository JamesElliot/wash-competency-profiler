# WASH Competency Profiler — Update Plan
*Based on: Humanitarian WASH Competency Technical Framework (6 June 2026, for review) and NW Feedback.md*

---

## Summary

| Category | Changes |
|---|---|
| New competency items | +5 |
| Items removed/merged | -3 |
| Text corrections | 10+ |
| Data quality fixes | 2 |
| Attribution / landing page | 1 |
| **Net total items** | **217 → 219** |

---

## 1. CSV Data Changes

### 1a. NEW items to add

**Hygiene Promotion — Assessments (HP-01)**  
Insert as the new *first* item before current HP-01-01 (renumber HP-01-01 → HP-01-02, etc.):

> `HP-01-01` (new) | Assessments, formative research and data collection  
> *"Demonstrate knowledge of priority hygiene behaviors that reduce morbidity and mortality in emergencies (e.g., handwashing with soap at critical times; safe collection, storage, and treatment of water; safe excreta disposal; safe food handling), including how each interrupts disease transmission"*

**Hygiene Promotion — Implementation (HP-03)**  
Append three new items after current HP-03-04:

> `HP-03-05` | Hygiene promotion implementation  
> *"Collaborate with logistics, relief, and market teams to identify essential hygiene items needed by individuals, households, and communities, and assess their availability within households, communities, institutions, and local markets to determine the most appropriate distribution modality, considering the needs of men and women, older people, children, and persons with disabilities. Identify and ensure the provision of communal items necessary for maintaining environmental hygiene, such as solid waste receptacles and cleaning equipment."*

> `HP-03-06` | Hygiene promotion implementation  
> *"Support hygiene promotion in the context of cash and voucher assistance and market-based programming (e.g., Multipurpose Cash Assistance), including assessing when cash, vouchers, or in-kind support are most appropriate for meeting hygiene needs"*

> `HP-03-07` | Hygiene promotion implementation  
> *"Support the distribution of WASH NFIs (water containers, hygiene items, and water treatment chemicals) and accompanying hygiene promotion activities"*

**Safe Water Supply — Implementation (SWS-03b)**  
Insert between current SWS-03b-03 and SWS-03c-01:

> `SWS-03b-04` | Implementing water supply systems  
> *"Construct / extend / rehabilitate piped water supply systems"*

---

### 1b. Items to REMOVE

| Code | Current text | Reason |
|------|-------------|--------|
| `CORE-03-04` | "Support coordination and integration of WASH interventions with related sectors (e.g., Health, Nutrition, Shelter, Food Security, Education) for effectiveness and public health impact" | Removed from Program Planning in framework; superseded by CORE-06-02 which covers the same ground |
| `CORE-04-04` | "Demonstrate understanding of basic WASH procurement processes and procedures relevant to your role" | Merged with CORE-04-05 (see section 1c below) |
| `EM-03b-06` | "Describe space requirements, volumes and characteristics of stored human excreta and fecal sludge, and soil infiltration and groundwater contamination" | Duplicate of EM-03b-01; removed from framework |

After removals, renumber subsequent items in each theme to close gaps.

---

### 1c. Text corrections

| Code | Current CSV text | Corrected text (from framework) |
|------|-----------------|--------------------------------|
| `CORE-04-02` | "Identify and escalate safety, access or operational risks with WASH activities for communities and staff, and identify and report safety, access, or operational risks in line with organizational procedures" | "Identify, escalate and report safety, access, or operational risks in line with organizational procedures" (deduplication) |
| `CORE-04-05` (now 04-04 after merge) | "Apply understanding of WASH procurement processes and procedures including procurement, monitoring, and delivery of WASH goods, services, and works in line with program needs, including contractors, suppliers, and service providers" | "Demonstrate understanding of WASH procurement processes and procedures including procurement, monitoring, and delivery of WASH goods, services, and works in line with program needs, including contractors, suppliers, and service providers" |
| `CORE-11-04` | "Demonstrate the ability to design, implement, and monitor WASH interventions tailored to the specific needs and challenges of rural communities" | "Design, implement, and monitor WASH interventions tailored to the specific needs and challenges of rural communities" |
| `CORE-11-05` | "Demonstrate the ability to apply WASH considerations in displacement settings..." | "Apply WASH considerations in displacement settings (e.g., camps, IDP sites, transit sites, migratory routes, points of entry, returnee sites) including coordination with CCCM and site management structures" |
| `CORE-11-06` | "Demonstrate the ability to apply WASH considerations in acute/rapid onset natural disaster settings..." | "Apply WASH considerations in acute/rapid onset natural disaster settings (e.g. floods, earthquakes, cyclones)" |
| `CORE-11-07` | "Demonstrate the ability to apply WASH considerations in health/outbreak settings..." | "Apply WASH considerations in health/outbreak settings (e.g., cholera, epidemics, or other diarrheal and infectious disease outbreaks, including relevant standards (Sphere Standards for WASH responses) and risk-reduction measures" |
| `CORE-11-09` | "Demonstrate the ability to apply WASH considerations for cold climates..." | "Apply WASH considerations for cold climates (e.g., freezing, infrastructure constraints, access and O&M adaptations)" |
| `CORE-11-10` | "Demonstrate the ability to apply WASH considerations for conflict settings..." | "Apply WASH considerations for conflict settings (e.g., security constraints, do-no-harm risks, safe access for staff and communities)" |
| `EM-03a-03` | "Ability to construct, design, and operate different toilet designs for acute and stabilization phases, and institutions during emergencies" | "Construct, design, and operate different toilet designs for acute and stabilization phases, and institutions during emergencies" |
| `SWM-02-05` | "conduct environmental risk assessment including assessing open burning practice..." | "Conduct Environmental Risk Assessment including assessing open burning practice and pollution to soil, air and water (surface and groundwater) to inform mitigation strategies for SWM system design/improvement" |

---

### 1d. Data quality fixes

| Issue | Fix |
|-------|-----|
| `SWM-07-06` has domain `"Solid Waste Management"` (capital M) instead of `"Solid waste management"` — this creates a spurious 7th domain group in the app | Change to `"Solid waste management"` |
| `CORE-04-04` and `CORE-04-05` are separate items in CSV but one merged item in framework | Remove CORE-04-04; update CORE-04-05 text (see 1c above); renumber as CORE-04-04 |

---

## 2. App Changes — Attribution & Landing Page (from NW Feedback)

Nicole Weber (PRO-WASH & SCALE) requests the following attribution text be added to the app. Suggested placement: landing page footer or an "About" section.

**Required text:**
> *"This app is based on the Humanitarian WASH Competency Technical Framework, developed under the WASH Roadmap Initiative. [Insert information about who funded the app/is managing the app.] The original framework on which the app is built was funded in part by a cooperative agreement (PRO-WASH & SCALE) from the United States Department of State. The opinions, findings, and conclusions stated herein are those of the author[s] and do not necessarily reflect those of the United States Department of State."*

**Optional contributor credits (if included):**
> *"The following individuals contributed to the framework: James Brown (Excreta Management), Ravjot Chana (Excreta Management), Catherine Darriulat (Safe Water Supply and Vector Control), Lauren Enochs (Hygiene), Nicole Weber (Coordination and Hygiene), and Christian Zurbrugg (Solid Waste Management). Guidance and reviews provided by: Francois Baillon, Syed Imran Ali, Baudoin Luce, Alexandra Machado, Mari Paz Ortega, and Guillaume Pierrehumbert."*

**Link to add:**
- WASH Roadmap Framework (RedR UK): https://redr.org.uk/publication/wash-competency-framework-for-low-resource-contexts/
- Once published: link to the PDF of the full framework

---

## 3. Impact on Domain Item Counts

| Domain | Current | After update | Change |
|--------|---------|-------------|--------|
| Core humanitarian WASH | 68 | 66 | −2 (remove CORE-03-04; merge CORE-04-04/05) |
| Hygiene promotion | 24 | 28 | +4 (1 in assessments + 3 in implementation) |
| Vector control | 14 | 14 | — |
| Excreta management | 39 | 38 | −1 (remove duplicate EM-03b-06) |
| Safe water supply | 29 | 30 | +1 (add SWS-03b-04) |
| Solid waste management | 43* | 43 | — (fix domain name bug only) |
| **Total** | **217** | **219** | **+2** |

*\*Currently shows as 42 + 1 due to capitalisation bug in SWM-07-06*

---

## 4. Implementation Order

### Phase 1 — CSV updates (foundation, do first)
1. Fix SWM-07-06 domain capitalisation bug
2. Apply all text corrections (section 1c)
3. Remove CORE-03-04, EM-03b-06; merge CORE-04-04/05
4. Add 5 new competency items
5. Renumber affected codes
6. Run `npm test` to confirm scoring engine still passes (26 tests)
7. Smoke-test the questionnaire to verify item counts match

### Phase 2 — Landing page attribution ✅ DONE
1. ✅ Added attribution text block with the Department of State disclaimer
2. ✅ Added link to WASH Roadmap Framework
3. ✅ Contributor credits included (confirmed by James)

### Phase 3 — Post-publication
- Add link to published PDF of the framework once available

---

## 5. Open Questions

1. **App management credit**: NW Feedback says *"[you then insert information about who funded the app/is managing the app]"* — what should this say? (e.g., "Developed by James Brown, York University")
2. **Contributor credits**: Do you want the full contributor list on the landing page, or just in the README?
3. **HP-01 renumbering**: Adding a new first item in HP-01 will renumber all existing HP-01-xx codes. This breaks any saved sessions in localStorage (scores reference competency IDs). Recommend assigning the new item as `HP-01-00` or adding it at the end as `HP-01-10` to preserve existing IDs, then reordering display only.
4. **CORE-03-04 removal**: Confirm this item is intentionally removed from Program Planning (not accidentally dropped from the framework document).
