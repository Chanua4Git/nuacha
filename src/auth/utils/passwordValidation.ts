
export interface PasswordPolicy {
  minLength?: number;
  requireNumber?: boolean;
  requireSpecialOrUpper?: boolean;
}

export interface PasswordValidations {
  length: boolean;
  number: boolean;
  special: boolean;
}

export const validatePassword = (
  password: string,
  policy?: PasswordPolicy,
): PasswordValidations => {
  const mergedPolicy: Required<PasswordPolicy> = {
    minLength: policy?.minLength ?? 8,
    requireNumber: policy?.requireNumber ?? true,
    requireSpecialOrUpper: policy?.requireSpecialOrUpper ?? false,
  };

  return {
    length: password.length >= mergedPolicy.minLength,
    number: !mergedPolicy.requireNumber || /\d/.test(password),
    special:
      !mergedPolicy.requireSpecialOrUpper ||
      /[!@#$%^&*(),.?":{}|<>]/.test(password) ||
      /[A-Z]/.test(password),
  };
};
