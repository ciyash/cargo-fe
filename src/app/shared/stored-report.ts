/** Reports can be opened directly or refreshed with missing/corrupt cached data. */
export function readStoredReport(key: string): any {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value !== null && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}
