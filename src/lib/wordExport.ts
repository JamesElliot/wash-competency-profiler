import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ExportAssessmentRecord, ExportCompetencyRow } from './exportData';

export async function exportWordDocument(record: ExportAssessmentRecord): Promise<void> {
  const children = [
    heading('WASH Competency Profile', HeadingLevel.TITLE),
    paragraph(`Name: ${record.metadata.name || 'Not provided'}`),
    paragraph(`Assessment date: ${formatDate(record.metadata.startedAt)}`),
    paragraph(`Framework: ${record.metadata.frameworkVersion}`),
    paragraph(''),
    heading('Domain Summary', HeadingLevel.HEADING_1),
    domainSummaryTable(record),
    heading('Development Priorities', HeadingLevel.HEADING_1),
    ...competencySection(record.developmentPriorities, true),
    heading('Maintain and Monitor', HeadingLevel.HEADING_1),
    ...competencySection(record.monitorItems, true),
    heading('Strengths to Use or Share', HeadingLevel.HEADING_1),
    ...competencySection(record.strengths, false),
    heading('Not Applicable', HeadingLevel.HEADING_1),
    ...competencySection(record.notApplicableItems, false),
    heading('Professional Development Notes', HeadingLevel.HEADING_1),
    paragraph(record.generalDevelopmentNotes || 'No general notes added.'),
    heading('Action Plan', HeadingLevel.HEADING_1),
    actionPlanTable(record.developmentPriorities),
    heading('Framework and Acknowledgements', HeadingLevel.HEADING_1),
    paragraph(record.acknowledgement),
    paragraph(record.disclaimer),
    paragraph(`Framework link: ${record.metadata.frameworkUrl}`),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const dateStr = new Date(record.metadata.startedAt).toISOString().slice(0, 10);
  saveAs(blob, `WASH_Competency_Profile_${dateStr}.docx`);
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

function paragraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 120 },
  });
}

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold })],
      }),
    ],
  });
}

function domainSummaryTable(record: ExportAssessmentRecord): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell('Domain', true),
          cell('Assessed', true),
          cell('N/A', true),
          cell('Avg competence', true),
          cell('Avg importance', true),
          cell('Priority', true),
        ],
      }),
      ...record.domainSummaries.map(
        (domain) =>
          new TableRow({
            children: [
              cell(domain.domainLabel),
              cell(`${domain.answeredCount}/${domain.itemScores.length}`),
              cell(String(domain.notApplicableCount)),
              cell(domain.answeredCount > 0 ? domain.avgCompetence.toFixed(1) : '-'),
              cell(domain.answeredCount > 0 ? domain.avgImportance.toFixed(1) : '-'),
              cell(domain.aggregatePriority > 0 ? String(Math.round(domain.aggregatePriority)) : '-'),
            ],
          }),
      ),
    ],
  });
}

function competencySection(rows: ExportCompetencyRow[], includePriority: boolean): Paragraph[] {
  if (rows.length === 0) return [paragraph('No items in this section.')];

  return rows.flatMap((row) => {
    const title = includePriority
      ? `${row.competencyId} | Priority ${Math.round(row.priority)}`
      : row.competencyId;
    const items = [
      new Paragraph({
        children: [new TextRun({ text: title, bold: true })],
        spacing: { before: 120, after: 60 },
      }),
      paragraph(row.competencyText),
      paragraph(
        `Domain: ${row.domainLabel}${row.themeLabel ? ` | Theme: ${row.themeLabel}` : ''}`,
      ),
    ];

    if (row.status === 'answered') {
      items.push(
        paragraph(`Current level: ${row.competence ?? '-'} | Importance: ${row.importance ?? '-'}`),
      );
    } else if (row.status === 'not_applicable') {
      items.push(paragraph('Marked not applicable to this role.'));
    }

    if (row.note.trim()) {
      items.push(paragraph(`Note: ${row.note.trim()}`));
    }

    return items;
  });
}

function actionPlanTable(rows: ExportCompetencyRow[]): Table {
  const planRows = rows.length > 0 ? rows : [];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell('Priority competency', true),
          cell('Planned action', true),
          cell('Support needed', true),
          cell('Timeframe', true),
        ],
      }),
      ...(planRows.length > 0
        ? planRows.map(
            (row) =>
              new TableRow({
                children: [
                  cell(`${row.competencyId}: ${row.competencyText}`),
                  cell(row.note || ''),
                  cell(''),
                  cell(''),
                ],
              }),
          )
        : [
            new TableRow({
              children: [cell(''), cell(''), cell(''), cell('')],
            }),
          ]),
    ],
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
