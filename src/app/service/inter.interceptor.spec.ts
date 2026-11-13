import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { InterInterceptor } from './inter.interceptor';
import { TokenService } from './token.service';

describe('API authentication', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let token: jasmine.SpyObj<TokenService>;
  const base = environment.baseUrl.replace(/\/+$/, '');
  beforeEach(() => {
    token = jasmine.createSpyObj('TokenService', ['getToken']);
    token.getToken.and.returnValue('session');
    TestBed.configureTestingModule({imports: [HttpClientTestingModule], providers: [
      {provide: TokenService, useValue: token},
      {provide: HTTP_INTERCEPTORS, useClass: InterInterceptor, multi: true},
    ]});
    client = TestBed.inject(HttpClient); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('adds the current token to API requests without forbidden browser headers', () => {
    client.get(base + '/company/branding').subscribe();
    const request = http.expectOne(base + '/company/branding');
    expect(request.request.headers.get('Authorization')).toBe('Bearer session');
    expect(request.request.headers.has('User-Agent')).toBeFalse();
    request.flush({});
  });
  it('never sends credentials to another host or a matching URL prefix', () => {
    for (const url of ['https://example.com/file', base + '.evil.example/file']) {
      client.get(url).subscribe(); const request = http.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBeFalse(); request.flush({});
    }
  });
  it('preserves explicit authorization and lets the browser set multipart content type', () => {
    client.post(base + '/upload', new FormData(), {headers: {Authorization: 'Bearer upload'}}).subscribe();
    const request = http.expectOne(base + '/upload');
    expect(request.request.headers.get('Authorization')).toBe('Bearer upload');
    expect(request.request.headers.has('Content-Type')).toBeFalse(); request.flush({});
  });
  it('does not send a null token', () => {
    token.getToken.and.returnValue(null); client.get(base + '/company/login').subscribe();
    const request = http.expectOne(base + '/company/login');
    expect(request.request.headers.has('Authorization')).toBeFalse(); request.flush({});
  });
});
