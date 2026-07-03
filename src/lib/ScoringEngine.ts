import type {
  CompetencyItem,
  CompetencyScore,
  DomainScore,
  Response,
} from '../types';
import { getDomainById } from '../data/competencies';

export function classifyResponse(
  response: Response,
): CompetencyScore['classification'] {
  const { competence, importance, status } = response;

  if (status !== 'answered') return 'skipped';
  if (competence === null || importance === null) return 'skipped';
  if (importance >= 4 && competence >= 4) return 'strength';
  if (importance >= 4 && competence <= 2) return 'development_priority';
  if (importance >= 4 && competence === 3) return 'monitor';
  return 'low_priority';
}

export function scoreCompetency(
  item: CompetencyItem,
  response: Response | undefined,
): CompetencyScore {
  if (
    !response ||
    response.status !== 'answered' ||
    response.competence === null ||
    response.importance === null
  ) {
    return {
      competencyId: item.id,
      domainId: item.domainId,
      themeId: item.themeId,
      subThemeId: item.subThemeId,
      gap: 0,
      priority: 0,
      classification: 'skipped',
    };
  }

  const gap = response.importance - response.competence;
  const priority = gap * response.importance;

  return {
    competencyId: item.id,
    domainId: item.domainId,
    themeId: item.themeId,
    subThemeId: item.subThemeId,
    gap,
    priority,
    classification: classifyResponse(response),
  };
}

export function scoreDomain(
  domainId: string,
  items: CompetencyItem[],
  responses: Response[],
): DomainScore {
  const responseMap = new Map(responses.map((r) => [r.competencyId, r]));
  const itemScores = items.map((item) =>
    scoreCompetency(item, responseMap.get(item.id)),
  );

  const answered = items.filter((item) => {
    const response = responseMap.get(item.id);
    return (
      response?.status === 'answered' &&
      response.competence !== null &&
      response.importance !== null
    );
  });
  const notApplicableCount = items.filter(
    (item) => responseMap.get(item.id)?.status === 'not_applicable',
  ).length;
  const unansweredCount = items.length - answered.length - notApplicableCount;

  const avgCompetence =
    answered.length > 0
      ? answered.reduce((sum, item) => {
          const r = responseMap.get(item.id);
          return sum + (r?.competence ?? 0);
        }, 0) / answered.length
      : 0;

  const avgImportance =
    answered.length > 0
      ? answered.reduce((sum, item) => {
          const r = responseMap.get(item.id);
          return sum + (r?.importance ?? 0);
        }, 0) / answered.length
      : 0;

  const aggregatePriority = itemScores.reduce((sum, s) => sum + s.priority, 0);

  const domain = getDomainById(domainId);

  return {
    domainId,
    domainLabel: domain?.label ?? domainId,
    avgCompetence,
    avgImportance,
    aggregatePriority,
    answeredCount: answered.length,
    notApplicableCount,
    unansweredCount,
    itemScores,
  };
}

export function scoreAllDomains(
  selectedDomainIds: string[],
  competencies: CompetencyItem[],
  responses: Response[],
): DomainScore[] {
  return selectedDomainIds.map((domainId) => {
    const items = competencies.filter((c) => c.domainId === domainId);
    return scoreDomain(domainId, items, responses);
  });
}

export function getStrengths(scores: DomainScore[]): CompetencyScore[] {
  return scores.flatMap((d) =>
    d.itemScores.filter((s) => s.classification === 'strength'),
  );
}

export function getDevelopmentPriorities(scores: DomainScore[]): CompetencyScore[] {
  return scores.flatMap((d) =>
    d.itemScores.filter((s) => s.classification === 'development_priority'),
  );
}

export function getMonitorItems(scores: DomainScore[]): CompetencyScore[] {
  return scores.flatMap((d) =>
    d.itemScores.filter((s) => s.classification === 'monitor'),
  );
}
