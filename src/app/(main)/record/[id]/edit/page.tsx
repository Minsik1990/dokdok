"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/features/star-rating";
import { createClient } from "@/lib/supabase/client";
import type { RecordStatus, RecordWithBook } from "@/lib/supabase/types";

const STATUS_OPTIONS: { value: RecordStatus; label: string }[] = [
  { value: "reading", label: "읽는 중" },
  { value: "completed", label: "완독" },
  { value: "wishlist", label: "읽고 싶은" },
];

export default function EditRecordPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<RecordStatus>("reading");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [record, setRecord] = useState<RecordWithBook | null>(null);

  useEffect(() => {
    async function loadRecord() {
      const supabase = createClient();
      const { data } = await supabase.from("records").select("*, books(*)").eq("id", id).single();

      if (!data) {
        router.push("/");
        return;
      }

      const rec = data as unknown as RecordWithBook;
      setRecord(rec);
      setStatus(rec.status);
      setRating(rec.rating ?? 0);
      setContent(rec.content ?? "");
      setQuote(rec.quote ?? "");
      setFetching(false);
    }

    loadRecord();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("records")
        .update({
          status,
          rating: rating || null,
          content: content.trim() || null,
          quote: quote.trim() || null,
          finished_at: status === "completed" ? new Date().toISOString().split("T")[0] : null,
          started_at: status !== "wishlist" ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", id);

      if (dbError) throw dbError;
      router.push(`/record/${id}`);
      router.refresh();
    } catch {
      setError("수정에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">기록을 불러오는 중...</p>
      </div>
    );
  }

  const book = record?.books;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          뒤로
        </Button>
        <h1 className="text-[22px] font-bold">기록 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 책 정보 (읽기 전용) */}
        <div className="space-y-2">
          <Label>책</Label>
          <Card>
            <CardContent className="flex items-center gap-3 py-3">
              {book?.cover_image_url ? (
                <Image
                  src={book.cover_image_url}
                  alt={book.title}
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
                <p className="truncate text-sm font-medium">{book?.title ?? "책 정보 없음"}</p>
                <p className="text-muted-foreground text-xs">{book?.author}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상태 */}
        <div className="space-y-2">
          <Label>상태</Label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={status === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(opt.value)}
                className="flex-1"
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
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? "저장 중..." : "수정하기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
