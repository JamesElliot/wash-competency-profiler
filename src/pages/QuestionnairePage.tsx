import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { COMPETENCIES, getDomainById } from '../data/competencies';
import { scoreAllDomains } from '../lib/ScoringEngine';
import ProgressBar from '../components/ProgressBar';
import Questionnaire from '../components/Questionnaire';

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessment();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Guard: no domains selected → back to setup
  useEffect(() => {
    if (state.selectedDomainIds.length === 0) {
      navigate('/setup', { replace: true });
    }
  }, [state.selectedDomainIds, navigate]);

  if (state.selectedDomainIds.length === 0) return null;

  const domainIds = state.selectedDomainIds;
  const currentDomainId = domainIds[currentIndex]!;
  const domainMeta = getDomainById(currentDomainId);
  const items = COMPETENCIES.filter((c) => c.domainId === currentDomainId);

  function handleNext() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentIndex((i) => i + 1);
  }

  function handlePrev() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentIndex((i) => i - 1);
  }

  function handleFinish() {
    const scores = scoreAllDomains(domainIds, COMPETENCIES, state.responses);
    dispatch({ type: 'SET_SCORES', payload: scores });
    navigate('/results');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky progress bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => {
              if (state.responses.length === 0 || confirm('Go back to setup? Your responses are saved and you can continue later.')) {
                navigate('/setup');
              }
            }}
            className="text-gray-400 hover:text-primary-600 transition-colors flex items-center gap-1 text-xs font-medium flex-shrink-0"
            aria-label="Back to setup"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Setup
          </button>
          <div className="flex-1">
            <ProgressBar
              current={currentIndex + 1}
              total={domainIds.length}
              domainLabel={domainMeta?.label ?? currentDomainId}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* key forces remount (and local skip state reset) on domain change */}
        <Questionnaire
          key={currentDomainId}
          items={items}
          domainLabel={domainMeta?.label ?? currentDomainId}
          isFirst={currentIndex === 0}
          isLast={currentIndex === domainIds.length - 1}
          onPrev={handlePrev}
          onNext={handleNext}
          onFinish={handleFinish}
        />
      </div>
    </div>
  );
}
