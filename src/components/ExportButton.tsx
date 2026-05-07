import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { RadarChartHandle } from './RadarChart';
import type { DomainScore } from '../types';
import { getStrengths, getDevelopmentPriorities } from '../lib/ScoringEngine';
import { COMPETENCIES } from '../data/competencies';

type Props = {
  scores: DomainScore[];
  name: string;
  startedAt: string;
  purpose: string;
  getChartRefs: () => Map<string, RadarChartHandle>;
};

const competencyMap = new Map(COMPETENCIES.map((c) => [c.id, c.label]));

function getLabel(id: string): string {
  return competencyMap.get(id) ?? id;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function purposeLabel(p: string): string {
  return p === 'current_role' ? 'Assess current role' : 'Plan for future goals';
}

// ── PDF layout constants ──────────────────────────────────────────────────────

const PAGE_W = 210;    // A4 mm
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const PRIMARY = [29, 78, 216] as const;    // primary-700 blue
const DANGER  = [220, 38, 38] as const;   // danger-600
const TEAL    = [20, 184, 166] as const;  // accent-500
const GRAY6   = [75, 85, 99] as const;
const GRAY4   = [156, 163, 175] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function setColor(doc: jsPDF, rgb: readonly [number, number, number], type: 'fill' | 'text' | 'draw') {
  if (type === 'fill')  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  if (type === 'text')  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  if (type === 'draw')  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function header(doc: jsPDF, title: string) {
  setColor(doc, PRIMARY, 'fill');
  doc.rect(0, 0, PAGE_W, 18, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [255, 255, 255], 'text');
  doc.text('WASH Competency Profiler', MARGIN, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(title, PAGE_W - MARGIN, 12, { align: 'right' });
  setColor(doc, GRAY6, 'text');
}

function footer(doc: jsPDF, pageNum: number, totalPages: number) {
  setColor(doc, GRAY4, 'text');
  doc.setFontSize(8);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W / 2, PAGE_H - 6, { align: 'center' });
}

// ── Summary table ─────────────────────────────────────────────────────────────

function drawSummaryTable(doc: jsPDF, scores: DomainScore[], startY: number): number {
  const cols = [
    { label: 'Domain', w: CONTENT_W * 0.46 },
    { label: 'Avg competence', w: CONTENT_W * 0.18, align: 'right' as const },
    { label: 'Avg importance', w: CONTENT_W * 0.18, align: 'right' as const },
    { label: 'Priority score', w: CONTENT_W * 0.18, align: 'right' as const },
  ];

  const ROW_H = 8;
  const HEAD_H = 8;
  let y = startY;

  // Header row
  setColor(doc, [243, 244, 246], 'fill');
  doc.rect(MARGIN, y, CONTENT_W, HEAD_H, 'F');
  setColor(doc, [229, 231, 235], 'draw');
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, CONTENT_W, HEAD_H, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, GRAY6, 'text');

  let x = MARGIN + 2;
  for (const col of cols) {
    doc.text(col.label, col.align === 'right' ? x + col.w - 2 : x, y + 5.5, { align: col.align ?? 'left' });
    x += col.w;
  }
  y += HEAD_H;

  // Data rows
  const sorted = [...scores].sort((a, b) => b.aggregatePriority - a.aggregatePriority);
  doc.setFont('helvetica', 'normal');

  for (let i = 0; i < sorted.length; i++) {
    const d = sorted[i];
    const bg = i % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
    setColor(doc, bg as [number, number, number], 'fill');
    doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'F');
    setColor(doc, [229, 231, 235], 'draw');
    doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'S');

    const priority = d.aggregatePriority;
    const priorityRgb: readonly [number, number, number] =
      priority >= 20 ? DANGER : priority >= 8 ? [217, 119, 6] : GRAY6;

    x = MARGIN + 2;
    setColor(doc, GRAY6, 'text');
    doc.text(d.domainLabel, x, y + 5.5);
    x += cols[0].w;

    doc.text(
      d.avgCompetence > 0 ? d.avgCompetence.toFixed(1) : '—',
      x + cols[1].w - 2, y + 5.5, { align: 'right' }
    );
    x += cols[1].w;

    doc.text(
      d.avgImportance > 0 ? d.avgImportance.toFixed(1) : '—',
      x + cols[2].w - 2, y + 5.5, { align: 'right' }
    );
    x += cols[2].w;

    setColor(doc, priorityRgb, 'text');
    doc.text(
      priority > 0 ? String(Math.round(priority)) : '—',
      x + cols[3].w - 2, y + 5.5, { align: 'right' }
    );

    y += ROW_H;
  }

  return y + 4;
}

// ── Text section (strengths / priorities / recommendations) ───────────────────

