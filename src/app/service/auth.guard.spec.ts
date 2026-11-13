import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TokenService } from './token.service';
import { authGuard } from './auth.guard';
import { cauthGuardGuard } from './cauth-guard.guard';
import { companyGuard } from './company.guard';

describe('Route access', () => {
  let token: jasmine.SpyObj<TokenService>;
  let router: Router;
  beforeEach(() => {
    token = jasmine.createSpyObj('TokenService', ['isLogged', 'getRole', 'isAdmin', 'canAccessRoute', 'isCompany']);
    TestBed.configureTestingModule({ imports: [RouterTestingModule], providers: [{ provide: TokenService, useValue: token }] });
    router = TestBed.inject(Router);
    token.canAccessRoute.and.returnValue(true);
    token.isAdmin.and.returnValue(false);
  });
  function check(roles?: string[]) {
    const route = { data: roles ? { roles } : {} } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => authGuard(route, {} as RouterStateSnapshot));
  }
  it('redirects unauthenticated users to login', () => {
    token.isLogged.and.returnValue(false);
    expect(router.serializeUrl(check() as UrlTree)).toBe('/login');
  });
  it('allows authenticated users on shared screens', () => {
    token.isLogged.and.returnValue(true);
    expect(check()).toBeTrue();
  });
  it('allows the configured role', () => {
    token.isLogged.and.returnValue(true);
    token.getRole.and.returnValue('staff');
    expect(check(['employee'])).toBeTrue();
  });
  it('rejects a different or missing role', () => {
    token.isLogged.and.returnValue(true);
    token.getRole.and.returnValue('staff');
    expect(router.serializeUrl(check(['admin']) as UrlTree)).toBe('/profile');
    token.getRole.and.returnValue(null);
    expect(router.serializeUrl(check(['admin']) as UrlTree)).toBe('/profile');
  });
  it('rejects a route when the user lacks its work permission', () => {
    token.isLogged.and.returnValue(true); token.canAccessRoute.and.returnValue(false);
    expect(router.serializeUrl(check() as UrlTree)).toBe('/profile');
  });
  it('allows only company admins through the branch creation guard', () => {
    token.isLogged.and.returnValue(true);
    const run = () => TestBed.runInInjectionContext(() => cauthGuardGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(router.serializeUrl(run() as UrlTree)).toBe('/login');
    token.isAdmin.and.returnValue(true); expect(run()).toBeTrue();
  });
  it('redirects company login without looping to createbranch', () => {
    token.isLogged.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => companyGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(router.serializeUrl(result as UrlTree)).toBe('/clogin');
  });
});
