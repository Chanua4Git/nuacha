
export interface PasswordValidations {
  length: boolean;
  number: boolean;
  special: boolean;
}

export const validatePassword = (password: string): PasswordValidations => {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password) || /[A-Z]/.test(password),
  };
};
