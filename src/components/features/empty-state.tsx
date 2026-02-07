import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div
        className={cn(
          "bg-secondary mb-4 flex items-center justify-center rounded-full",
          size === "sm" ? "h-12 w-12" : "h-16 w-16"
        )}
      >
        <Icon className={cn("text-primary", size === "sm" ? "h-5 w-5" : "h-7 w-7")} />
      </div>
      <p className="text-foreground text-[15px] font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-[280px] text-[13px] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
