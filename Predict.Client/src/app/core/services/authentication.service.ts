import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  constructor(private http: HttpClient) {}

  public login(user: any): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      `server/api/v1/account/login`,
      user,
    );
  }

  public register(user: any): Observable<any> {
    return this.http.post<any>(`server/api/v1/account/register`, user);
  }
}
