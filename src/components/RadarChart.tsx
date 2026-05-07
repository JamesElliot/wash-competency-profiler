import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import html2canvas from 'html2canvas';
import type { DomainScore, Response } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RadarChartHandle = {
  exportAsImage: () => Promise<string>;
};

type Props = {
  domain: DomainScore;
  responses: Response[];
  showImportance?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Strip the domain prefix so axis labels are compact: "CORE-01-01" → "01-01"
function shortId(competencyId: string): string {
  const parts = competencyId.split('-');
  return parts.slice(1).join('-');
}

// ── Component ─────────────────────────────────────────────────────────────────

const RadarChart = forwardRef<RadarChartHandle, Props>(function RadarChart(
  { domain, responses, showImportance = false },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    async exportAsImage() {
      if (!containerRef.current) return '';
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      return canvas.toDataURL('image/png');
    },
  }));

  const responseMap = new Map(responses.map((r) => [r.competencyId, r]));

  const data = domain.itemScores.map((score) => {
    const r = responseMap.get(score.competencyId);
    return {
      subject: shortId(score.competencyId),
      competencyId: score.competencyId,
      competence: r?.competence ?? 0,
      importance: r?.importance ?? 0,
      fullMark: 5,
    };
  });

  // Hide axis labels when there are too many to read legibly
  const showLabels = data.length <= 20;

  return (
    <div ref={containerRef} className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{domain.domainLabel}</h3>
      <p className="text-xs text-gray-400 mb-3">
        Avg competence: {domain.avgCompetence.toFixed(1)} · Avg importance:{' '}
        {domain.avgImportance.toFixed(1)}
      </p>

      <div
        role="img"
        aria-label={`Radar chart for ${domain.domainLabel}. Average competence ${domain.avgCompetence.toFixed(1)}, average importance ${domain.avgImportance.toFixed(1)}.`}
      >
      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadarChart
          data={data}
          margin={{ top: 10, right: 40, bottom: 10, left: 40 }}
        >
          <PolarGrid stroke="#e5e7eb" />

          <PolarAngleAxis
            dataKey="subject"
            tick={
              showLabels
                ? { fontSize: 10, fill: '#9ca3af' }
                : false
            }
          />

          <PolarRadiusAxis
            domain={[0, 5]}
            tickCount={6}
            tick={{ fontSize: 9, fill: '#d1d5db' }}
            axisLine={false}
          />

          <Radar
            name="Competence"
            dataKey="competence"
            stroke="#1d4ed8"
            fill="#1d4ed8"
            fillOpacity={0.55}
            strokeWidth={1.5}
          />

          {showImportance && (
            <Radar
              name="Importance"
              dataKey="importance"
              stroke="#0d9488"
              fill="#14b8a6"
              fillOpacity={0.35}
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
          )}

          <Tooltip
            formatter={(value: number, name: string) => [
              value === 0 ? 'Not rated' : value,
              name,
            ]}
            labelFormatter={(label: string) => `Item: ${label}`}
            contentStyle={{ fontSize: 12 }}
          />

          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
});

export default RadarChart;
