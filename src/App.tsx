import { Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentProvider } from './context/AssessmentContext';
import LandingPage from './pages/LandingPage';
import SetupPage from './pages/SetupPage';
import QuestionnairePage from './pages/QuestionnairePage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <AssessmentProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/assessment" element={<QuestionnairePage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AssessmentProvider>
  );
}
