import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  constructor(private http: HttpClient) {}

  public login(user: {
    email: string;
    password: string;
  }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      `server/api/v1/account/login`,
      user,
    );
  }

  public register(user: {
    email: string;
    password: string;
  }): Observable<unknown> {
    return this.http.post<unknown>(`server/api/v1/account/register`, user);
  }
}
