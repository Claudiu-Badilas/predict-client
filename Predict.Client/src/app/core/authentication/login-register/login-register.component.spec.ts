import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, convertToParamMap } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticationStore } from '../authentication.store';
import { LoginRegisterComponent } from './login-register.component';
import { AuthenticationAction } from './models/authentication-actions.enum';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoginRegisterComponent', () => {
  it('creates', () => {
    expectComponentCreation(LoginRegisterComponent);
  });

  it('validates and submits login credentials and toggles password visibility', () => {
    expectComponentCreation(LoginRegisterComponent, (fixture) => {
      const component = fixture.componentInstance;
      const auth = TestBed.inject(AuthenticationStore) as unknown as {
        login: ReturnType<typeof vi.fn>;
        register: ReturnType<typeof vi.fn>;
      };
      const router = TestBed.inject(Router) as unknown as Router & {
        events: { next: (event: unknown) => void };
      };
      expect(component.isRegisterActive()).toBe(false);
      expect(component.getInputValue('authenticationAction')).toBe(
        AuthenticationAction.Login,
      );
      expect(component.eyeIconPath()).toContain('light/eye.svg');

      component.credentialForm.controls['email'].setValue('not-an-email');
      expect(component.isInvalidInput('email')).toBe(false);
      component.credentialForm.controls['email'].markAsDirty();
      expect(component.isInvalidInput('email')).toBe(true);
      expect(component.getInputValidationError('email')).toBe(
        'Please enter a valid email address',
      );
      component.credentialForm.controls['password'].setValue('123');
      component.credentialForm.controls['password'].markAsDirty();
      expect(component.isInvalidInput('password')).toBe(true);
      expect(component.getInputValidationError('password')).toContain(
        'longer then 4',
      );
      component.credentialForm.controls['email'].setValue(null);
      expect(component.isFormInvalid()).toBe(true);
      component.onSubmitChanges(component.credentialForm);
      expect(auth.login).toHaveBeenCalledWith({ email: null, password: '123' });
      expect(auth.register).not.toHaveBeenCalled();

      component.credentialForm.patchValue({
        email: 'person@example.com',
        password: 'secret',
      });
      expect(component.isFormInvalid()).toBe(false);

      component.onChangePasswordInputType();
      expect(component.isVisiblePassword()).toBe(true);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('input[type="text"]'),
      ).toBeTruthy();
      component.onChangePasswordInputType();
      expect(component.isVisiblePassword()).toBe(false);
      component.onChangeAuthAction();
      expect(router.navigateByUrl).toHaveBeenCalledWith(
        '/authentication/register',
      );

      const root = router.routerState.snapshot.root as unknown as {
        paramMap: ReturnType<typeof convertToParamMap>;
      };
      root.paramMap = convertToParamMap({ 'auth-type': 'register' });
      router.events.next(
        new NavigationEnd(
          1,
          '/authentication/register',
          '/authentication/register',
        ),
      );
      fixture.detectChanges();
      expect(component.isRegisterActive()).toBe(true);
      expect(component.getInputValue('authenticationAction')).toBe(
        AuthenticationAction.Register,
      );
      expect(component.getInputValue('authenticationMessage')).toBe(
        component.loginMessage,
      );
    });
  });

  it('validates matching registration passwords and submits registration', () => {
    expectComponentCreation(LoginRegisterComponent, (fixture) => {
      const component = fixture.componentInstance;
      const auth = TestBed.inject(AuthenticationStore) as unknown as {
        login: ReturnType<typeof vi.fn>;
        register: ReturnType<typeof vi.fn>;
      };
      const router = TestBed.inject(Router) as unknown as Router & {
        events: { next: (event: unknown) => void };
      };
      const root = router.routerState.snapshot.root as unknown as {
        paramMap: ReturnType<typeof convertToParamMap>;
      };
      root.paramMap = convertToParamMap({ 'auth-type': 'register' });
      router.events.next(
        new NavigationEnd(
          1,
          '/authentication/register',
          '/authentication/register',
        ),
      );
      fixture.detectChanges();

      component.credentialForm.patchValue({
        email: 'person@example.com',
        password: 'secret',
        confirmPassword: 'different',
      });
      expect(component.credentialForm.errors?.['isMatchPasswords']).toBe(true);
      expect(component.isFormInvalid()).toBe(true);
      component.onSubmitChanges(component.credentialForm);
      expect(auth.register).toHaveBeenCalledWith({
        email: 'person@example.com',
        password: 'secret',
      });
      expect(auth.login).not.toHaveBeenCalled();

      component.credentialForm.patchValue({ confirmPassword: 'secret' });
      expect(component.credentialForm.errors).toBeNull();
      expect(component.isFormInvalid()).toBeFalsy();
      component.onChangeAuthAction();
      expect(router.navigateByUrl).toHaveBeenCalledWith(
        '/authentication/login',
      );
    });
  });
});
