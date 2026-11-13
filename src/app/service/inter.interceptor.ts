import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class InterInterceptor implements HttpInterceptor {

  constructor(private token: TokenService) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const base = environment.baseUrl.replace(/\/+$/, '');
    const isApiRequest = req.url === base || req.url.startsWith(base + '/') || req.url.startsWith(base + '?');
    const token = this.token.getToken();
    const authenticated = isApiRequest && token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
    return next.handle(authenticated);
  }
}
