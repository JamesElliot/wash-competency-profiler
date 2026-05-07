import { describe, it, expect } from 'vitest';
import {
  classifyResponse,
  scoreCompetency,
  scoreDomain,
  getStrengths,
  getDevelopmentPriorities,
} from './ScoringEngine';
import type { CompetencyItem, CompetencyScore, Response } from '../types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const item = (id: string): CompetencyItem => ({
  id,
  domainId: 'core',
  themeId: 'core-01',
  subThemeId: null,
  label: `Competency ${id}`,
});

const resp = (
  competencyId: string,
  competence: Response['competence'],
  importance: Response['importance'],
): Response => ({ competencyId, competence, importance });

// ── classifyResponse ──────────────────────────────────────────────────────────

describe('classifyResponse', () => {
  it('returns skipped when competence is null', () => {
    expect(classifyResponse(resp('x', null, 4))).toBe('skipped');
  });

  it('returns skipped when importance is null', () => {
    expect(classifyResponse(resp('x', 4, null))).toBe('skipped');
  });

  it('returns skipped when both are null', () => {
    expect(classifyResponse(resp('x', null, null))).toBe('skipped');
  });

  it('returns strength when competence=4 AND importance=4 (boundary)', () => {
    expect(classifyResponse(resp('x', 4, 4))).toBe('strength');
  });

  it('returns strength when competence=5 AND importance=5', () => {
    expect(classifyResponse(resp('x', 5, 5))).toBe('strength');
  });

  it('returns development_priority when importance=4 AND competence=2 (boundary)', () => {
    expect(classifyResponse(resp('x', 2, 4))).toBe('development_priority');
  });

  it('returns development_priority when importance=5 AND competence=1', () => {
    expect(classifyResponse(resp('x', 1, 5))).toBe('development_priority');
  });

  it('returns monitor when importance=4 AND competence=3 (boundary)', () => {
    expect(classifyResponse(resp('x', 3, 4))).toBe('monitor');
  });

  it('returns monitor when importance=5 AND competence=3', () => {
    expect(classifyResponse(resp('x', 3, 5))).toBe('monitor');
  });

  it('returns low_priority when importance=3', () => {
    expect(classifyResponse(resp('x', 1, 3))).toBe('low_priority');
  });

  it('returns low_priority when importance=1', () => {
    expect(classifyResponse(resp('x', 5, 1))).toBe('low_priority');
  });
});

// ── scoreCompetency ───────────────────────────────────────────────────────────

describe('scoreCompetency', () => {
  it('calculates gap and priority correctly', () => {
    const score = scoreCompetency(item('CORE-01-01'), resp('CORE-01-01', 2, 5));
    expect(score.gap).toBe(3);       // 5 - 2
    expect(score.priority).toBe(15); // 3 × 5
    expect(score.classification).toBe('development_priority');
  });

  it('produces zero gap and priority for a strength', () => {
    const score = scoreCompetency(item('CORE-01-02'), resp('CORE-01-02', 5, 5));
    expect(score.gap).toBe(0);
    expect(score.priority).toBe(0);
    expect(score.classification).toBe('strength');
  });

  it('produces negative gap when competence exceeds importance', () => {
    const score = scoreCompetency(item('CORE-01-03'), resp('CORE-01-03', 5, 3));
    expect(score.gap).toBe(-2);
    expect(score.priority).toBe(-6); // -2 × 3
    expect(score.classification).toBe('low_priority');
  });

  it('returns skipped score when response is undefined', () => {
    const score = scoreCompetency(item('CORE-01-01'), undefined);
    expect(score.classification).toBe('skipped');
    expect(score.gap).toBe(0);
    expect(score.priority).toBe(0);
  });

  it('returns skipped score when response has null values', () => {
    const score = scoreCompetency(item('CORE-01-01'), resp('CORE-01-01', null, null));
    expect(score.classification).toBe('skipped');
  });

  it('carries through domainId, themeId, subThemeId from the item', () => {
    const customItem: CompetencyItem = {
      id: 'EM-03a-01',
      domainId: 'em',
      themeId: 'em-03a',
      subThemeId: 'user-interface',
      label: 'Select toilets',
    };
    const score = scoreCompetency(customItem, resp('EM-03a-01', 3, 4));
    expect(score.domainId).toBe('em');
    expect(score.themeId).toBe('em-03a');
    expect(score.subThemeId).toBe('user-interface');
  });
});

