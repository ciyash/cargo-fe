import { readStoredReport } from './stored-report';

describe('Stored report recovery', () => {
  it('returns no report for missing, corrupt, or primitive values', () => {
    const read = spyOn(localStorage, 'getItem');
    for (const value of [null, '{bad', 'null', '42', '"text"']) {
      read.and.returnValue(value); expect(readStoredReport('report')).toBeNull();
    }
  });
  it('preserves report records', () => {
    spyOn(localStorage, 'getItem').and.returnValue('{"data":{"paid":{"bookings":[1]}}}');
    expect(readStoredReport('report').data.paid.bookings).toEqual([1]);
  });
});
