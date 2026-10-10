import { Routes } from '@angular/router';
import { LoginRegisterComponent } from './login-register/login-register.component';

export const authenticationRoutes: Routes = [
  {
    path: 'authentication',
    component: LoginRegisterComponent,
    children: [
      {
        path: ':auth-type',
        component: LoginRegisterComponent,
        data: {
          gtmPageViewPathTitle: 'authentication',
        },
      },
    ],
  },
];
