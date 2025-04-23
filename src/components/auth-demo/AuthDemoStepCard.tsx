
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useAuth } from "@/auth/contexts/AuthProvider";

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
  onClick?: () => void;
  showSignOut?: boolean;
};

export const AuthDemoStepCard = ({
  step,
  title,
  description,
  ctaLabel,
  to,
  disabled,
  done,
  highlight,
  className,
  onClick,
  showSignOut,
}: AuthDemoStepCardProps) => {
  const { signOut } = useAuth();

  return (
    <div
      className={cn(
        "w-full rounded-2xl bg-white border shadow-sm px-6 py-7 mb-4 transition-all duration-150 relative",
        highlight ? "border-primary/70 ring-2 ring-primary/10" : "border-gray-200",
        done ? "opacity-80" : "",
        className
      )}
    >
      {showSignOut && (
        <button
          onClick={signOut}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      )}
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
        <h3 className={cn("text-lg font-medium mb-0 text-center font-playfair")}>
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            {description}
          </p>
        )}
        <button
          type="button"
          className="mt-3 w-full max-w-xs text-base rounded-xl inline-flex justify-center items-center px-6 py-3 font-medium shadow focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={disabled}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={onClick}
          style={{ display: highlight || !disabled ? "" : "none" }}
        >
          {ctaLabel}
        </button>
        {/* Fallback link for non-interactive cards */}
        {!highlight && disabled && (
          <a
            href={to}
            tabIndex={-1}
            className="pointer-events-none mt-3 w-full max-w-xs text-base rounded-xl opacity-60 bg-gray-200 py-3 text-center"
            aria-disabled="true"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </div>
  );
};
