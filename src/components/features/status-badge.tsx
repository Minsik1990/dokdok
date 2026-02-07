import { Badge } from "@/components/ui/badge";
import type { RecordStatus } from "@/lib/supabase/types";

const STATUS_CONFIG = {
  reading: {
    label: "읽는 중",
    variant: "outline" as const,
    className: "border-primary/30 text-primary",
  },
  completed: { label: "완독", variant: "default" as const, className: "" },
  wishlist: { label: "읽고 싶은", variant: "secondary" as const, className: "" },
} satisfies Record<
  RecordStatus,
  { label: string; variant: "outline" | "default" | "secondary"; className: string }
>;

export function StatusBadge({ status }: { status: RecordStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
