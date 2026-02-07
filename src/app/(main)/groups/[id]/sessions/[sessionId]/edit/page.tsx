"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BookSearch } from "@/components/features/book-search";
import { createClient } from "@/lib/supabase/client";

interface SelectedBook {
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  coverUrl: string;
  description: string;
}

export default function SessionEditPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const sessionId = params.sessionId as string;

  const [sessionDate, setSessionDate] = useState("");
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSession() {
      const supabase = createClient();
      const { data } = await supabase
        .from("sessions")
        .select("session_date, book_id, books(title, author, cover_image_url, isbn)")
        .eq("id", sessionId)
        .single();

      if (data) {
        setSessionDate(data.session_date);
        setCurrentBookId(data.book_id);
        if (data.books) {
          const book = data.books as unknown as {
            title: string;
            author: string;
            cover_image_url: string | null;
            isbn: string | null;
          };
          setSelectedBook({
            title: book.title,
            author: book.author,
            publisher: "",
            isbn: book.isbn ?? "",
            coverUrl: book.cover_image_url ?? "",
            description: "",
          });
        }
      }
      setFetching(false);
    }
    fetchSession();
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionDate) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      let bookId = currentBookId;

      // 책이 변경된 경우
      if (selectedBook && selectedBook.isbn) {
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
            })
            .select("id")
            .single();

          bookId = newBook?.id ?? null;
        }
      }

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_date: sessionDate, book_id: bookId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/groups/${groupId}/sessions/${sessionId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했어요");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6">
        <h1 className="text-[22px] font-bold">세션 편집</h1>
        <div className="text-muted-foreground py-8 text-center text-sm">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold">세션 편집</h1>

      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">모임 날짜</Label>
              <Input
                id="date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>읽을 책</Label>
              {selectedBook ? (
                <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                  {selectedBook.coverUrl && (
                    <Image
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      width={48}
                      height={64}
                      sizes="48px"
                      className="h-16 w-12 rounded object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{selectedBook.title}</p>
                    <p className="text-muted-foreground text-xs">{selectedBook.author}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBook(null);
                      setCurrentBookId(null);
                    }}
                  >
                    변경
                  </Button>
                </div>
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

            {error && <p className="text-destructive text-center text-sm">{error}</p>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button type="submit" className="flex-1" disabled={!sessionDate || loading}>
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
