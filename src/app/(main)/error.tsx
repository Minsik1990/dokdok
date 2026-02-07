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
      <div className="bg-destructive/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive h-7 w-7" />
      </div>
      <h2 className="mb-2 text-lg font-bold">문제가 발생했어요</h2>
      <p className="text-muted-foreground mb-6 text-[13px]">잠시 후 다시 시도해주세요.</p>
      <Button onClick={reset} variant="outline" size="sm">
        다시 시도
      </Button>
    </div>
  );
}
