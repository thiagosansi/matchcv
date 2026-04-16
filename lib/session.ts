export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('matchcv_session_id');

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('matchcv_session_id', sessionId);
  }

  return sessionId;
}
