"use client";

import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
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

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
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

  function handleSelect(book: BookResult) {
    onSelect(book);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" type="button">
            <Search className="mr-2 h-4 w-4" />책 검색
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>책 검색</DialogTitle>
        </DialogHeader>
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
          {results.map((book) => (
            <button
              key={book.isbn}
              type="button"
              className="hover:bg-muted flex min-h-[44px] w-full items-start gap-3 rounded-[14px] p-3 text-left transition-colors"
              onClick={() => handleSelect(book)}
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
      </DialogContent>
    </Dialog>
  );
}
