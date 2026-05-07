import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { DOMAINS, getCompetenciesByDomain } from '../data/competencies';
import type { AssessmentSession } from '../types';

const PURPOSE_OPTIONS: { value: AssessmentSession['purpose']; label: string; description: string }[] = [
  {
    value: 'current_role',
    label: 'Assess my current role',
    description: 'Identify strengths and gaps relative to your responsibilities today.',
  },
  {
    value: 'future_goals',
    label: 'Plan for future goals',
    description: 'Map competencies you want to develop for a next role or career move.',
  },
];

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  core: 'Foundational standards, planning, coordination, and cross-cutting skills for all WASH practitioners.',
  hp:   'Behaviour change communication, formative research, and community engagement.',
  vc:   'Vector-borne disease risk assessment and control measures.',
  em:   'Sanitation systems from toilet design to fecal sludge transport and treatment.',
  sws:  'Water source development, treatment, distribution, and quality monitoring.',
  swm:  'Household and community solid waste collection, treatment, and disposal.',
};

export default function SetupPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessment();

  const canBegin = state.purpose !== null && state.selectedDomainIds.length > 0;

  function setPurpose(value: AssessmentSession['purpose']) {
    dispatch({ type: 'SET_PURPOSE', payload: value });
  }

  function toggleDomain(id: string) {
    const next = state.selectedDomainIds.includes(id)
      ? state.selectedDomainIds.filter((d) => d !== id)
      : [...state.selectedDomainIds, id];
    dispatch({ type: 'SET_DOMAINS', payload: next });
  }

  function toggleAll() {
    const allSelected = state.selectedDomainIds.length === DOMAINS.length;
    dispatch({
      type: 'SET_DOMAINS',
      payload: allSelected ? [] : DOMAINS.map((d) => d.id),
    });
  }

  function begin() {
    navigate('/assessment');
  }

  const allSelected = state.selectedDomainIds.length === DOMAINS.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-primary-700 py-4 px-6">
        <span className="text-white font-semibold text-lg">WASH Competency Profiler</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

        {/* Step 1 — Purpose */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Step 1 — What's the purpose of this assessment?
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            This helps tailor how results are framed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PURPOSE_OPTIONS.map(({ value, label, description }) => {
              const selected = state.purpose === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPurpose(value)}
                  className={[
                    'text-left rounded-xl border-2 p-5 transition-all',
                    selected
                      ? 'border-primary-700 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        'mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2',
                        selected
                          ? 'border-primary-700 bg-primary-700'
                          : 'border-gray-300 bg-white',
                      ].join(' ')}
                    />
                    <div>
                      <p className={['font-semibold', selected ? 'text-primary-800' : 'text-gray-800'].join(' ')}>
                        {label}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2 — Domains */}
        <section>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-xl font-bold text-gray-900">
              Step 2 — Which domains do you want to assess?
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Select at least one. You can assess all domains or focus on those
            most relevant to your role.
          </p>

          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm text-primary-700 hover:text-primary-900 font-medium"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-3">
            {DOMAINS.map((domain) => {
              const count = getCompetenciesByDomain(domain.id).length;
              const checked = state.selectedDomainIds.includes(domain.id);
              return (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => toggleDomain(domain.id)}
                  className={[
                    'w-full text-left rounded-xl border-2 p-4 transition-all',
                    checked
                      ? 'border-primary-700 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        'mt-1 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center',
                        checked
                          ? 'border-primary-700 bg-primary-700'
                          : 'border-gray-300 bg-white',
                      ].join(' ')}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="currentColor">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={['font-semibold', checked ? 'text-primary-800' : 'text-gray-800'].join(' ')}>
                          {domain.label}
                        </p>
                        <span className="flex-shrink-0 text-xs text-gray-400 font-medium whitespace-nowrap">
                          {count} items
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {DOMAIN_DESCRIPTIONS[domain.id] ?? ''}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="pt-2">
          {state.selectedDomainIds.length > 0 && (
            <p className="text-sm text-gray-500 mb-3 text-center">
              {state.selectedDomainIds.length} domain{state.selectedDomainIds.length > 1 ? 's' : ''} selected
              {' · '}
              {state.selectedDomainIds.reduce(
                (sum, id) => sum + getCompetenciesByDomain(id).length,
                0,
              )}{' '}
              competencies
            </p>
          )}

          <button
            type="button"
            onClick={begin}
            disabled={!canBegin}
            className={[
              'w-full font-semibold py-3 px-6 rounded-lg transition-colors',
              canBegin
                ? 'bg-primary-700 hover:bg-primary-800 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            Begin assessment
          </button>
        </div>

      </div>
    </div>
  );
}
