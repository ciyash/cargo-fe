import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BranchService } from './branch.service';
import { TokenService } from './token.service';
import { environment } from 'src/environments/environment';
describe('Branch API contracts',()=>{
 let service:BranchService;let http:HttpTestingController;
 const base=environment.baseUrl.replace(/\/+$/,'');
 beforeEach(()=>{TestBed.configureTestingModule({imports:[HttpClientTestingModule,RouterTestingModule],providers:[{provide:TokenService,useValue:{getToken:()=> 'test-token'}}]});service=TestBed.inject(BranchService);http=TestBed.inject(HttpTestingController);});
 afterEach(()=>http.verify());
 it('filters branch unloading through the registered unload endpoint for all roles',()=>{
  const payload={fromLoadingDate:'2026-11-01',toLoadingDate:'2026-11-13',fromBranch:'HYD',toBranch:'VJA'};
  service.postBranchtobranchUnLoadingFilter(payload).subscribe();
  const req=http.expectOne(base+'/parcel-unloading/branch-to-branch-unload');expect(req.request.method).toBe('POST');expect(req.request.body).toEqual(payload);req.flush({});
 });
});
