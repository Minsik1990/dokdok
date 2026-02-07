"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BookSearch } from "@/components/features/book-search";
import { StarRating } from "@/components/features/star-rating";
import { createClient } from "@/lib/supabase/client";
import type { RecordStatus } from "@/lib/supabase/types";

interface SelectedBook {
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  coverUrl: string;
  description: string;
}

const STATUS_OPTIONS: { value: RecordStatus; label: string }[] = [
  { value: "reading", label: "읽는 중" },
  { value: "completed", label: "완독" },
  { value: "wishlist", label: "읽고 싶은" },
];

export default function NewRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [status, setStatus] = useState<RecordStatus>("reading");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 검색 페이지에서 책을 선택해서 넘어온 경우 초기값 설정
  useEffect(() => {
    const title = searchParams.get("title");
    const isbn = searchParams.get("isbn");
    if (title && isbn) {
      setSelectedBook({
        title,
        isbn,
        author: searchParams.get("author") ?? "",
        publisher: searchParams.get("publisher") ?? "",
        coverUrl: searchParams.get("coverUrl") ?? "",
        description: searchParams.get("description") ?? "",
      });
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBook) {
      setError("책을 선택해주세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 책 upsert
      let bookId: string;
      const { data: existingBook } = await supabase
        .from("books")
        .select("id")
        .eq("isbn", selectedBook.isbn)
        .single();

      if (existingBook) {
        bookId = existingBook.id;
      } else {
        const { data: newBook } = await supabase
          .from("books")
          .insert({
            isbn: selectedBook.isbn,
            title: selectedBook.title,
            author: selectedBook.author,
            publisher: selectedBook.publisher,
            cover_image_url: selectedBook.coverUrl,
            description: selectedBook.description,
            api_source: "kakao",
          })
          .select("id")
          .single();

        if (!newBook) throw new Error("책 등록 실패");
        bookId = newBook.id;
      }

      // 기록 생성
      const { error: dbError } = await supabase.from("records").insert({
        user_id: user.id,
        book_id: bookId,
        status,
        rating: rating || null,
        content: content.trim() || null,
        quote: quote.trim() || null,
        finished_at: status === "completed" ? new Date().toISOString().split("T")[0] : null,
        started_at: status !== "wishlist" ? new Date().toISOString().split("T")[0] : null,
      });

      if (dbError) throw dbError;
      router.push("/");
      router.refresh();
    } catch {
      setError("기록 저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold">새 기록</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 책 선택 */}
        <div className="space-y-2">
          <Label>책</Label>
          {selectedBook ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-3">
                {selectedBook.coverUrl ? (
                  <Image
                    src={selectedBook.coverUrl}
                    alt={selectedBook.title}
                    width={48}
                    height={64}
                    sizes="48px"
                    className="h-16 w-12 rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="bg-muted flex h-16 w-12 items-center justify-center rounded">
                    <BookOpen className="text-muted-foreground h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selectedBook.title}</p>
                  <p className="text-muted-foreground text-xs">{selectedBook.author}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBook(null)}
                >
                  변경
                </Button>
              </CardContent>
            </Card>
          ) : (
            <BookSearch
              onSelect={setSelectedBook}
              trigger={
                <Button variant="outline" type="button" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />책 검색하기
                </Button>
              }
            />
          )}
        </div>

        {/* 상태 — 터치 타겟 44px 보장 */}
        <div className="space-y-2">
          <Label>상태</Label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={status === opt.value ? "default" : "outline"}
                onClick={() => setStatus(opt.value)}
                className="h-12 flex-1"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 별점 */}
        {status !== "wishlist" && (
          <div className="space-y-2">
            <Label>별점 (선택)</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
        )}

        {/* 감상 */}
        {status !== "wishlist" && (
          <div className="space-y-2">
            <Label htmlFor="content">감상 (선택)</Label>
            <Textarea
              id="content"
              placeholder="이 책에 대한 생각을 자유롭게 적어보세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={1000}
            />
            <p className="text-muted-foreground text-right text-xs">{content.length}/1000</p>
          </div>
        )}

        {/* 인용구 */}
        {status !== "wishlist" && (
          <div className="space-y-2">
            <Label htmlFor="quote">인상 깊은 문구 (선택)</Label>
            <Textarea
              id="quote"
              placeholder="마음에 남는 문장을 기록해보세요"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>
        )}

        {error && <p className="text-destructive text-center text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={!selectedBook || loading}>
            {loading ? "저장 중..." : "기록하기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
