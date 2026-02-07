import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-secondary mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <Icon className="text-primary h-7 w-7" />
      </div>
      <p className="text-foreground text-[15px] font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-[260px] text-[13px]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
