import { DomesticPhoneDirective } from '../../shared/domestic-phone.directive';
import { citiesForBranches, branchesForCity, cityForBranch } from '../../service/branch-options';
import { LogisticsApi } from '../../logistics/logistics-api.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';
import { WORK_PERMISSIONS } from '../../service/roles';
import { HeaderComponent } from '../header/header.component';
import { CompanyLogoComponent } from '../../shared/company-logo/company-logo.component';
import { BillingComponent } from '../../shared/billing/billing.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/service/token.service';
@Component({standalone: true, selector: 'app-company-workspace', imports: [DomesticPhoneDirective, HeaderComponent, CompanyLogoComponent, BillingComponent, CommonModule, ReactiveFormsModule, RouterModule], templateUrl: './company-workspace.component.html',styleUrls:['./company-workspace.component.scss']})
export class CompanyWorkspaceComponent implements OnInit, OnDestroy {
  branchLabels:Record<string,string>={name:'Branch name',city:'City',location:'Area / location',address:'Address',phone:'Contact number',pincode:'Postal / PIN code',state:'State / region',country:'Country'};
  private accountSubscriptions:Subscription[]=[];
  branchTrack=(_:number,b:any)=>b._id;
  get cityChoices(){return citiesForBranches([...this.cities.map(city=>({city:city.cityName})),...this.branches]);}
  get accountBranches(){return branchesForCity(this.branches,this.form.value.branchCity);}
  updateAssignment(role:string){for(const key of ['branchCity','branchId']){const control=this.form.get(key);control?.setValidators(role==='company_admin'?[]:[Validators.required]);control?.updateValueAndValidity({emitEvent:false});}if(role==='company_admin')this.form.patchValue({branchCity:'',branchId:''});}
  section='overview';billing:any;payments:any[]=[];paying=false;paymentError='';private fragmentSubscription?:Subscription;
  readonly sections=[{id:'company-brand',label:'Company logo'},{id:'company-billing',label:'Subscription & payments'},{id:'company-cities',label:'Cities'},{id:'company-branches',label:'Branches'},{id:'company-team',label:'Admins & team'}];
  workPermissions=WORK_PERMISSIONS;
  setPermission(key:string,event:Event){const values:string[]=this.form.get('permissions')?.value||[];this.form.get('permissions')?.setValue((event.target as HTMLInputElement).checked?[...new Set([...values,key])]:values.filter(p=>p!==key));}
  readonly indianStates = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'].sort();
  get isIndianCity(){return (this.cityForm.value.country||'').trim().toLowerCase()==='india';}
  get hasLegacyState(){return !!this.cityForm.value.state&&!this.indianStates.includes(this.cityForm.value.state);}
  cities:any[]=[];editingCityId:string|null=null;citySaving=false;cityLoading=false;cityError='';
  cityForm=this.fb.group({cityName:['',[Validators.required,Validators.maxLength(100)]],state:['',[Validators.required,Validators.maxLength(100)]],country:['India',[Validators.required,Validators.maxLength(100)]]});
  staff: any[] = []; branches: any[] = []; loading = false; saving = false; branchSaving = false;
  editingStaffId:string|null=null;
  statusSavingId:string|null=null;
  editStaff(person:any){
    if(this.saving||this.statusSavingId)return;
    this.editingStaffId=person._id;this.error='';this.message='';
    this.form.controls.password.setValidators([Validators.minLength(8)]);
    const branchId=person.branchId?._id||person.branchId||'';
    this.form.reset({name:person.name||'',email:person.email||'',password:'',role:person.role,permissions:person.permissions||['bookings'],branchCity:cityForBranch(this.branches,branchId)||person.branchId?.city||'',branchId,username:person.username||'',phone:person.phone||''},{emitEvent:false});
    this.updateAssignment(person.role);this.form.controls.password.updateValueAndValidity();
    document.getElementById('company-team')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  cancelStaffEdit(){
    if(this.saving)return;
    this.editingStaffId=null;this.error='';
    this.form.controls.password.setValidators([Validators.required,Validators.minLength(8)]);
    this.form.reset({name:'',email:'',password:'',role:'company_admin',permissions:['bookings'],branchCity:'',branchId:'',username:'',phone:''});
  }
  toggleStaffBlocked(person:any){
    if(this.saving||this.statusSavingId)return;
    this.statusSavingId=person._id;this.listError='';this.message='';
    this.http.patch<any>(this.base+'/subadmin-auth/account-status/'+person._id,{isBlocked:!person.isBlocked},this.options()).subscribe({next:result=>{
      this.statusSavingId=null;this.staff=this.staff.map(row=>row._id===person._id?{...row,isBlocked:result.account.isBlocked}:row);this.message=result.message;
    },error:error=>{this.statusSavingId=null;this.listError=error.error?.message||'Could not update account status.';}});
  }
  error = ''; message = ''; listError = ''; branchError = '';
  companyId = this.token.getUser()?.company?._id || '';
  logoText = ''; savedLogoText = ''; brandingSaving = false; brandingError = '';
  companyName = this.token.getUser()?.company?.name || 'Your company';
  form = this.fb.group({name: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]], permissions: [['bookings']], role: ['company_admin', Validators.required], branchCity:[''], branchId: [''], username: [''], phone: ['']});
  branchForm = this.fb.group({name: ['', Validators.required], ownershipType:['own',Validators.required], branchType: ['main', Validators.required], cityId:['',Validators.required], city: ['', Validators.required], location: ['', Validators.required], address: ['', Validators.required], phone: ['', Validators.required], pincode: ['', Validators.required], state: ['', Validators.required], country: ['India', Validators.required]});
  constructor(private fb: FormBuilder, private http: HttpClient, public token: TokenService,public api:LogisticsApi,private route:ActivatedRoute) {}
  private base = environment.baseUrl.replace(/\/+$/, '');
  private options() { return {headers: new HttpHeaders({Authorization: 'Bearer ' + this.token.getToken()})}; }
  ngOnInit(){this.accountSubscriptions.push(this.branchForm.controls.cityId.valueChanges.subscribe(id=>this.syncBranchCity(id||'')),this.form.controls.branchCity.valueChanges.subscribe(()=>this.form.patchValue({branchId:''})),this.form.controls.role.valueChanges.subscribe(role=>this.updateAssignment(role||'company_admin')));this.updateAssignment(this.form.value.role||'company_admin');this.fragmentSubscription=this.route.fragment.subscribe(fragment=>{this.section=this.sections.some(s=>s.id===fragment)?fragment!:'overview';});this.loadStaff();this.loadBranches();this.loadCities();this.loadBranding();this.loadBilling();}
  ngOnDestroy(){this.fragmentSubscription?.unsubscribe();this.accountSubscriptions.forEach(s=>s.unsubscribe());}
  async loadBilling(){try{const [billing,payments]=await Promise.all([this.api.get('/billing/status'),this.api.get('/billing/history')]);this.billing=billing;this.payments=payments;}catch(e){this.paymentError=this.api.error(e);}}
  async purchase(){if(this.paying)return;this.paying=true;this.paymentError='';try{await this.api.pay('booking-pack');this.message='Payment verified. Company booking quota updated.';await this.loadBilling();}catch(e){this.paymentError=this.api.error(e);}finally{this.paying=false;}}
  async reconcile(orderId:string){if(this.paying)return;this.paying=true;this.paymentError='';try{await this.api.post('/billing/reconcile',{orderId});await this.loadBilling();}catch(e){this.paymentError=this.api.error(e);}finally{this.paying=false;}}
  loadBranding() {
    if (!this.companyId) return;
    this.http.get<any>(this.base + '/company/branding').subscribe({next: result => {this.logoText = result.logoText || result.name; this.savedLogoText = this.logoText; this.companyName = result.name;},error: () => this.brandingError = 'Could not load company branding.'});
  }
  setLogoText(event: Event) { this.logoText = (event.target as HTMLInputElement).value; }
  saveLogoText() {
    if (this.brandingSaving) return;
    this.brandingError = '';
    if (this.logoText.trim() && !/^[a-z]{2}$/i.test(this.logoText.trim())) { this.brandingError = 'Enter exactly two letters, or leave blank for company initials.'; return; }
    this.brandingSaving = true;
    this.http.patch<any>(this.base + '/company/update',{logoText:this.logoText.trim()},this.options()).subscribe({next: result => {this.brandingSaving = false;this.token.saveUser({...this.token.getUser(),role:'company_admin',company:result.company});this.savedLogoText = this.logoText.trim().toUpperCase();this.logoText = this.savedLogoText;this.message = 'Your company logo letters have been updated.';},error: err => {this.brandingSaving = false;this.brandingError = err.error?.message || 'Could not update logo text.';}});
  }
  loadStaff() {
    this.loading = true; this.listError = '';
    this.http.get<any[]>(this.base + '/subadmin-auth/subadmins', this.options()).subscribe({next: rows => { this.staff = rows; this.loading = false; }, error: err => { this.loading = false; if (err.status === 404) this.staff = []; else this.listError = 'Could not load staff. Please retry.'; }});
  }
  loadBranches() {
    this.branchError = '';
    this.http.get<any[]>(this.base + '/company/branches', this.options()).subscribe({next: rows => this.branches = rows, error: err => { if (err.status === 404) this.branches = []; else this.branchError = 'Could not load branches. Please retry.'; }});
  }
  createStaff() {
    if (this.saving) return;
    this.form.markAllAsTouched(); this.error = ''; this.message = '';
    if (this.form.invalid) { this.error = 'Complete the required account details. For Branch Admin or Staff, select a city and branch.'; return; }
    const value = this.form.getRawValue();
    if (value.role !== 'company_admin' && !value.branchId) { this.error = 'Select a branch for Branch Admin or Staff. Open Branches to create a branch first.'; return; }
    this.saving = true;
    const editing=this.editingStaffId;
    const payload:any = {...value, permissions:value.role==='staff'?value.permissions:undefined, branchId: value.role === 'company_admin' ? null : value.branchId};
    if(editing&&!payload.password)delete payload.password;
    const request=editing?this.http.patch(this.base+'/subadmin-auth/update-profile/'+editing,payload,this.options()):this.http.post(this.base+'/subadmin-auth/signup-by-company',payload,this.options());
    request.subscribe({next: () => {
      this.saving = false;this.cancelStaffEdit();this.message = editing?'Team account updated.':'Account created. Staff can now sign in using their email and password.';this.loadStaff();
    }, error: err => { this.saving = false; this.error = err.error?.message || 'Could not save account. Please try again.'; }});
  }
  loadCities(){this.cityLoading=true;this.cityError='';this.http.get<any[]>(this.base+'/multi-router/cities',this.options()).subscribe({next:rows=>{this.cities=rows;this.cityLoading=false;if(this.branchForm.value.cityId)this.syncBranchCity(this.branchForm.value.cityId);},error:()=>{this.cityLoading=false;this.cityError='Could not load company cities. Please retry.';}});}
  syncBranchCity(id:string){const city=this.cities.find(c=>String(c._id)===String(id));this.branchForm.patchValue({city:city?.cityName||'',state:city?.state||'',country:city?.country||'India'},{emitEvent:false});}
  editCity(city:any){if(this.citySaving)return;this.editingCityId=city._id;this.cityError='';this.message='';this.cityForm.reset({cityName:city.cityName,state:city.state,country:city.country||'India'});document.getElementById('company-cities')?.scrollIntoView({behavior:'smooth',block:'start'});}
  cancelCityEdit(){if(this.citySaving)return;this.editingCityId=null;this.cityError='';this.cityForm.reset({cityName:'',state:'',country:'India'});}
  saveCity(){
    if(this.citySaving)return;this.cityForm.markAllAsTouched();this.cityError='';
    if(this.cityForm.invalid){this.cityError='Enter city name, state and country.';return;}
    this.citySaving=true;const editingId=this.editingCityId;
    const request=editingId?this.http.patch<any>(this.base+'/multi-router/cities/'+editingId,this.cityForm.getRawValue(),this.options()):this.http.post<any>(this.base+'/multi-router/cities',this.cityForm.getRawValue(),this.options());
    request.subscribe({next:result=>{
      this.citySaving=false;const city=result.city||result.data;
      this.cities=[...this.cities.filter(c=>c._id!==city._id),city].sort((a,b)=>a.cityName.localeCompare(b.cityName));
      if(editingId){if(this.branchForm.value.cityId===city._id)this.syncBranchCity(city._id);this.loadBranches();this.message='City updated. Linked branch city details were updated too.';}
      else{this.branchForm.patchValue({cityId:city._id});this.message='City added. Select Create branch to add a branch in this city.';}
      this.editingCityId=null;this.cityForm.reset({cityName:'',state:'',country:'India'});
    },error:err=>{this.citySaving=false;this.cityError=err.error?.message||(editingId?'Could not update city.':'Could not add city.');}});
  }

  startBranch(city:any){this.branchForm.patchValue({cityId:city._id});window.location.hash='company-branches';}
  createBranch() {
    if (this.branchSaving) return;
    this.branchForm.markAllAsTouched(); this.branchError = '';
    if (this.branchForm.invalid || !this.cities.some(c=>String(c._id)===String(this.branchForm.value.cityId))) { this.branchError = 'Complete all required branch fields.'; return; }
    this.branchSaving = true;
    this.http.post<any>(this.base + '/company/branches', this.branchForm.getRawValue(), this.options()).subscribe({next: res => {
      this.branchSaving = false; this.branchForm.reset({ownershipType:'own',branchType:'main',cityId:'',city:'',state:'',country:'India'}); this.branches=[...this.branches.filter(b=>b._id!==res.data._id),res.data];this.loadBranches();this.form.patchValue({branchCity:cityForBranch(this.branches,res.data._id),branchId:res.data._id}); this.message = 'Branch created. You can assign it to Branch Admin or Staff.';
    }, error: err => { this.branchSaving = false; this.branchError = err.error?.message || 'Could not create branch.'; }});
  }
}
