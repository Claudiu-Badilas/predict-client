import { AuthenticationAction } from './../models/authentication-actions.enum';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export namespace AuthenticationValidators {
  export const email = (control: AbstractControl): ValidationErrors | null => {
    const emailRegex = new RegExp(
      /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,4})+$/,
    );
    return emailRegex.test(control?.value)
      ? null
      : {
          value: 'Please enter a valid email address',
        };
  };

  export const minLength = (min: number): ValidatorFn => {
    return (control: AbstractControl): { [key: string]: string } | null => {
      return control?.value?.length >= min
        ? null
        : {
            value: `Please enter password longer then ${min} characters`,
          };
    };
  };

  export const identityRevealedValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const authenticationAction = control.get('authenticationAction').value;
    const password = control.get('password').value;
    const confirmPassword = control.get('confirmPassword').value;

    return authenticationAction &&
      authenticationAction === AuthenticationAction.Register &&
      password &&
      confirmPassword &&
      password !== confirmPassword
      ? { isMatchPasswords: true }
      : null;
  };
}
