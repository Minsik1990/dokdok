"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteWishlistButtonProps {
  clubId: string;
  wishlistBookId: string;
}

export function DeleteWishlistButton({ clubId, wishlistBookId }: DeleteWishlistButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/club/${clubId}/wishlist/${wishlistBookId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConfirming(false);
        router.push(`/club/${clubId}/wishlist`);
        router.refresh();
      } else {
        setError("삭제에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="bg-secondary text-secondary-foreground hover:bg-muted flex h-9 items-center gap-1.5 rounded-[14px] px-3 text-sm font-medium"
      >
        <Trash2 className="h-3.5 w-3.5" />
        삭제
      </button>

      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open) setConfirming(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 책을 위시리스트에서 삭제하시겠습니까?
              {error && <span className="text-destructive mt-2 block text-sm">{error}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
