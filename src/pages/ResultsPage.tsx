import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import ResultsDashboard, { type ResultsDashboardHandle } from '../components/ResultsDashboard';
import ExportButton from '../components/ExportButton';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessment();
  const dashboardRef = useRef<ResultsDashboardHandle>(null);
  const [name, setName] = useState('');

  if (!state.scores || state.scores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-gray-500">No results yet — please complete the assessment first.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors"
          >
            Back to start
          </button>
        </div>
      </div>
    );
  }

  function handleReset() {
    dispatch({ type: 'RESET' });
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-primary-700 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <span className="text-white font-semibold text-base sm:text-lg truncate">WASH Competency Profiler</span>
          <button
            onClick={handleReset}
            className="text-primary-200 hover:text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0"
          >
            New assessment
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div className="space-y-3">
              <div>
                <label htmlFor="assessor-name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Your name (optional)
                </label>
                <input
                  id="assessor-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Assessment date
                </p>
                <p className="text-sm text-gray-700">{formatDate(state.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Purpose
                </p>
                <p className="text-sm text-gray-700">
                  {state.purpose === 'current_role' ? 'Assess current role' : 'Plan for future goals'}
                </p>
              </div>
            </div>
            <ExportButton
              scores={state.scores}
              name={name}
              startedAt={state.startedAt}
              purpose={state.purpose ?? ''}
              getChartRefs={() => dashboardRef.current?.getChartRefs() ?? new Map()}
            />
          </div>
        </div>

        {/* Dashboard */}
        <ResultsDashboard
          ref={dashboardRef}
          scores={state.scores}
          responses={state.responses}
        />

      </div>
    </div>
  );
}
