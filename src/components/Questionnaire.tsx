import { useState } from 'react';
import { useAssessment } from '../context/AssessmentContext';
import type { CompetencyItem } from '../types';

// ── Likert labels ─────────────────────────────────────────────────────────────

const COMPETENCE_LABELS: Record<number, string> = {
  1: 'Novice',
  2: 'Developing',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Expert',
};

const IMPORTANCE_LABELS: Record<number, string> = {
  1: 'Not important',
  2: 'Slightly',
  3: 'Moderate',
  4: 'Very important',
  5: 'Critical',
};

// ── LikertScale ───────────────────────────────────────────────────────────────

type LikertValue = 1 | 2 | 3 | 4 | 5;

type LikertProps = {
  name: string;
  value: LikertValue | null;
  onChange: (v: LikertValue) => void;
  labels: Record<number, string>;
  ariaLabel: string;
};

function LikertScale({ name, value, onChange, labels, ariaLabel }: LikertProps) {
  const options: LikertValue[] = [1, 2, 3, 4, 5];

  const circleClass = (v: LikertValue) =>
    [
      'w-10 h-10 rounded-full border-2 flex items-center justify-center',
      'text-sm font-semibold transition-all select-none',
      'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
      value === v
        ? 'border-primary-700 bg-primary-700 text-white'
        : 'border-gray-300 text-gray-500 group-hover:border-primary-400 group-hover:text-primary-600',
    ].join(' ');

  return (
    <div role="radiogroup" aria-label={ariaLabel}>
      {/* Mobile: vertical */}
      <div className="flex flex-col gap-2 sm:hidden">
        {options.map((v) => (
          <label key={v} className="group flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
              className="sr-only peer"
            />
            <span className={circleClass(v)}>{v}</span>
            <span className="text-sm text-gray-600">{labels[v]}</span>
          </label>
        ))}
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden sm:flex gap-2">
        {options.map((v) => (
          <label key={v} className="group flex-1 flex flex-col items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
              className="sr-only peer"
            />
            <span className={circleClass(v)}>{v}</span>
            <span className="text-xs text-center text-gray-400 leading-tight">{labels[v]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── FeedbackLink ──────────────────────────────────────────────────────────────

const REPO = 'JamesElliot/wash-competency-profiler';

function FeedbackLink({ competencyId, competencyLabel }: { competencyId: string; competencyLabel: string }) {
  const title = encodeURIComponent(`Feedback: ${competencyId}`);
  const body = encodeURIComponent(
    `**Competency:** ${competencyId}\n**Description:** ${competencyLabel}\n\n---\n\n**My feedback:**\n\n<!-- Please describe your suggested change, correction, or comment below -->\n`,
  );
  const url = `https://github.com/${REPO}/issues/new?title=${title}&body=${body}&labels=competency-feedback`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Submit feedback for ${competencyId}`}
      title="Suggest a change or correction"
      className="flex-shrink-0 text-gray-300 hover:text-primary-500 transition-colors mt-0.5"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18m0-14.25L7.5 5.5 12 7.75 16.5 5.5 21 7.75V18l-4.5-2.25L12 18l-4.5-2.25L3 18V7.75z" />
      </svg>
    </a>
  );
}

// ── CompetencyCard ────────────────────────────────────────────────────────────

function CompetencyCard({ item }: { item: CompetencyItem }) {
  const { state, dispatch } = useAssessment();
  const response = state.responses.find((r) => r.competencyId === item.id);

  const [skipped, setSkipped] = useState(
    () => response !== undefined && response.competence === null,
  );

  const competence = (response?.competence ?? null) as LikertValue | null;
  const importance = (response?.importance ?? null) as LikertValue | null;

  function handleCompetence(v: LikertValue) {
    dispatch({
      type: 'SET_RESPONSE',
      payload: { competencyId: item.id, competence: v, importance: response?.importance ?? null },
    });
  }

  function handleImportance(v: LikertValue) {
    dispatch({
      type: 'SET_RESPONSE',
      payload: { competencyId: item.id, competence: response?.competence ?? null, importance: v },
    });
  }

  function handleSkip(checked: boolean) {
    setSkipped(checked);
    if (checked) {
      dispatch({
        type: 'SET_RESPONSE',
        payload: { competencyId: item.id, competence: null, importance: null },
      });
    } else {
      dispatch({ type: 'CLEAR_RESPONSE', payload: item.id });
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={`label-${item.id}`}
      className={[
        'rounded-xl border p-5 space-y-4 transition-colors',
        skipped ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200',
      ].join(' ')}
    >
      {/* Competency label */}
      <div className="flex gap-3">
        <span className="flex-shrink-0 font-mono text-xs text-gray-400 mt-0.5 pt-px">
          {item.id}
        </span>
        <p id={`label-${item.id}`} className="text-gray-900 font-medium leading-relaxed flex-1">
          {item.label}
        </p>
        <FeedbackLink competencyId={item.id} competencyLabel={item.label} />
      </div>

      {/* Skip checkbox */}
      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={skipped}
          onChange={(e) => handleSkip(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500 focus:ring-offset-0"
        />
        <span className="text-sm text-gray-500">Not applicable / Skip</span>
      </label>

      {skipped ? (
        <p className="text-sm text-gray-400 italic">
          This competency will be excluded from scoring.
        </p>
      ) : (
        <>
          {/* Competence */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">My current competence level</p>
            <LikertScale
              name={`${item.id}-competence`}
              value={competence}
              onChange={handleCompetence}
              labels={COMPETENCE_LABELS}
              ariaLabel={`Competence rating for: ${item.label}`}
            />
          </div>

          {/* Importance */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Importance to my role</p>
            <LikertScale
              name={`${item.id}-importance`}
              value={importance}
              onChange={handleImportance}
              labels={IMPORTANCE_LABELS}
              ariaLabel={`Importance rating for: ${item.label}`}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Questionnaire ─────────────────────────────────────────────────────────────

type Props = {
  items: CompetencyItem[];
  domainLabel: string;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
};

export default function Questionnaire({
  items,
  domainLabel,
  isFirst,
  isLast,
  onPrev,
  onNext,
  onFinish,
}: Props) {
  return (
    <div>
      {/* Domain header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">{domainLabel}</h2>
        <p className="text-sm text-gray-500 mt-1">{items.length} competencies</p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {items.map((item) => (
          <CompetencyCard key={item.id} item={item} />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-6 pb-10">
        {!isFirst && (
          <button
            type="button"
            onClick={onPrev}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Previous
          </button>
        )}
        <button
          type="button"
          onClick={isLast ? onFinish : onNext}
          className="flex-1 bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {isLast ? 'View results →' : 'Next domain →'}
        </button>
      </div>
    </div>
  );
}
