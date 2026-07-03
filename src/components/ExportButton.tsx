import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { RadarChartHandle } from './RadarChart';
import type { AssessmentSession, DomainScore } from '../types';
import {
  buildExportAssessmentRecord,
  type ExportAssessmentRecord,
  type ExportCompetencyRow,
} from '../lib/exportData';
import { exportWordDocument } from '../lib/wordExport';

type Props = {
  scores: DomainScore[];
  session: AssessmentSession;
  name: string;
  startedAt: string;
  purpose: string;
  getChartRefs: () => Map<string, RadarChartHandle>;
};

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
    { label: 'Domain', w: CONTENT_W * 0.38 },
    { label: 'Assessed', w: CONTENT_W * 0.14, align: 'right' as const },
    { label: 'Avg competence', w: CONTENT_W * 0.16, align: 'right' as const },
    { label: 'Avg importance', w: CONTENT_W * 0.16, align: 'right' as const },
    { label: 'Priority', w: CONTENT_W * 0.16, align: 'right' as const },
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
      `${d.answeredCount}/${d.itemScores.length}`,
      x + cols[1].w - 2, y + 5.5, { align: 'right' }
    );
    x += cols[1].w;

    doc.text(
      d.answeredCount > 0 ? d.avgCompetence.toFixed(1) : '—',
      x + cols[2].w - 2, y + 5.5, { align: 'right' }
    );
    x += cols[2].w;

    doc.text(
      d.answeredCount > 0 ? d.avgImportance.toFixed(1) : '—',
      x + cols[3].w - 2, y + 5.5, { align: 'right' }
    );
    x += cols[3].w;

    setColor(doc, priorityRgb, 'text');
    doc.text(
      priority > 0 ? String(Math.round(priority)) : '—',
      x + cols[4].w - 2, y + 5.5, { align: 'right' }
    );

    y += ROW_H;
  }

  return y + 4;
}

// ── Text section (strengths / priorities / recommendations) ───────────────────

function drawTextSection(doc: jsPDF, record: ExportAssessmentRecord): void {
  let y = 26;

  function ensureSpace(required = 24, title = 'Results') {
    if (y > PAGE_H - required) {
      doc.addPage();
      header(doc, title);
      y = 26;
    }
  }

  function writeParagraph(text: string, indent = 0) {
    const lines = doc.splitTextToSize(text, CONTENT_W - indent);
    ensureSpace(lines.length * 5.5 + 8);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * 5.5 + 3;
  }

  function writeRows(
    title: string,
    rows: ExportCompetencyRow[],
    colour: readonly [number, number, number],
    options: { limit?: number; includePriority?: boolean; includeNotes?: boolean } = {},
  ) {
    if (rows.length === 0) return;

    ensureSpace(36, title);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(doc, colour, 'text');
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 7;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, GRAY6, 'text');

    const visibleRows = options.limit ? rows.slice(0, options.limit) : rows;
    for (const row of visibleRows) {
      const suffix = options.includePriority
        ? ` (Priority ${Math.round(row.priority)})`
        : '';
      writeParagraph(`• ${row.competencyId}: ${row.competencyText}${suffix}`, 4);
      if (options.includeNotes && row.note.trim()) {
        setColor(doc, GRAY4, 'text');
        writeParagraph(`Note: ${row.note.trim()}`, 8);
        setColor(doc, GRAY6, 'text');
      }
    }

    if (options.limit && rows.length > options.limit) {
      setColor(doc, GRAY4, 'text');
      writeParagraph(`+ ${rows.length - options.limit} more`, 4);
      setColor(doc, GRAY6, 'text');
    }
    y += 6;
  }

  writeRows('Development priorities', record.developmentPriorities, DANGER, {
    includePriority: true,
    includeNotes: true,
  });
  writeRows('Maintain and monitor', record.monitorItems, [217, 119, 6], {
    includePriority: true,
    limit: 30,
  });
  writeRows('Strengths to use or share', record.strengths, TEAL, { limit: 30 });
  writeRows('Not applicable', record.notApplicableItems, GRAY4, { limit: 40 });

  if (record.generalDevelopmentNotes.trim()) {
    ensureSpace(40, 'Notes');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(doc, PRIMARY, 'text');
    doc.text('PROFESSIONAL DEVELOPMENT NOTES', MARGIN, y);
    y += 7;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, GRAY6, 'text');
    writeParagraph(record.generalDevelopmentNotes.trim());
  }

  ensureSpace(40, 'Recommendations');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, PRIMARY, 'text');
  doc.text('RECOMMENDATIONS', MARGIN, y);
  y += 7;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  setColor(doc, GRAY6, 'text');

  if (record.developmentPriorities.length === 0 && record.strengths.length === 0) {
    writeParagraph(
      'No high-priority gaps identified. Focus on maintaining assessed strengths and monitoring important competencies where you are currently proficient.',
    );
  } else {
    if (record.developmentPriorities.length > 0) {
      const topPriority = record.developmentPriorities[0];
      writeParagraph(
        `Focus development on the highest-priority competency: ${topPriority.competencyText}. Consider formal training, coaching, mentoring, or supported practice to build capability in this area.`,
      );
    }
    if (record.strengths.length > 0) {
      const topStrength = record.strengths[0];
      writeParagraph(
        `Use your strength in ${topStrength.competencyText} by mentoring others or seeking opportunities to apply this expertise in advisory, training, or leadership roles.`,
      );
    }
  }

  ensureSpace(50, 'Acknowledgements');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, PRIMARY, 'text');
  doc.text('FRAMEWORK AND ACKNOWLEDGEMENTS', MARGIN, y);
  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(doc, GRAY6, 'text');
  writeParagraph(`Framework version: ${record.metadata.frameworkVersion}`);
  writeParagraph(record.acknowledgement);
  writeParagraph(record.disclaimer);
}

// ── Main export function ──────────────────────────────────────────────────────

async function buildPDF(props: Props): Promise<void> {
  const { scores, session, name, startedAt, purpose, getChartRefs } = props;
  const record = buildExportAssessmentRecord(session, scores, name);

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
  drawTextSection(doc, record);
  footer(doc, pageNum, totalPages);

  // ── Save ────────────────────────────────────────────────────────────────────
  const dateStr = new Date(startedAt).toISOString().slice(0, 10);
  doc.save(`WASH_Competency_Profile_${dateStr}.pdf`);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExportButton(props: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  async function handlePdfClick() {
    setPdfLoading(true);
    try {
      await buildPDF(props);
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleWordClick() {
    setWordLoading(true);
    try {
      const record = buildExportAssessmentRecord(props.session, props.scores, props.name);
      await exportWordDocument(record);
    } finally {
      setWordLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <button
        onClick={handlePdfClick}
        disabled={pdfLoading || wordLoading}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pdfLoading ? (
          <>
            <Spinner />
            Generating PDF…
          </>
        ) : (
          <>
            <DownloadIcon />
            Download PDF
          </>
        )}
      </button>

      <button
        onClick={handleWordClick}
        disabled={pdfLoading || wordLoading}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-primary-200 bg-white text-primary-700 font-medium py-2.5 px-5 rounded-lg text-sm hover:bg-primary-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {wordLoading ? (
          <>
            <Spinner />
            Generating Word…
          </>
        ) : (
          <>
            <DownloadIcon />
            Download Word
          </>
        )}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}
