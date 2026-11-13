import { DomesticPhoneDirective } from '../shared/domestic-phone.directive';
import { citiesForBranches, branchesForCity, cityForBranch } from '../service/branch-options';
import { WORK_PERMISSIONS, ROLE_OPTIONS, roleLabel } from '../service/roles';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LogisticsApi } from './logistics-api.service';
import { LogisticsShellComponent } from './logistics-shell.component';
@Component({standalone:true,selector:'app-logistics-workspace',imports: [DomesticPhoneDirective, CommonModule,FormsModule,RouterModule,LogisticsShellComponent],templateUrl:'./workspace.component.html',styleUrls:['./workspace.component.scss']})
export class LogisticsWorkspaceComponent implements OnInit,OnDestroy {
  workPermissions=WORK_PERMISSIONS;roleOptions=ROLE_OPTIONS;roleLabel=roleLabel;editingStaff:any;
  context:any;section='dashboard';busy=false;loading=false;error='';message='';rows:any[]=[];totals:any={};pagination:any={page:1,pages:0};staff:any[]=[];ledger:any[]=[];payments:any[]=[];selected:any;connectionKey='';
  settings:any={name:'',operatingCategories:'both'};
  branch:any={name:'',branchType:'normal',ownershipType:'own',cityId:'',city:'',location:'',address:'',phone:'',pincode:'',state:'',country:'India',postalCodes:'',courierPickupLocation:'',delhiveryPickupLocation:''};
  member:any={name:'',email:'',password:'',role:'staff',branchCity:'',branchId:'',permissions:['bookings']};allocation:any={branchId:'',bookings:100,amount:0,note:'',requestKey:crypto.randomUUID()};
  connection:any={apiToken:'',environment:'staging',clientName:'',sellerGst:'',accountLabel:'',testPin:''};pickup:any={date:'',time:'10:00'};filter:any={category:'',fulfilment:'',provider:'',status:'',branch:'',search:'',from:'',to:'',page:1};operation:any={action:'load',vehicle:'',driver:'',receiver:'',phone:'',amount:0};
  private subscription?:Subscription;private loadId=0;
  constructor(public api:LogisticsApi,private route:ActivatedRoute){}
  ngOnInit(){this.subscription=this.route.paramMap.subscribe(params=>{this.section=params.get('section')||this.route.snapshot.data['section']||'dashboard';this.selected=null;this.load();});}
  ngOnDestroy(){this.subscription?.unsubscribe();}
  async load(){const id=++this.loadId;this.loading=true;this.error='';try{const context=await this.api.context();if(id!==this.loadId)return;this.context=context;const requestedBranch=this.route.snapshot.queryParamMap.get('branch');if(requestedBranch&&!this.allocation.branchId&&context.branches.some((b:any)=>b._id===requestedBranch&&b.ownershipType==='franchise'))this.allocation.branchId=requestedBranch;if(!context.canManage&&context.canManageTeam){this.member.role='staff';this.member.branchCity=cityForBranch(context.branches,context.user.branchObjectId);this.member.branchId=context.user.branchObjectId;}this.settings={name:context.company.name,operatingCategories:context.company.operatingCategories};if(['dashboard','bookings','operations','reports'].includes(this.section))await this.loadRows();if(this.section==='team'&&(context.canManageTeam||context.canManage))this.staff=await this.api.get('/workspace/staff');if(this.section==='allowance'||this.section==='reports')this.ledger=await this.api.get('/workspace/quota-ledger');if(this.section==='subscription'&&context.canPay)this.payments=await this.api.get('/billing/history');}catch(e){this.error=this.api.error(e);}finally{if(id===this.loadId)this.loading=false;}}
  async act(work:()=>Promise<any>,message:string){if(this.busy)return;this.busy=true;this.error='';this.message='';try{await work();this.message=message;await this.load();}catch(e){this.error=this.api.error(e);}finally{this.busy=false;}}
  async loadRows(page=1){this.filter.page=page;const query={...this.filter,...(this.section==='operations'?{fulfilment:'own'}:{}),limit:25};const r=await this.api.get('/workspace/bookings',query);this.rows=r.rows;this.totals=r.totals;this.pagination=r.pagination;}
  async changePage(page:number){if(this.busy)return;this.busy=true;this.error='';try{await this.loadRows(page);}catch(e){this.error=this.api.error(e);}finally{this.busy=false;}}
  apply(){this.act(()=>this.loadRows(),'Report filters applied.');}
  saveSettings(){this.act(()=>this.api.patch('/workspace/company',this.settings),'Company offering updated for every branch.');}
  selectBranchCity(){const city=this.context?.cities?.find((c:any)=>String(c._id)===String(this.branch.cityId));Object.assign(this.branch,{city:city?.cityName||'',state:city?.state||'',country:city?.country||'India'});}
  createBranch(){this.act(async()=>{await this.api.post('/workspace/branches',{...this.branch,servicePostalCodes:this.branch.postalCodes.split(',').map((s:string)=>s.trim()).filter(Boolean)});this.branch.name='';},'Branch created. Add a staff account and, for a franchise, allocate bookings below.');}
  allocate(){if(this.allocationOverLimit){this.error=this.allocationLimitMessage;return;}this.act(async()=>{await this.api.post('/workspace/branches/'+this.allocation.branchId+'/allowance',this.allocation);this.allocation.requestKey=crypto.randomUUID();},'Franchise allowance added. Company quota was not deducted.');}
  createMember(){this.act(async()=>{await this.api.post('/workspace/staff',{...this.member,permissions:this.member.role==='staff'?this.member.permissions:undefined,branchId:['company_admin','superadmin'].includes(this.member.role)?null:this.member.branchId});this.member.password='';},'Staff account created.');}
  can(permission:string){return !!this.context?.canManage||!!this.context?.user?.permissions?.includes(permission);}
  get teamBranches(){return (this.context?.branches||[]).filter((b:any)=>this.context?.canManage||String(b._id)===String(this.context?.user?.branchObjectId));}
  roleTrack=(_:number,r:any)=>r.value;
  branchTrack=(_:number,b:any)=>b._id;
  get teamCities(){return citiesForBranches(this.teamBranches);}
  get memberBranches(){return branchesForCity(this.teamBranches,this.member.branchCity);}
  get accessBranches(){return branchesForCity(this.teamBranches,this.editingStaff?.branchCity);}
  resetCity(target:any){target.branchId='';}
  get teamRoles(){return this.context?.roles||(this.context?.canManage?this.roleOptions:this.roleOptions.filter(r=>r.value==='staff'));}
  get assignablePermissions(){return this.workPermissions.filter(p=>this.can(p.value));}
  setPermission(target:any,key:string,event:Event){const current:string[]=target.permissions||[];target.permissions=(event.target as HTMLInputElement).checked?[...new Set([...current,key])]:current.filter(p=>p!==key);}
  editAccess(u:any){this.editingStaff={_id:u._id,name:u.name,role:u.role,branchCity:cityForBranch(this.teamBranches,u.branchId?._id||u.branchId),branchId:u.branchId?._id||'',permissions:[...(u.permissions||[])]};}
  saveAccess(){const u=this.editingStaff;this.act(async()=>{await this.api.patch('/workspace/staff/'+u._id+'/access',{...u,permissions:u.role==='staff'?u.permissions:undefined});this.editingStaff=null;},'Account role and work permissions updated.');}
  pay(purpose:'booking-pack'|'service',key?:string){this.act(()=>this.api.pay(purpose,key),purpose==='service'?'Service enabled. Connect its API account next.':'Verified payment added company booking quota.');}
  reconcilePayment(orderId:string){this.act(()=>this.api.post('/billing/reconcile',{orderId}),'Payment status checked.');}
  connect(){this.act(async()=>{await this.api.post('/workspace/services/'+this.connectionKey+'/connect',this.connection);this.connection.apiToken='';this.connectionKey='';},'Courier connected to your company account.');}
  disconnect(key:string){this.act(()=>this.api.post('/workspace/services/'+key+'/disconnect'),'Connection removed; company entitlement retained.');}
  async open(row:any){this.error='';try{this.selected=await this.api.get('/workspace/bookings/'+row._id);this.operation={action:row.bookingStatus===0?'load':row.bookingStatus===1?(row.shipmentStage==='In transit'?'unload':'dispatch'):'deliver',vehicle:'',driver:'',receiver:row.receiverName,phone:String(row.receiverMobile||''),amount:row.bookingType==='toPay'?row.grandTotal:0};this.operation.action=this.operationActions[0]?.value||this.operation.action;}catch(e){this.error=this.api.error(e);}}
  shipmentAction(action:string){if(!this.selected||this.busy)return;const id=this.selected._id;this.act(async()=>{await this.api.post('/workspace/bookings/'+id+'/'+action);this.selected=await this.api.get('/workspace/bookings/'+id);},'Shipment updated. Pending carrier actions need a subsequent status check.');}
  operate(){const id=this.selected._id;this.act(async()=>{await this.api.post('/workspace/bookings/'+id+'/operation',this.operation);this.selected=await this.api.get('/workspace/bookings/'+id);},'Operation recorded.');}
  savePickup(branch:any){this.act(()=>this.api.patch('/workspace/branches/'+branch._id+'/courier',{delhiveryPickupLocation:branch.delhiveryPickupLocation}),'Delhivery pickup mapping saved for this branch.');}
  async schedulePickup(){if(!this.selected||this.busy)return;if(!this.pickup.date||!this.pickup.time){this.error='Choose a pickup date and time';return;}const id=this.selected._id;this.act(async()=>{await this.api.post('/workspace/bookings/'+id+'/pickup',{date:this.pickup.date,time:this.pickup.time.length===5?this.pickup.time+':00':this.pickup.time});this.selected=await this.api.get('/workspace/bookings/'+id);},'Pickup request sent. Check Delhivery One for its schedule.');}
  async label(){this.error='';const preview=window.open('','_blank');if(preview)preview.opener=null;try{const r=await this.api.post('/workspace/bookings/'+this.selected._id+'/label');if(!preview)throw Error('Allow popups to open the shipping label');if(r.html){preview.document.open();preview.document.write(r.html);preview.document.close();}else if(r.url?.startsWith('https://'))preview.location.href=r.url;else throw Error('Label not available');}catch(e){preview?.close();this.error=this.api.error(e);}}
  async document(d:any){try{await this.api.document(this.selected._id,d);}catch(e){this.error=this.api.error(e);}}
  get operationActions(){const b=this.selected;if(!b)return [];const manager=this.context?.canManage,branch=this.context?.user?.branchId;if((manager||b.pickUpBranch===branch)&&this.can('loading')){if(b.bookingStatus===0)return [{value:'load',label:'Load'}];if(b.bookingStatus===1&&b.shipmentStage!=='In transit')return [{value:'dispatch',label:'Dispatch'}];}if((manager||b.dropBranch===branch)&&this.can('delivery')){if(b.bookingStatus===1)return [{value:'unload',label:'Unload'}];if(b.bookingStatus===2)return [{value:'deliver',label:'Deliver'}];}return [];}
  status(b:any){return b.bookingStatus===5?'Cancelled':b.provider?.cancelPending?'Cancellation pending':b.confirmationStatus==='pending'?'Confirmation pending':b.confirmationStatus==='failed'?'Booking failed':b.shipmentStage||['Booked','Loaded','Unloaded','Missing','Delivered','Cancelled'][b.bookingStatus];}
  branchName(id:string){return this.context?.branches?.find((b:any)=>String(b._id)===String(id))?.name||id;}
  quota(b:any){return Math.max(0,(b.franchiseQuota?.allocated||0)-(b.franchiseQuota?.used||0)-(b.franchiseQuota?.held||0));}
  get outstandingAllowances():number{return this.franchises.reduce((sum:number,b:any)=>sum+this.quota(b),0);}
  get allocatableBookings():number{return Math.max(0,Number(this.context?.quota?.available||0)-this.outstandingAllowances);}
  get allocationOverLimit():boolean{return Number(this.allocation.bookings)>this.allocatableBookings;}
  get allocationLimitMessage():string{return `Your company has ${this.context?.quota?.available||0} available bookings. ${this.outstandingAllowances} are already allocated to franchises. You can allocate ${this.allocatableBookings} more. Purchase a booking pack for additional bookings.`;}
  get franchises(){return this.context?.branches?.filter((b:any)=>b.ownershipType==='franchise')||[];}
  canCancel(b:any){return this.can('bookings')&&(this.context?.canManage||b.pickUpBranch===this.context?.user?.branchId)&&b.bookingStatus===0&&b.confirmationStatus!=='failed'&&!b.provider?.pickedUp;}
  print(){window.print();}
  async export(){if(this.busy)return;this.busy=true;this.error='';try{const list:any[]=[];for(let page=1;;page++){const r=await this.api.get('/workspace/bookings',{...this.filter,page,limit:100});list.push(...r.rows);if(page>=r.pagination.pages)break;if(page>=1000)throw Error('Narrow the report range before exporting more than 100,000 records.');}const rows=[['Company',this.context.company.name,'Generated',new Date().toISOString()],['Date basis','Booking date','From',this.filter.from,'To',this.filter.to],['GRN','LR','Category','Fulfilment','Courier','AWB','Branch','Destination','Status','Freight INR'],...list.map(b=>[b.grnNo,b.lrNumber,b.category,b.fulfilment,b.provider?.courierName||'',b.provider?.awb||'',b.pickUpBranchname,b.toCity,this.status(b),b.grandTotal])];const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='company-booking-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){this.error=this.api.error(e);}finally{this.busy=false;}}
}
