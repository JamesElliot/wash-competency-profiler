import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessment();

  const hasProgress =
    state.responses.length > 0 || state.selectedDomainIds.length > 0;

  function startFresh() {
    dispatch({ type: 'RESET' });
    navigate('/setup');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-10 text-center">

        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-6">
          <svg className="w-8 h-8 text-primary-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          WASH Competency Profiler
        </h1>

        <p className="text-gray-600 leading-relaxed mb-2">
          A structured self-assessment tool for humanitarian WASH practitioners.
          Evaluate your competencies across core and technical domains, visualise
          strengths and gaps, and get tailored development recommendations.
        </p>

        <p className="text-sm text-gray-400 mb-8">
          Takes approximately 20 minutes to complete.
        </p>

        {hasProgress ? (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/assessment')}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Resume your assessment
            </button>
            <button
              onClick={startFresh}
              className="w-full border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Start a new assessment
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/setup')}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start assessment
          </button>
        )}

        <p className="mt-6 text-xs text-gray-400">
          No account required. Your responses are saved locally in your browser.
        </p>
      </div>
    </div>
  );
}
