"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
      <h2 className="mb-2 text-lg font-bold">문제가 발생했어요</h2>
      <p className="text-muted-foreground mb-6 text-sm">잠시 후 다시 시도해주세요.</p>
      <Button onClick={reset} variant="outline">
        다시 시도
      </Button>
    </div>
  );
}
