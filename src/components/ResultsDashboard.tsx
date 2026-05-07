import { forwardRef, useImperativeHandle, useRef } from 'react';
import { COMPETENCIES } from '../data/competencies';
import { getStrengths, getDevelopmentPriorities } from '../lib/ScoringEngine';
import RadarChart, { type RadarChartHandle } from './RadarChart';
import RecommendationPanel from './RecommendationPanel';
import type { DomainScore, Response } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ResultsDashboardHandle = {
  getChartRefs: () => Map<string, RadarChartHandle>;
};

type Props = {
  scores: DomainScore[];
  responses: Response[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const competencyMap = new Map(COMPETENCIES.map((c) => [c.id, c]));

function priorityColour(score: number): string {
  if (score >= 20) return 'text-danger-600 font-semibold';
  if (score >= 8)  return 'text-warning-600 font-semibold';
  return 'text-gray-600';
}

// ── Component ─────────────────────────────────────────────────────────────────

const ResultsDashboard = forwardRef<ResultsDashboardHandle, Props>(
  function ResultsDashboard({ scores, responses }, ref) {
    const chartRefs = useRef<Map<string, RadarChartHandle>>(new Map());

    useImperativeHandle(ref, () => ({
      getChartRefs: () => chartRefs.current,
    }));

    const sortedScores = [...scores].sort((a, b) => b.aggregatePriority - a.aggregatePriority);
    const strengths   = getStrengths(scores);
    const priorities  = getDevelopmentPriorities(scores).sort((a, b) => b.priority - a.priority);

    return (
      <div className="space-y-8">

        {/* ── Domain summary table ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Domain summary</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Domain</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Avg competence</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Avg importance</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Priority score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedScores.map((d) => (
                    <tr key={d.domainId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-800 font-medium">{d.domainLabel}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {d.avgCompetence > 0 ? d.avgCompetence.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {d.avgImportance > 0 ? d.avgImportance.toFixed(1) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right ${priorityColour(d.aggregatePriority)}`}>
                        {d.aggregatePriority > 0 ? Math.round(d.aggregatePriority) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Radar charts ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Competency profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scores.map((domain) => (
              <RadarChart
                key={domain.domainId}
                ref={(el) => {
                  if (el) chartRefs.current.set(domain.domainId, el);
                  else chartRefs.current.delete(domain.domainId);
                }}
                domain={domain}
                responses={responses}
                showImportance
              />
            ))}
          </div>
        </section>

        {/* ── Strengths & priorities ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Strengths */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Strengths</h2>
            <p className="text-xs text-gray-400 mb-4">Competence ≥4 and importance ≥4</p>
            {strengths.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No strengths identified. Rate more competencies to see strengths appear here.
              </p>
            ) : (
              <ul className="space-y-3">
                {strengths.map((s) => {
                  const item = competencyMap.get(s.competencyId);
                  return (
                    <li key={s.competencyId} className="flex gap-2.5">
                      <span className="flex-shrink-0 mt-0.5 w-2 h-2 rounded-full bg-accent-500 mt-1.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-gray-400">{s.competencyId}</p>
                        <p className="text-sm text-gray-700 leading-snug">
                          {item?.label ?? s.competencyId}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Development priorities */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Development priorities</h2>
            <p className="text-xs text-gray-400 mb-4">Importance ≥4 and competence ≤2, sorted by priority</p>
            {priorities.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No high-priority gaps identified.
              </p>
            ) : (
              <ul className="space-y-3">
                {priorities.map((s) => {
                  const item = competencyMap.get(s.competencyId);
                  return (
                    <li key={s.competencyId} className="flex gap-2.5">
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-danger-500 mt-1.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-mono text-gray-400">{s.competencyId}</p>
                          <span className="text-xs bg-danger-50 text-danger-600 font-medium px-1.5 py-0.5 rounded">
                            Priority {Math.round(s.priority)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-snug">
                          {item?.label ?? s.competencyId}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ── Recommendations ───────────────────────────────────────────────── */}
        <RecommendationPanel strengths={strengths} priorities={priorities} />

      </div>
    );
  },
);

export default ResultsDashboard;
