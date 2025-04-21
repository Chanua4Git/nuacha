
import { CheckCircle2, XCircle } from 'lucide-react';
import { PasswordPolicy } from '../../utils/passwordValidation';

interface ValidationChecksProps {
  validations: {
    length: boolean;
    number: boolean;
    special: boolean;
  };
  passwordPolicy?: PasswordPolicy;
}

export const ValidationChecks = ({ validations, passwordPolicy }: ValidationChecksProps) => {
  const policy = {
    minLength: 8,
    requireNumber: true,
    requireSpecialOrUpper: false,
    ...passwordPolicy,
  };

  return (
    <div className="space-y-1 mt-2">
      <div className="flex items-center gap-2 text-xs">
        {validations.length ? 
          <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
          <XCircle className="h-4 w-4 text-red-500" />}
        <span className={validations.length ? "text-green-700" : "text-muted-foreground"}>
          At least {policy.minLength} characters
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {policy.requireNumber ? (
          <>
          {validations.number ? 
            <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
            <XCircle className="h-4 w-4 text-red-500" />}
          <span className={validations.number ? "text-green-700" : "text-muted-foreground"}>
            At least one number
          </span>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-xs">
        {policy.requireSpecialOrUpper ? (
          <>
          {validations.special ? 
            <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
            <XCircle className="h-4 w-4 text-gray-400" />}
          <span className={validations.special ? "text-green-700" : "text-muted-foreground"}>
            At least one symbol or uppercase letter
          </span>
          </>
        ) : null}
        {!policy.requireSpecialOrUpper && (
          <>
            <CheckCircle2 className="h-4 w-4 text-gray-300" />
            <span className="text-muted-foreground">Symbol/uppercase (optional)</span>
          </>
        )}
      </div>
    </div>
  );
};
