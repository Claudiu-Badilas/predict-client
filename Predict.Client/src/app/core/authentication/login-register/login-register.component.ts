import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { filter, map, startWith } from 'rxjs';
import { AuthenticationValidators } from 'src/app/core/authentication/login-register/validators/authentication-validator';
import { AuthenticationStore } from '../authentication.store';
import { AuthenticationAction } from './models/authentication-actions.enum';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'p-login-register',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login-register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./login-register.component.scss'],
})
export class LoginRegisterComponent {
  private readonly authenticationStore = inject(AuthenticationStore);
  private readonly router = inject(Router);

  readonly registerMessage = `You do not have an account, start journey with us from`;
  readonly loginMessage = `You already have an account, just log in from`;
  readonly isRegisterActive = signal(false);
  readonly isVisiblePassword = signal(false);

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

  private readonly formRevision = toSignal(
    this.credentialForm.events.pipe(
      map((_, revision) => revision + 1),
      startWith(0),
    ),
    { initialValue: 0 },
  );
  readonly isFormInvalid = computed(() => {
    this.formRevision();
    return this.calculateFormInvalid();
  });

  constructor(
    private formBuilder: FormBuilder,
    private readonly themeService: ThemeService,
  ) {
    this.updateAuthenticationAction();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.updateAuthenticationAction());
  }

  private updateAuthenticationAction(): void {
    const findAuthType = (route: ActivatedRouteSnapshot): string | null =>
      route.paramMap.get('auth-type') ??
      route.children.map(findAuthType).find(Boolean) ??
      null;
    const authAction = findAuthType(this.router.routerState.snapshot.root);
    this.isRegisterActive.set(authAction === AuthenticationAction.Register);
    this.updateCredentialForm();
  }

  isInvalidInput(inputName: string) {
    this.formRevision();
    return (
      this.getInputValue(inputName) &&
      this.credentialForm.get(inputName).invalid &&
      (!this.credentialForm.get(inputName).pristine ||
        this.credentialForm.get(inputName).dirty)
    );
  }

  getInputValidationError(inputName: string) {
    this.formRevision();
    return this.credentialForm.controls[inputName]?.errors['value'];
  }

  getInputValue(inputName: string) {
    this.formRevision();
    return this.credentialForm.controls[inputName]?.value;
  }

  onSubmitChanges(form: FormGroup) {
    const credentials = {
      email: form.controls['email'].value,
      password: form.controls['password'].value,
    };
    if (!this.isRegisterActive()) {
      this.authenticationStore.login(credentials);
    } else {
      this.authenticationStore.register(credentials);
    }
  }

  updateCredentialForm() {
    this.credentialForm.reset();
    this.credentialForm.patchValue({
      ...this.credentialForm,
      authenticationAction: !this.isRegisterActive()
        ? AuthenticationAction.Login
        : AuthenticationAction.Register,
      authenticationMessage: !this.isRegisterActive()
        ? this.registerMessage
        : this.loginMessage,
    });
  }

  onChangeAuthAction() {
    void this.router.navigateByUrl(
      `/authentication/${
        !this.isRegisterActive()
          ? AuthenticationAction.Register
          : AuthenticationAction.Login
      }`,
    );
  }

  private calculateFormInvalid() {
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
    this.isVisiblePassword.update((visible) => !visible);
  }

  readonly eyeIconPath = computed(
    () => `assets/icons/${this.themeService.iconTheme()}/eye.svg`,
  );
}
