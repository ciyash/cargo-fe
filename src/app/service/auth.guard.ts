import { normalizeRole } from './roles';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from './token.service';

export const authGuard: CanActivateFn = (route) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  if (!tokenService.isLogged()) return router.createUrlTree(['/login']);
  const path = route.routeConfig?.path || '';
  if (['dashboard', 'employee-dashboard'].includes(path) && tokenService.getRole() === 'staff') {
    return router.createUrlTree(['/booking']);
  }
  const roles = route.data['roles'] as string[] | undefined;
  const role = tokenService.getRole();
  return tokenService.canAccessRoute('/'+(route.routeConfig?.path||'')) && (!roles || tokenService.isAdmin() || (role !== null && roles.some(r=>normalizeRole(r)===role)))
    ? true
    : router.createUrlTree(['/profile']);
};

// The shared booking entry opens each role's existing full CRM form.
export const bookingEntryGuard: CanActivateFn = () => {
  const token=inject(TokenService),router=inject(Router);
  if(!token.isLogged())return router.createUrlTree(['/login']);
  if(token.getRole()==='admin')return router.createUrlTree(['/sub-booking']);
  if(token.getRole()==='staff')return router.createUrlTree(['/employee-booking']);
  return true;
};
// Company Admin uses the original team form; branch managers keep branch-scoped Staff tools.
export const branchStaffEntryGuard: CanActivateFn = () => {
  const token=inject(TokenService),router=inject(Router);
  return token.isAdmin()?router.createUrlTree(['/createemployee']):true;
};