"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, ArrowLeft, Plus, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BookResult {
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  coverUrl: string;
  description: string;
  infoUrl: string;
  pubdate: string;
}

interface BookSearchProps {
  onSelect: (book: BookResult) => void;
  trigger?: React.ReactNode;
}

export function BookSearch({ onSelect, trigger }: BookSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSelectedBook(null);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.books ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!selectedBook) return;
    onSelect(selectedBook);
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelectedBook(null);
  }

  function handleClose(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedBook(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" type="button">
            <Search className="mr-2 h-4 w-4" />책 검색
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedBook ? "책 상세 정보" : "책 검색"}</DialogTitle>
        </DialogHeader>

        {selectedBook ? (
          /* 상세 확인 화면 */
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setSelectedBook(null)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              검색 결과로 돌아가기
            </button>

            <div className="flex gap-4">
              <div className="bg-muted relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                {selectedBook.coverUrl ? (
                  <Image
                    src={selectedBook.coverUrl}
                    alt={selectedBook.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="text-muted-foreground h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold">{selectedBook.title}</h3>
                {selectedBook.author && (
                  <p className="text-muted-foreground mt-0.5 text-sm">{selectedBook.author}</p>
                )}
                {selectedBook.publisher && (
                  <p className="text-muted-foreground text-xs">{selectedBook.publisher}</p>
                )}
              </div>
            </div>

            {selectedBook.description && (
              <div className="max-h-[30vh] overflow-y-auto">
                <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedBook.description}
                </p>
                {selectedBook.infoUrl && (
                  <a
                    href={selectedBook.infoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium"
                  >
                    다음에서 전체 소개 보기
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}

            <Button onClick={handleConfirm} className="w-full rounded-[14px]">
              <Plus className="mr-2 h-4 w-4" />이 책 추가하기
            </Button>
          </div>
        ) : (
          /* 검색 목록 화면 */
          <>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="책 제목이나 저자를 검색하세요"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!query.trim() || loading}>
                {loading ? "..." : "검색"}
              </Button>
            </form>
            <div className="max-h-[50vh] space-y-1 overflow-y-auto">
              {results.length === 0 && !loading && query && (
                <p className="text-muted-foreground py-4 text-center text-sm">검색 결과가 없어요</p>
              )}
              {results.map((book, index) => (
                <button
                  key={book.isbn || `${book.title}-${index}`}
                  type="button"
                  className="hover:bg-muted flex min-h-[44px] w-full items-start gap-3 rounded-[14px] p-3 text-left transition-colors"
                  onClick={() => setSelectedBook(book)}
                >
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      width={48}
                      height={64}
                      sizes="48px"
                      className="h-16 w-12 flex-shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-muted flex h-16 w-12 flex-shrink-0 items-center justify-center rounded text-xs">
                      표지 없음
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{book.title}</p>
                    <p className="text-muted-foreground truncate text-xs">{book.author}</p>
                    <p className="text-muted-foreground text-xs">{book.publisher}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
