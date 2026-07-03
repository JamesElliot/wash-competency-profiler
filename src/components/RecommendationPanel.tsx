import { COMPETENCIES } from '../data/competencies';
import type { CompetencyScore } from '../types';

type Props = {
  strengths: CompetencyScore[];
  priorities: CompetencyScore[];
  monitorItems: CompetencyScore[];
};

const competencyMap = new Map(COMPETENCIES.map((c) => [c.id, c.label]));

function getLabel(id: string): string {
  return competencyMap.get(id) ?? id;
}

export default function RecommendationPanel({ strengths, priorities, monitorItems }: Props) {
  const hasContent = priorities.length > 0 || strengths.length > 0 || monitorItems.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="text-base font-bold text-gray-900">Recommendations</h3>

      {!hasContent && (
        <p className="text-sm text-gray-500 leading-relaxed">
          No high-priority gaps identified. Focus on maintaining your current strengths and
          consider taking on mentoring opportunities in areas where you excel.
        </p>
      )}

      {priorities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-danger-600 uppercase tracking-wider">
            Development priorities
          </h4>
          <ul className="space-y-2.5">
            {priorities.map((s) => (
              <li key={s.competencyId} className="flex gap-2.5">
                <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-danger-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold leading-none">!</span>
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold">High priority development area:</span>{' '}
                  {getLabel(s.competencyId)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {monitorItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-warning-600 uppercase tracking-wider">
            Maintain and monitor
          </h4>
          <ul className="space-y-2.5">
            {monitorItems.slice(0, 8).map((s) => (
              <li key={s.competencyId} className="flex gap-2.5">
                <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-warning-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold leading-none">·</span>
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold">Maintain and monitor:</span>{' '}
                  {getLabel(s.competencyId)}
                </p>
              </li>
            ))}
          </ul>
          {monitorItems.length > 8 && (
            <p className="text-xs text-gray-400 pl-6">
              + {monitorItems.length - 8} more monitor items listed above
            </p>
          )}
        </div>
      )}

      {strengths.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-accent-600 uppercase tracking-wider">
            Strengths
          </h4>
          <ul className="space-y-2.5">
            {strengths.slice(0, 12).map((s) => (
              <li key={s.competencyId} className="flex gap-2.5">
                <span className="flex-shrink-0 mt-0.5 text-accent-500 text-sm leading-none">★</span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold">Strength — potential for mentoring:</span>{' '}
                  {getLabel(s.competencyId)}
                </p>
              </li>
            ))}
          </ul>
          {strengths.length > 12 && (
            <p className="text-xs text-gray-400 pl-6">
              + {strengths.length - 12} more strengths listed above
            </p>
          )}
        </div>
      )}
    </div>
  );
}
