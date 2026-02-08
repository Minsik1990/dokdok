"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { BookSearch } from "@/components/features/book-search";

interface WishlistAddButtonProps {
  clubId: string;
}

export function WishlistAddButton({ clubId }: WishlistAddButtonProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function handleBookSelect(book: {
    title: string;
    author: string;
    publisher: string;
    isbn: string;
    coverUrl: string;
    description: string;
  }) {
    setAdding(true);
    setError("");

    try {
      const res = await fetch(`/api/club/${clubId}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          coverUrl: book.coverUrl,
          description: book.description,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error || "추가에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <BookSearch
        onSelect={handleBookSelect}
        trigger={
          <button
            type="button"
            disabled={adding}
            className="text-primary flex items-center gap-1 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            {adding ? "추가 중..." : "책 추가"}
          </button>
        }
      />
      {error && <p className="text-destructive mt-1 text-center text-sm">{error}</p>}
    </div>
  );
}
