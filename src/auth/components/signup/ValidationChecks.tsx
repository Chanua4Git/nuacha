
import { CheckCircle2, XCircle } from 'lucide-react';

interface ValidationChecksProps {
  validations: {
    length: boolean;
    number: boolean;
    special: boolean;
  };
}

export const ValidationChecks = ({ validations }: ValidationChecksProps) => {
  return (
    <div className="space-y-1 mt-2">
      <div className="flex items-center gap-2 text-xs">
        {validations.length ? 
          <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
          <XCircle className="h-4 w-4 text-red-500" />}
        <span className={validations.length ? "text-green-700" : "text-muted-foreground"}>
          At least 8 characters
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {validations.number ? 
          <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
          <XCircle className="h-4 w-4 text-red-500" />}
        <span className={validations.number ? "text-green-700" : "text-muted-foreground"}>
          At least one number
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {validations.special ? 
          <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
          <XCircle className="h-4 w-4 text-gray-400" />}
        <span className={validations.special ? "text-green-700" : "text-muted-foreground"}>
          At least one symbol or uppercase letter (optional)
        </span>
      </div>
    </div>
  );
};
