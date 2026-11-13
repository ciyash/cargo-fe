import { HttpHeaders } from '@angular/common/http';

/** Build headers from the current session, including after a user switches accounts. */
export function authenticatedOptions(token: string | null): { headers: HttpHeaders } {
  let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);
  return { headers };
}
