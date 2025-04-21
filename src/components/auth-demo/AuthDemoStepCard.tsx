
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthDemoStepCardProps = {
  step: number;
  title: string;
  description?: string;
  ctaLabel: string;
  to: string;
  disabled?: boolean;
  done?: boolean;
  highlight?: boolean;
  className?: string;
};

/**
 * Step Card for the guided auth demo flow.
 * Shows a checkmark when done, color cues for current/disabled states.
 */
const AuthDemoStepCard = ({
  step,
  title,
  description,
  ctaLabel,
  to,
  disabled,
  done,
  highlight,
  className,
}: AuthDemoStepCardProps) => (
  <div
    className={cn(
      "w-full rounded-2xl bg-white border shadow-sm px-6 py-7 mb-4 transition-all duration-150",
      highlight ? "border-primary/70 ring-2 ring-primary/10" : "border-gray-200",
      done ? "opacity-80" : "",
      className
    )}
  >
    <div className="flex flex-col gap-3 items-center">
      <div
        className={cn(
          "rounded-full flex items-center justify-center w-9 h-9 font-medium text-base mb-2",
          highlight
            ? "bg-[#C3DCD1] text-[#5A7684]"
            : done
            ? "bg-accent/80 text-soft-green"
            : "bg-gray-100 text-gray-400"
        )}
      >
        {done ? "✓" : step}
      </div>
      <h3 className={cn("text-lg font-medium mb-0 text-center font-playfair")}>{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm text-center max-w-sm">{description}</p>
      )}
      <Button
        asChild
        className="mt-3 w-full max-w-xs text-base rounded-xl"
        size="lg"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        variant={highlight || !disabled ? "default" : "outline"}
        disabled={disabled}
      >
        <a href={to} tabIndex={-1}>
          {ctaLabel}
        </a>
      </Button>
    </div>
  </div>
);

export default AuthDemoStepCard;
