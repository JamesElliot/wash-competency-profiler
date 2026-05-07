export type DomainMeta = {
  id: string;
  label: string;
  prefix: string;
};

export type ThemeMeta = {
  id: string;
  domainId: string;
  label: string;
};

export type SubThemeMeta = {
  id: string;
  themeId: string;
  domainId: string;
  label: string;
};

export type CompetencyItem = {
  id: string;
  domainId: string;
  themeId: string;
  subThemeId: string | null;
  label: string;
};

export type Response = {
  competencyId: string;
  competence: 1 | 2 | 3 | 4 | 5 | null;
  importance: 1 | 2 | 3 | 4 | 5 | null;
};

export type CompetencyScore = {
  competencyId: string;
  domainId: string;
  themeId: string;
  subThemeId: string | null;
  gap: number;
  priority: number;
  classification:
    | 'strength'
    | 'development_priority'
    | 'monitor'
    | 'low_priority'
    | 'skipped';
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
  startedAt: string;
  purpose: 'current_role' | 'future_goals' | null;
  selectedDomainIds: string[];
  responses: Response[];
  scores: DomainScore[] | null;
};