function drawTextSection(
  doc: jsPDF,
  strengths: ReturnType<typeof getStrengths>,
  priorities: ReturnType<typeof getDevelopmentPriorities>,
): void {
  let y = 26;

  // Section: Development priorities
  if (priorities.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(doc, DANGER, 'text');
    doc.text('DEVELOPMENT PRIORITIES', MARGIN, y);
    y += 7;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, GRAY6, 'text');

    const sorted = [...priorities].sort((a, b) => b.priority - a.priority);
    for (const s of sorted) {
      if (y > PAGE_H - 20) break;
      const label = getLabel(s.competencyId);
      const lines = doc.splitTextToSize(`• ${label} (Priority ${Math.round(s.priority)})`, CONTENT_W - 4);
      doc.text(lines, MARGIN + 4, y);
      y += lines.length * 5.5;
    }
    y += 6;
  }

  // Section: Strengths
  if (strengths.length > 0) {
    if (y > PAGE_H - 40) {
      doc.addPage();
      header(doc, 'Strengths');
      y = 26;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(doc, TEAL, 'text');
    doc.text('STRENGTHS', MARGIN, y);
    y += 7;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, GRAY6, 'text');

    for (const s of strengths.slice(0, 20)) {
      if (y > PAGE_H - 20) break;
      const label = getLabel(s.competencyId);
      const lines = doc.splitTextToSize(`★ ${label}`, CONTENT_W - 4);
      doc.text(lines, MARGIN + 4, y);
      y += lines.length * 5.5;
    }
    if (strengths.length > 20) {
      y += 2;
      setColor(doc, GRAY4, 'text');
      doc.setFontSize(8);
      doc.text(`+ ${strengths.length - 20} more strengths`, MARGIN + 4, y);
    }
    y += 8;
  }

  // Section: Recommendations
  if (y > PAGE_H - 40) {
    doc.addPage();
    header(doc, 'Recommendations');
    y = 26;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, PRIMARY, 'text');
  doc.text('RECOMMENDATIONS', MARGIN, y);
  y += 7;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  setColor(doc, GRAY6, 'text');

  if (priorities.length === 0 && strengths.length === 0) {
    const lines = doc.splitTextToSize(
      'No high-priority gaps identified. Focus on maintaining your current strengths and consider taking on mentoring opportunities in areas where you excel.',
      CONTENT_W,
    );
    doc.text(lines, MARGIN, y);
  } else {
    if (priorities.length > 0) {
      const topLabel = getLabel(priorities[0].competencyId);
      const lines = doc.splitTextToSize(
        `Focus your development on the highest-priority competency: ${topLabel}. Consider formal training, coaching, or stretch assignments to build capability in this area.`,
        CONTENT_W,
      );
      doc.text(lines, MARGIN, y);
      y += lines.length * 5.5 + 4;
    }
    if (strengths.length > 0 && y < PAGE_H - 20) {
      const topStrength = getLabel(strengths[0].competencyId);
      const lines = doc.splitTextToSize(
        `Leverage your strength in ${topStrength} by mentoring others and seeking opportunities to apply this expertise in leadership or advisory roles.`,
        CONTENT_W,
      );
      setColor(doc, GRAY6, 'text');
      doc.text(lines, MARGIN, y);
    }
  }
}

// ── Main export function ──────────────────────────────────────────────────────

async function buildPDF(props: Props): Promise<void> {
  const { scores, name, startedAt, purpose, getChartRefs } = props;

  const strengths  = getStrengths(scores);
  const priorities = getDevelopmentPriorities(scores).sort((a, b) => b.priority - a.priority);

  const chartRefs = getChartRefs();
  const domainCount = scores.length;
  // Pages: 1 (cover/summary) + domainCount (charts) + 1 (text)
  const totalPages = 1 + domainCount + 1;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Page 1: Cover + domain summary ─────────────────────────────────────────
  header(doc, 'Assessment Summary');

  let y = 26;

  // Title block
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  setColor(doc, PRIMARY, 'text');
  doc.text('WASH Competency Profile', MARGIN, y);
  y += 9;

  if (name) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    setColor(doc, GRAY6, 'text');
    doc.text(name, MARGIN, y);
    y += 7;
  }

  doc.setFontSize(9);
  setColor(doc, GRAY4, 'text');
  doc.text(`Date: ${formatDate(startedAt)}  ·  Purpose: ${purposeLabel(purpose)}`, MARGIN, y);
  y += 10;

  // Divider
  setColor(doc, [229, 231, 235], 'draw');
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  // Domain summary heading
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(doc, GRAY6, 'text');
  doc.text('Domain Summary', MARGIN, y);
  y += 6;

  drawSummaryTable(doc, scores, y);

  footer(doc, 1, totalPages);

  // ── Pages 2…N: Radar charts ─────────────────────────────────────────────────
  let pageNum = 2;
  for (const domain of scores) {
    doc.addPage();
    header(doc, domain.domainLabel);

    const ref = chartRefs.get(domain.domainId);
    if (ref) {
      try {
        const dataUrl = await ref.exportAsImage();
        // Image is 2× scale of the rendered element (~400×300px → fits ~140mm wide)
        const imgW = CONTENT_W;
        const imgH = imgW * 0.75;
        doc.addImage(dataUrl, 'PNG', MARGIN, 26, imgW, imgH);
      } catch {
        doc.setFontSize(9);
        setColor(doc, GRAY4, 'text');
        doc.text('Chart capture unavailable', MARGIN, 40);
      }
    }

    footer(doc, pageNum, totalPages);
    pageNum++;
  }

  // ── Final page: Strengths, priorities, recommendations ─────────────────────
  doc.addPage();
  header(doc, 'Strengths & Priorities');
  drawTextSection(doc, strengths, priorities);
  footer(doc, pageNum, totalPages);

  // ── Save ────────────────────────────────────────────────────────────────────
  const dateStr = new Date(startedAt).toISOString().slice(0, 10);
  doc.save(`WASH_Competency_Profile_${dateStr}.pdf`);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExportButton(props: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await buildPDF(props);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Generating PDF…
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  );
}
