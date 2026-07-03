import { APP_CONTENT } from '../data/appContent';
import { COMPETENCIES, DOMAINS, SUB_THEMES, THEMES } from '../data/competencies';
import type {
  AssessmentSession,
  CompetencyScore,
  DomainScore,
  Response,
  ResponseStatus,
} from '../types';
import {
  getDevelopmentPriorities,
  getMonitorItems,
  getStrengths,
} from './ScoringEngine';

export type ExportCompetencyRow = {
  competencyId: string;
  domainId: string;
  domainLabel: string;
  themeId: string;
  themeLabel: string;
  subThemeId: string | null;
  subThemeLabel: string | null;
  competencyText: string;
  competence: Response['competence'];
  importance: Response['importance'];
  status: ResponseStatus;
  classification: CompetencyScore['classification'];
  priority: number;
  note: string;
};

export type ExportAssessmentRecord = {
  metadata: {
    generatedAt: string;
    startedAt: string;
    appVersion: string;
    frameworkVersion: string;
    frameworkUrl: string;
    purpose: AssessmentSession['purpose'];
    name: string;
  };
  domainSummaries: DomainScore[];
  strengths: ExportCompetencyRow[];
  developmentPriorities: ExportCompetencyRow[];
  monitorItems: ExportCompetencyRow[];
  notApplicableItems: ExportCompetencyRow[];
  allItems: ExportCompetencyRow[];
  generalDevelopmentNotes: string;
  acknowledgement: string;
  disclaimer: string;
  contributorCredits: string;
};

const competencyMap = new Map(COMPETENCIES.map((c) => [c.id, c]));
const domainMap = new Map(DOMAINS.map((d) => [d.id, d]));
const themeMap = new Map(THEMES.map((t) => [t.id, t]));
const subThemeMap = new Map(SUB_THEMES.map((s) => [s.id, s]));

export function buildExportAssessmentRecord(
  session: AssessmentSession,
  scores: DomainScore[],
  name = '',
): ExportAssessmentRecord {
  const responseMap = new Map(session.responses.map((r) => [r.competencyId, r]));
  const scoreMap = new Map(
    scores.flatMap((domain) =>
      domain.itemScores.map((score) => [score.competencyId, score] as const),
    ),
  );
  const selectedDomainIds = new Set(session.selectedDomainIds);

  const allItems = COMPETENCIES
    .filter((item) => selectedDomainIds.has(item.domainId))
    .map((item) => {
      const response = responseMap.get(item.id);
      const score = scoreMap.get(item.id);
      return buildExportRow(item.id, response, score);
    });

  const scoreRows = (items: CompetencyScore[]) =>
    items
      .map((score) =>
        buildExportRow(score.competencyId, responseMap.get(score.competencyId), score),
      )
      .filter((row) => row.competencyText);

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      startedAt: session.startedAt,
      appVersion: APP_CONTENT.appVersion,
      frameworkVersion: APP_CONTENT.frameworkVersion,
      frameworkUrl: APP_CONTENT.frameworkUrl,
      purpose: session.purpose,
      name,
    },
    domainSummaries: scores,
    strengths: scoreRows(getStrengths(scores)),
    developmentPriorities: scoreRows(getDevelopmentPriorities(scores)),
    monitorItems: scoreRows(getMonitorItems(scores)),
    notApplicableItems: allItems.filter((row) => row.status === 'not_applicable'),
    allItems,
    generalDevelopmentNotes: session.generalDevelopmentNotes,
    acknowledgement: APP_CONTENT.acknowledgement,
    disclaimer: APP_CONTENT.disclaimer,
    contributorCredits: APP_CONTENT.contributorCredits,
  };
}

function buildExportRow(
  competencyId: string,
  response: Response | undefined,
  score: CompetencyScore | undefined,
): ExportCompetencyRow {
  const item = competencyMap.get(competencyId);
  const domain = item ? domainMap.get(item.domainId) : undefined;
  const theme = item ? themeMap.get(item.themeId) : undefined;
  const subTheme = item?.subThemeId ? subThemeMap.get(item.subThemeId) : undefined;

  return {
    competencyId,
    domainId: item?.domainId ?? score?.domainId ?? '',
    domainLabel: domain?.label ?? score?.domainId ?? '',
    themeId: item?.themeId ?? score?.themeId ?? '',
    themeLabel: theme?.label ?? '',
    subThemeId: item?.subThemeId ?? score?.subThemeId ?? null,
    subThemeLabel: subTheme?.label ?? null,
    competencyText: item?.label ?? competencyId,
    competence: response?.competence ?? null,
    importance: response?.importance ?? null,
    status: response?.status ?? 'unanswered',
    classification: score?.classification ?? 'skipped',
    priority: score?.priority ?? 0,
    note: response?.note ?? '',
  };
}
