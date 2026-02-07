"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeleteSessionButtonProps {
  clubId: string;
  sessionId: string;
}

export function DeleteSessionButton({ clubId, sessionId }: DeleteSessionButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/club/${clubId}/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push(`/club/${clubId}`);
        router.refresh();
      }
    } catch {
      // 에러 처리
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-destructive flex h-9 items-center gap-1.5 rounded-[14px] px-3 text-sm font-medium text-white"
        >
          {deleting ? "삭제 중..." : "확인"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="bg-secondary text-secondary-foreground hover:bg-muted flex h-9 items-center rounded-[14px] px-3 text-sm font-medium"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="bg-secondary text-secondary-foreground hover:bg-muted flex h-9 items-center gap-1.5 rounded-[14px] px-3 text-sm font-medium"
    >
      <Trash2 className="h-3.5 w-3.5" />
      삭제
    </button>
  );
}
