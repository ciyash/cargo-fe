import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { ReportInterceptor } from './report.interceptor';

describe('Report pagination', () => {
  let client: HttpClient; let http: HttpTestingController;
  const base = environment.baseUrl.replace(/\/+$/, '');
  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule], providers: [
      {provide: HTTP_INTERCEPTORS, useClass: ReportInterceptor, multi: true},
    ]});
    client = TestBed.inject(HttpClient); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('matches actual API URLs and merges all report pages', () => {
    let result: any;
    client.post(base + '/booking/parcel-booking-report', {}).subscribe(body => result = body);
    http.expectOne(r => r.params.get('page') === '1').flush({data: {paid: {bookings: [1], total: 30}}, pagination: {page: 1, hasNextPage: true, nextPage: 2}});
    expect(result).toBeUndefined();
    http.expectOne(r => r.params.get('page') === '2').flush({data: {paid: {bookings: [2], total: 30}}, pagination: {page: 2, hasNextPage: false}});
    expect(result.data.paid.bookings).toEqual([1, 2]); expect(result.data.paid.total).toBe(30);
  });
  it('preserves explicitly paginated consumers', () => {
    let result: any;
    client.get(base + '/booking/parcel-booking-report', {params: {page: '3'}}).subscribe(body => result = body);
    http.expectOne(r => r.params.get('page') === '3').flush({data: [], pagination: {hasNextPage: true, nextPage: 4}});
    expect(result.pagination.nextPage).toBe(4);
  });
  it('returns raw arrays for legacy list consumers', () => {
    let result: any;
    client.post(base + '/parcel-loading/parcel-loding-load', {}).subscribe(body => result = body);
    http.expectOne(r => r.params.get('page') === '1').flush({data: [1], pagination: {page: 1, hasNextPage: true, nextPage: 2}});
    http.expectOne(r => r.params.get('page') === '2').flush({data: [2], pagination: {page: 2, hasNextPage: false}});
    expect(result).toEqual([1, 2]);
  });
  it('merges consolidated delivery details along with booking types', () => {
    let result: any;
    client.post(base + '/booking/consolidated-report-branch', {}).subscribe(body => result = body);
    http.expectOne(r => r.params.get('page') === '1').flush({BookingTypes: {paid: [1]}, deliverToPayDetails: [3], pagination: {page: 1, hasNextPage: true, nextPage: 2}});
    http.expectOne(r => r.params.get('page') === '2').flush({BookingTypes: {paid: [2]}, deliverToPayDetails: [4]});
    expect(result.BookingTypes.paid).toEqual([1, 2]); expect(result.deliverToPayDetails).toEqual([3, 4]);
  });
  it('fails on a repeated section page even without top-level page metadata', () => {
    let error: any;
    client.get(base + '/booking/parcel-booking-report').subscribe({error: e => error = e});
    http.expectOne(r => r.params.get('page') === '1').flush({data: {}, pagination: {sections: {paid: {hasNextPage: true, nextPage: 1}}}});
    expect(error.message).toContain('did not advance');
  });
  it('reports malformed pagination instead of silently truncating results', () => {
    let error: any;
    client.get(base + '/booking/parcel-booking-report').subscribe({error: e => error = e});
    http.expectOne(r => r.params.get('page') === '1').flush({data: {}, pagination: {hasNextPage: true, nextPage: '2'}});
    expect(error.message).toContain('did not advance');
  });
});
