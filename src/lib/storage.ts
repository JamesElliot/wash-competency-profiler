import type { AssessmentSession } from '../types';

const SESSION_KEY = 'wash_profiler_session';

export function saveSession(session: AssessmentSession): void {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() }),
  );
}

export function loadSession(): AssessmentSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return migrateSession(JSON.parse(raw) as Partial<AssessmentSession>);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function migrateSession(session: Partial<AssessmentSession>): AssessmentSession {
  const startedAt = session.startedAt ?? new Date().toISOString();

  return {
    sessionId: session.sessionId ?? generateSessionId(),
    startedAt,
    updatedAt: session.updatedAt ?? startedAt,
    purpose: session.purpose ?? null,
    selectedDomainIds: session.selectedDomainIds ?? [],
    responses: (session.responses ?? []).map((response) => {
      if (response.status) return response;

      const hasBothRatings =
        response.competence !== null &&
        response.competence !== undefined &&
        response.importance !== null &&
        response.importance !== undefined;
      const hasNoRatings =
        (response.competence === null || response.competence === undefined) &&
        (response.importance === null || response.importance === undefined);

      return {
        competencyId: response.competencyId,
        competence: response.competence ?? null,
        importance: response.importance ?? null,
        status: hasBothRatings
          ? 'answered'
          : hasNoRatings
            ? 'not_applicable'
            : 'unanswered',
        note: response.note,
      };
    }),
    generalDevelopmentNotes: session.generalDevelopmentNotes ?? '',
    scores: null,
  };
}
