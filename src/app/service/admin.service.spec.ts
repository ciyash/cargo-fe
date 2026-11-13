import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminService } from './admin.service';
import { TokenService } from './token.service';
import { environment } from 'src/environments/environment';
describe('Admin API contracts',()=>{
 let service:AdminService;let http:HttpTestingController;
 const base=environment.baseUrl.replace(/\/+$/,'');
 beforeEach(()=>{TestBed.configureTestingModule({imports:[HttpClientTestingModule,RouterTestingModule],providers:[{provide:TokenService,useValue:{getToken:()=> 'test-token'}}]});service=TestBed.inject(AdminService);http=TestBed.inject(HttpTestingController);});
 afterEach(()=>http.verify());
 it('updates the current admin through the registered self-profile route',()=>{
  service.UpdateAdminProfile({companyName:'Company',name:'Admin',username:'admin',location:'Office',address:'Address',phone:'9999999999',email:'admin@example.test',branchId:''}).subscribe();
  const req=http.expectOne(base+'/subadmin-auth/admin-profile');expect(req.request.method).toBe('PATCH');expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');req.flush({});
 });
 it('creates Company Admin with the canonical role through company signup',()=>{
  service.createAdmin({name:'Admin',username:'admin',branchId:'',location:'',phone:9999999999,email:'admin@example.test',password:'example-password',documents:'',role:'company_admin'}).subscribe();
  const req=http.expectOne(base+'/subadmin-auth/signup-by-company');expect(req.request.body.role).toBe('company_admin');req.flush({});
 });
});
