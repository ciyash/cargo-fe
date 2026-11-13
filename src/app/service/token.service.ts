import { normalizeRole, roleLabel, permissionsFor, routePermission } from './roles';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private user: any | null = null;

  constructor(private router: Router) {
    this.getUser(); // Load user if stored (optional)
  }

  public saveToken(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);

  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public saveUser(user: any): void {
    user = {...user, roleVersion: 2};
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.user = user;
  }

  public getUser(): any {
    try {
      this.user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      if(this.user && this.user.roleVersion !== 2){
        const legacy:Record<string,string>={admin:'company_admin',superadmin:'company_admin',subadmin:'admin',branch_admin:'admin',employee:'staff',company:'company_admin'};
        this.user={...this.user,role:legacy[this.user.role]||this.user.role,roleVersion:2};
        localStorage.setItem(USER_KEY,JSON.stringify(this.user));
      }

    } catch (error) {
      console.error('Invalid JSON format in localStorage:', error);
      this.user = null;
    }
    return this.user;
  }

  public getRole(): string | null {
    const user = this.getUser();
    return user ? normalizeRole(user.role) : null;
  }

  public roleLabel(role:string):string { return roleLabel(role); }
  public permissions():string[] { return permissionsFor(this.getUser()); }
  public can(permission:string):boolean { return this.permissions().includes(permission); }
  public canAccessRoute(path:string):boolean {
    if(['/dashboard','/employee-dashboard','/workspace/dashboard'].includes(path.split('?')[0]))return ['company_admin','admin'].includes(this.getRole() || '');
    if(this.isAdmin())return true;
    if(path.startsWith('/workspace/operations'))return this.can('loading')||this.can('delivery');
    const required=routePermission(path);
    return !required || (required==='shipment-read' ? ['bookings','loading','delivery','reports','accounts'].some(p=>this.can(p)) : this.can(required));
  }
  public isLogged(): boolean {
    return !!this.getToken(); // Only checks token now
  }

  public isCompany(): boolean {
    try {
      const payload = JSON.parse(atob((this.getToken() || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role === 'company' && payload.exp * 1000 > Date.now();
    } catch { return false; }
  }

  public isAdmin(): boolean {
    return this.getRole() === 'company_admin';
  }

  public isSubAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  public isEmployee(): boolean {
    return this.getRole() === 'staff';
  }

  public isAccountant(): boolean {
    return this.getRole() === 'accountant';
  }

  public isSuperviser(): boolean {
    return this.getRole() === 'superviser';
  }

  public isDriver(): boolean {
    return this.getRole() === 'driver';
  }

  public signOut(): void {
    const loginPath = this.isCompany() ? '/clogin' : '/login';
    this.user = null;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    this.router.navigate([loginPath]);
  }
}
