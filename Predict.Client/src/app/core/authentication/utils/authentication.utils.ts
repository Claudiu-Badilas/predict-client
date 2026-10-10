import { JwtHelperService } from '@auth0/angular-jwt';

export namespace AuthenticationUtils {
  export function saveToken(token: string): void {
    localStorage.setItem('jwt-token', token);
  }

  export function getToken(): string {
    return localStorage.getItem('jwt-token');
  }

  export function logOut(): void {
    localStorage.removeItem('jwt-token');
  }

  export function isTokenValid(token: string = null): boolean {
    return true;
    const jwtHelper = new JwtHelperService();
    token = token ?? getToken();
    if (
      token &&
      jwtHelper.decodeToken(token).nameid &&
      !jwtHelper.isTokenExpired(token)
    ) {
      return true;
    } else {
      logOut();
      return false;
    }
  }
}
