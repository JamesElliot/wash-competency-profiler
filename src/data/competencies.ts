import Papa from 'papaparse';
import rawCsv from './Competencies.csv?raw';
import type { DomainMeta, ThemeMeta, SubThemeMeta, CompetencyItem } from '../types';

// ── Domain lookup ────────────────────────────────────────────────────────────

const PREFIX_TO_DOMAIN: Record<string, { id: string; label: string }> = {
  CORE: { id: 'core', label: 'Core humanitarian WASH competencies' },
  HP:   { id: 'hp',   label: 'Hygiene promotion' },
  VC:   { id: 'vc',   label: 'Vector control' },
  EM:   { id: 'em',   label: 'Excreta management' },
  SWS:  { id: 'sws',  label: 'Safe water supply' },
  SWM:  { id: 'swm',  label: 'Solid Waste Management' },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Parse CSV once at module load ────────────────────────────────────────────

type CsvRow = {
  Code: string;
  Domain: string;
  Theme: string;
  'Sub-theme': string;
  'Competency activity': string;
};

const parsed = Papa.parse<CsvRow>(rawCsv, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (h) => h.replace(/^﻿/, '').trim(),
});

const rows = parsed.data.filter((r) => r.Code && r.Code.trim());

// ── Build arrays ─────────────────────────────────────────────────────────────

const domainMap = new Map<string, DomainMeta>();
const themeMap  = new Map<string, ThemeMeta>();
const subThemeMap = new Map<string, SubThemeMeta>();
const competencies: CompetencyItem[] = [];

for (const row of rows) {
  const code = row.Code.trim();
  const parts = code.split('-');
  const prefix = parts[0]!;
  const themeNum = parts[1]!;           // e.g. '01', '03a'
  const domainMeta = PREFIX_TO_DOMAIN[prefix];

  if (!domainMeta) continue;

  const domainId = domainMeta.id;
  const themeId  = `${domainId}-${themeNum}`;
  const subThemeLabel = row['Sub-theme']?.trim() ?? '';
  const subThemeId = subThemeLabel ? slugify(subThemeLabel) : null;

  // Domain
  if (!domainMap.has(prefix)) {
    domainMap.set(prefix, { id: domainId, label: domainMeta.label, prefix });
  }

  // Theme
  if (!themeMap.has(themeId)) {
    themeMap.set(themeId, { id: themeId, domainId, label: row.Theme.trim() });
  }

  // Sub-theme
  if (subThemeId && !subThemeMap.has(subThemeId)) {
    subThemeMap.set(subThemeId, {
      id: subThemeId,
      themeId,
      domainId,
      label: subThemeLabel,
    });
  }

  competencies.push({
    id: code,
    domainId,
    themeId,
    subThemeId,
    label: row['Competency activity']?.trim() ?? '',
  });
}

export const DOMAINS: DomainMeta[] = Array.from(domainMap.values());
export const THEMES:  ThemeMeta[]  = Array.from(themeMap.values());
export const SUB_THEMES: SubThemeMeta[] = Array.from(subThemeMap.values());
export const COMPETENCIES: CompetencyItem[] = competencies;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCompetenciesByDomain(domainId: string): CompetencyItem[] {
  return COMPETENCIES.filter((c) => c.domainId === domainId);
}

export function getCompetenciesByTheme(themeId: string): CompetencyItem[] {
  return COMPETENCIES.filter((c) => c.themeId === themeId);
}

export function getDomainById(domainId: string): DomainMeta | undefined {
  return DOMAINS.find((d) => d.id === domainId);
}
