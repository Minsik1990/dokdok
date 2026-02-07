"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function RecordActions({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("이 기록을 삭제할까요?")) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("records").delete().eq("id", recordId);
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch {
      alert("삭제에 실패했어요. 다시 시도해주세요.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/record/${recordId}/edit`)}
        className="flex-1"
      >
        <Pencil className="mr-1 h-4 w-4" />
        기록 수정
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        className="flex-1"
      >
        <Trash2 className="mr-1 h-4 w-4" />
        {deleting ? "삭제 중..." : "기록 삭제"}
      </Button>
    </div>
  );
}
