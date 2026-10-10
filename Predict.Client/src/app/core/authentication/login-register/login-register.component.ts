import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { combineLatest, debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { AuthenticationValidators } from 'src/app/core/authentication/login-register/validators/authentication-validator';
import * as NavigationAction from 'src/app/store/actions/navigation.actions';
import * as fromAppStore from 'src/app/store/app-state.reducer';
import * as fromState from 'src/app/store/app-state.reducer';
import * as AuthActions from '../actions/authentication.actions';
import { AuthenticationAction } from './models/authentication-actions.enum';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'p-login-register',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login-register.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./login-register.component.scss'],
})
export class LoginRegisterComponent implements OnDestroy {
  private ngUnsubscribe$: Subject<void> = new Subject<void>();

  registerMessage: string = `You do not have an account, start journey with us from`;
  loginMessage: string = `You already have an account, just log in from`;
  isRegisterActive: boolean = false;
  isVisiblePassword: boolean = false;

  credentialForm: FormGroup = this.formBuilder.group(
    {
      authenticationAction: new FormControl(AuthenticationAction.Login),
      authenticationMessage: new FormControl(this.registerMessage),
      email: new FormControl('', [
        Validators.required,
        AuthenticationValidators.email,
      ]),
      password: new FormControl('', [
        Validators.required,
        AuthenticationValidators.minLength(4),
      ]),
      confirmPassword: new FormControl('', [
        Validators.required,
        AuthenticationValidators.minLength(4),
      ]),
    },
    { validators: AuthenticationValidators.identityRevealedValidator },
  );

  constructor(
    private store: Store<fromAppStore.AppState>,
    private formBuilder: FormBuilder,
    private readonly themeService: ThemeService,
  ) {
    combineLatest([
      this.store.pipe(select(fromState.getRouterUrl)),
      this.store.pipe(select(fromState.selectRouteNestedParams)),
    ])
      .pipe(
        debounceTime(500),
        filter(
          ([url, params]) => url?.startsWith(`/authentication`) && !!params,
        ),
        takeUntil(this.ngUnsubscribe$.asObservable()),
      )
      .subscribe(([, params]) => {
        const authAction: AuthenticationAction = params['auth-type'];
        this.isRegisterActive = authAction === AuthenticationAction.Register;
        this.updateCredentialForm();
      });
  }

  isInvalidInput(inputName: string) {
    return (
      this.getInputValue(inputName) &&
      this.credentialForm.get(inputName).invalid &&
      (!this.credentialForm.get(inputName).pristine ||
        this.credentialForm.get(inputName).dirty)
    );
  }

  getInputValidationError(inputName: string) {
    return this.credentialForm.controls[inputName]?.errors['value'];
  }

  getInputValue(inputName: string) {
    return this.credentialForm.controls[inputName]?.value;
  }

  onSubmitChanges(form: FormGroup) {
    const credentials = {
      email: form.controls['email'].value,
      password: form.controls['password'].value,
    };
    if (!this.isRegisterActive) {
      this.store.dispatch(AuthActions.login(credentials));
    } else {
      this.store.dispatch(AuthActions.register(credentials));
    }
  }

  updateCredentialForm() {
    this.credentialForm.reset();
    this.credentialForm.patchValue({
      ...this.credentialForm,
      authenticationAction: !this.isRegisterActive
        ? AuthenticationAction.Login
        : AuthenticationAction.Register,
      authenticationMessage: !this.isRegisterActive
        ? this.registerMessage
        : this.loginMessage,
    });
  }

  onChangeAuthAction() {
    this.store.dispatch(
      NavigationAction.navigateTo({
        route: `/authentication/${
          !this.isRegisterActive
            ? AuthenticationAction.Register
            : AuthenticationAction.Login
        }`,
      }),
    );
  }

  isFormInvalid() {
    if (
      this.getInputValue('authenticationAction') ===
      AuthenticationAction.Register
    ) {
      return (
        this.isInvalidInput('email') === null ||
        this.isInvalidInput('password') === null ||
        this.isInvalidInput('confirmPassword') === null ||
        this.isInvalidInput('email') ||
        this.isInvalidInput('password') ||
        this.isInvalidInput('confirmPassword') ||
        this.credentialForm.errors?.['isMatchPasswords']
      );
    }
    return (
      this.isInvalidInput('email') === null ||
      this.isInvalidInput('password') === null ||
      this.isInvalidInput('email') ||
      this.isInvalidInput('password')
    );
  }

  onChangePasswordInputType() {
    this.isVisiblePassword = !this.isVisiblePassword;
  }

  getEyeIconPath(): string {
    return `assets/icons/${this.themeService.theme()}/eye.svg`;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }
}
