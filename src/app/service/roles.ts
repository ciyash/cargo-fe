export type Role = 'company_admin'|'admin'|'staff';
export const ROLE_OPTIONS=[{value:'company_admin',label:'Company Admin'},{value:'admin',label:'Branch Admin'},{value:'staff',label:'Staff'}];
export const WORK_PERMISSIONS=[{value:'bookings',label:'Bookings & cancellation'},{value:'loading',label:'Loading & dispatch'},{value:'delivery',label:'Unloading & delivery'},{value:'accounts',label:'Accounts & collections'},{value:'reports',label:'Reports'}];
const aliases:Record<string,Role>={company:'company_admin',superadmin:'company_admin',company_admin:'company_admin',admin:'admin',branch_admin:'admin',subadmin:'admin',staff:'staff',employee:'staff',accountant:'staff',driver:'staff',superviser:'staff',supervisor:'staff'};
export const normalizeRole=(role:string):Role|null=>Object.prototype.hasOwnProperty.call(aliases,role)?aliases[role]:null;
export const roleLabel=(role:string)=>ROLE_OPTIONS.find(r=>r.value===normalizeRole(role))?.label||'Staff';
export function permissionsFor(user:any):string[]{
 if(normalizeRole(user?.role)==='company_admin')return [...WORK_PERMISSIONS.map(p=>p.value),'team','settings','subscription','services','branches'];
 if(user?.role==='employee'||user?.role==='staff')return WORK_PERMISSIONS.map(p=>p.value);
 if(Array.isArray(user?.permissions))return user.permissions;
 if(normalizeRole(user?.role)==='admin')return [...WORK_PERMISSIONS.map(p=>p.value),'team'];
 if(user?.role==='accountant')return ['accounts','reports'];
 if(user?.role==='driver')return ['delivery'];
 if(['superviser','supervisor'].includes(user?.role))return ['loading','delivery','reports'];
 return ['bookings','loading','delivery','reports'];
}
export function routePermission(path:string):string|null{
 const p=path.toLowerCase().split('?')[0];
 if(p==='/franchise-allowance')return 'reports';
 if(p==='/branch-staff')return 'team';
 if(p==='/courier-services')return null;
 if(['/login','/clogin','/signup','/profile','/adminprofile','/aprofile','/dashboard','/workspace/dashboard'].includes(p))return null;
 if(/createemployee|workspace\/team/.test(p))return 'team';
 if(/createbranch|workspace\/branches/.test(p))return 'branches';
 if(/create-admin|workspace\/company|createcity|createvehicle|adddispatch|addextra|addpackage/.test(p))return 'settings';
 if(/subscription/.test(p))return 'subscription';
 if(/workspace\/services/.test(p))return null;
 if(/workspace\/allowance/.test(p))return 'reports';
 if(/cfmaster|voucher|collection|consolidat|account/.test(p))return 'accounts';
 if(/report|stock|summary|memo|luggage|todaybooking|parcelstatusdate|datedifferent/.test(p))return 'reports';
 if(/unload|deliver/.test(p))return 'delivery';
 if(/loading|parcel-branch|branch-loading|workspace\/operations/.test(p))return 'loading';
 if(/workspace\/bookings|status|grn|gnr|print/.test(p))return 'shipment-read';
 if(/booking|cancel/.test(p))return 'bookings';
 return null;
}
