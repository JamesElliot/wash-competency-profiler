import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { AssessmentSession, DomainScore, Response } from '../types';
import {
  loadSession,
  saveSession,
  generateSessionId,
} from '../lib/storage';

// ── State / Action types ─────────────────────────────────────────────────────

type State = AssessmentSession;

type Action =
  | { type: 'SET_PURPOSE'; payload: AssessmentSession['purpose'] }
  | { type: 'SET_DOMAINS'; payload: string[] }
  | { type: 'SET_RESPONSE'; payload: Response }
  | { type: 'CLEAR_RESPONSE'; payload: string }   // payload = competencyId
  | { type: 'SET_SCORES'; payload: DomainScore[] }
  | { type: 'RESET' };

// ── Helpers ──────────────────────────────────────────────────────────────────

function freshSession(): State {
  return {
    sessionId: generateSessionId(),
    startedAt: new Date().toISOString(),
    purpose: null,
    selectedDomainIds: [],
    responses: [],
    scores: null,
  };
}

// ── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PURPOSE':
      return { ...state, scores: null, purpose: action.payload };

    case 'SET_DOMAINS':
      return { ...state, scores: null, selectedDomainIds: action.payload };

    case 'SET_RESPONSE': {
      const idx = state.responses.findIndex(
        (r) => r.competencyId === action.payload.competencyId,
      );
      const responses =
        idx >= 0
          ? state.responses.map((r, i) => (i === idx ? action.payload : r))
          : [...state.responses, action.payload];
      return { ...state, scores: null, responses };
    }

    case 'CLEAR_RESPONSE':
      return {
        ...state,
        scores: null,
        responses: state.responses.filter((r) => r.competencyId !== action.payload),
      };

    case 'SET_SCORES':
      return { ...state, scores: action.payload };

    case 'RESET':
      return freshSession();
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

type ContextValue = {
  state: State;
  dispatch: React.Dispatch<Action>;
};

const AssessmentContext = createContext<ContextValue | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    return loadSession() ?? freshSession();
  });

  // Persist on every state change; RESET naturally overwrites with fresh state.
  useEffect(() => {
    saveSession(state);
  }, [state]);

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): ContextValue {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be called inside AssessmentProvider');
  return ctx;
}
