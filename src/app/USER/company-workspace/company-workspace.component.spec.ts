import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyWorkspaceComponent } from './company-workspace.component';
import { environment } from 'src/environments/environment';
describe('Company team form API contract',()=>{
 let component:CompanyWorkspaceComponent;let http:HttpTestingController;
 const base=environment.baseUrl.replace(/\/+$/,'');
 beforeEach(()=>{
  TestBed.configureTestingModule({imports:[HttpClientTestingModule]});
  component=new CompanyWorkspaceComponent(new FormBuilder(),TestBed.inject(HttpClient),{getToken:()=> 'company-session',getUser:()=>({company:{_id:'company',name:'Company'}})} as any,{} as any,{} as any);
  http=TestBed.inject(HttpTestingController);spyOn(component,'loadStaff');
 });
 afterEach(()=>http.verify());
 it('creates Company Admin without requiring a branch and sends company_admin exactly',()=>{
  component.form.patchValue({name:'Company Admin',email:'admin@example.test',password:'example-password',role:'company_admin'});
  component.updateAssignment('company_admin');component.createStaff();
  const req=http.expectOne(base+'/subadmin-auth/signup-by-company');
  expect(req.request.method).toBe('POST');expect(req.request.body.role).toBe('company_admin');expect(req.request.body.branchId).toBeNull();
  expect(req.request.headers.get('Authorization')).toBe('Bearer company-session');req.flush({});expect(component.message).toContain('Account created');
 });
 it('requires city and branch for Branch Admin without creating an account',()=>{
  component.form.patchValue({name:'Branch Admin',email:'branch@example.test',password:'example-password',role:'admin'});
  component.updateAssignment('admin');component.createStaff();
  http.expectNone(base+'/subadmin-auth/signup-by-company');expect(component.form.invalid).toBeTrue();
 });
});
