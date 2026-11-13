import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TokenService } from './token.service';
import { permissionsFor } from './roles';

describe('Session and permissions', () => {
  let service: TokenService;
  let savedToken: string | null; let savedUser: string | null;
  beforeEach(() => {
    savedToken = localStorage.getItem('auth-token'); savedUser = localStorage.getItem('auth-user');
    localStorage.removeItem('auth-token'); localStorage.removeItem('auth-user');
    TestBed.configureTestingModule({imports: [RouterTestingModule]}); service = TestBed.inject(TokenService);
  });
  afterEach(() => {
    for (const [key, value] of [['auth-token', savedToken], ['auth-user', savedUser]]) {
      if (value === null) localStorage.removeItem(key!); else localStorage.setItem(key!, value!);
    }
  });
  it('migrates a legacy role once and preserves its meaning on subsequent reads', () => {
    localStorage.setItem('auth-user', JSON.stringify({role: 'admin'}));
    expect(service.getRole()).toBe('company_admin'); expect(service.getRole()).toBe('company_admin');
    service.saveUser({role: 'admin'}); expect(service.getRole()).toBe('admin');
  });
  it('matches backend Staff operational access even when an old account saved fewer permissions', () => {
    service.saveUser({role: 'staff', permissions: ['delivery']});
    expect(service.can('bookings')).toBeTrue(); expect(service.can('delivery')).toBeTrue();
    expect(service.canAccessRoute('/employee-booking')).toBeTrue();
    expect(service.canAccessRoute('/createcity')).toBeFalse();
    expect(service.canAccessRoute('/dashboard')).toBeFalse();
    service.saveUser({role: 'staff', permissions: []}); expect(service.permissions()).toEqual(['bookings','loading','delivery','accounts','reports']);
  });
  it('preserves explicit Branch Admin permissions without granting company settings', () => {
    service.saveUser({role:'admin',permissions:['delivery']});
    expect(service.can('bookings')).toBeFalse();expect(service.can('delivery')).toBeTrue();
    expect(service.canAccessRoute('/createcity')).toBeFalse();
  });
  it('retains default permissions for legacy staff without an explicit list', () => {
    expect(permissionsFor({role: 'employee'})).toContain('bookings');
    expect(permissionsFor({role: 'company_admin', permissions: []})).toContain('branches');
  });
  it('reads the latest token after an account switch', () => {
    service.saveToken('first'); expect(service.getToken()).toBe('first');
    service.saveToken('second'); expect(service.getToken()).toBe('second');
  });
});
