import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationUtils } from '../utils/authentication.utils';

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    httpRequest: HttpRequest<any>,
    httpHandler: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (httpRequest.url.includes(`server/api/v1/account/login`))
      return httpHandler.handle(httpRequest);

    if (httpRequest.url.includes(`server/api/v1/account/user/register`))
      return httpHandler.handle(httpRequest);

    const token = AuthenticationUtils.getToken();
    return httpHandler.handle(
      httpRequest.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      }),
    );
  }
}