// ── scoreDomain ───────────────────────────────────────────────────────────────

describe('scoreDomain', () => {
  const items = [item('CORE-01-01'), item('CORE-01-02'), item('CORE-01-03')];

  it('excludes skipped items from avgCompetence and avgImportance', () => {
    const responses: Response[] = [
      resp('CORE-01-01', 4, 5),  // answered
      resp('CORE-01-02', 2, 5),  // answered
      resp('CORE-01-03', null, null), // skipped
    ];
    const domain = scoreDomain('core', items, responses);
    // avg competence = (4 + 2) / 2 = 3
    expect(domain.avgCompetence).toBeCloseTo(3);
    // avg importance = (5 + 5) / 2 = 5
    expect(domain.avgImportance).toBeCloseTo(5);
  });

  it('returns 0 averages when all items are skipped', () => {
    const domain = scoreDomain('core', items, []);
    expect(domain.avgCompetence).toBe(0);
    expect(domain.avgImportance).toBe(0);
  });

  it('sums aggregatePriority correctly', () => {
    const responses: Response[] = [
      resp('CORE-01-01', 2, 5),  // gap=3, priority=15
      resp('CORE-01-02', 3, 4),  // gap=1, priority=4
      resp('CORE-01-03', 4, 4),  // gap=0, priority=0
    ];
    const domain = scoreDomain('core', items, responses);
    expect(domain.aggregatePriority).toBe(19);
  });

  it('skipped items contribute 0 to aggregatePriority', () => {
    const responses: Response[] = [
      resp('CORE-01-01', 2, 5),  // priority=15
    ];
    const domain = scoreDomain('core', items, responses);
    expect(domain.aggregatePriority).toBe(15);
  });

  it('itemScores length equals items length', () => {
    const domain = scoreDomain('core', items, []);
    expect(domain.itemScores).toHaveLength(3);
  });
});

// ── getStrengths & getDevelopmentPriorities ───────────────────────────────────

const makeScore = (
  id: string,
  classification: CompetencyScore['classification'],
): CompetencyScore => ({
  competencyId: id,
  domainId: 'core',
  themeId: 'core-01',
  subThemeId: null,
  gap: 0,
  priority: 0,
  classification,
});

const mixedDomainScores = [
  {
    domainId: 'core',
    domainLabel: 'Core',
    avgCompetence: 3,
    avgImportance: 4,
    aggregatePriority: 10,
    itemScores: [
      makeScore('A', 'strength'),
      makeScore('B', 'development_priority'),
      makeScore('C', 'monitor'),
      makeScore('D', 'low_priority'),
      makeScore('E', 'skipped'),
    ],
  },
  {
    domainId: 'em',
    domainLabel: 'Excreta management',
    avgCompetence: 2,
    avgImportance: 5,
    aggregatePriority: 20,
    itemScores: [
      makeScore('F', 'strength'),
      makeScore('G', 'development_priority'),
    ],
  },
];

describe('getStrengths', () => {
  it('returns only strength-classified scores across all domains', () => {
    const result = getStrengths(mixedDomainScores);
    expect(result.map((s) => s.competencyId)).toEqual(['A', 'F']);
  });

  it('returns empty array when no strengths exist', () => {
    const noStrengths = [
      { ...mixedDomainScores[0]!, itemScores: [makeScore('X', 'monitor')] },
    ];
    expect(getStrengths(noStrengths)).toHaveLength(0);
  });
});

describe('getDevelopmentPriorities', () => {
  it('returns only development_priority scores across all domains', () => {
    const result = getDevelopmentPriorities(mixedDomainScores);
    expect(result.map((s) => s.competencyId)).toEqual(['B', 'G']);
  });

  it('returns empty array when no development priorities exist', () => {
    const noPriorities = [
      { ...mixedDomainScores[0]!, itemScores: [makeScore('X', 'strength')] },
    ];
    expect(getDevelopmentPriorities(noPriorities)).toHaveLength(0);
  });
});
