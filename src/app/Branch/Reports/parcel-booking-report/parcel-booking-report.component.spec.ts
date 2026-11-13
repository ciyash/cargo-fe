import { of } from 'rxjs';
import { Router } from '@angular/router';
import { BranchService } from 'src/app/service/branch.service';
import { ParcelBookingReportComponent } from './parcel-booking-report.component';

describe('Parcel booking report recovery', () => {
  it('opens safely without cached report data or with corrupt JSON', () => {
    const read = spyOn(localStorage, 'getItem');
    const api = {GetProfileData: () => of({})} as BranchService;
    const router = {getCurrentNavigation: () => null} as unknown as Router;
    for (const value of [null, '{broken']) {
      read.and.returnValue(value);
      const component = new ParcelBookingReportComponent(router, api);
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.data).toEqual({}); expect(component.data1).toEqual({});
    }
  });
});
