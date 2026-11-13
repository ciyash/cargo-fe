import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';
describe('Login API contract',()=>{
 let service:AuthService;let http:HttpTestingController;
 const base=environment.baseUrl.replace(/\/+$/,'');
 beforeEach(()=>{TestBed.configureTestingModule({imports:[HttpClientTestingModule]});service=TestBed.inject(AuthService);http=TestBed.inject(HttpTestingController);});
 afterEach(()=>http.verify());
 it('uses team login with trimmed identifier, unchanged password and optional company scope',()=>{
  service.login(' admin@example.test ',' password ','company-id').subscribe();
  const req=http.expectOne(base+'/subadmin-auth/login');
  expect(req.request.method).toBe('POST');expect(req.request.body).toEqual({identifier:'admin@example.test',password:' password ',companyId:'company-id'});req.flush({});
 });
 it('keeps Company login separate from team login',()=>{
  service.Companylogin({email:'company@example.test',password:'example-password'}).subscribe();
  const req=http.expectOne(base+'/company/login');expect(req.request.method).toBe('POST');req.flush({});
 });
});
