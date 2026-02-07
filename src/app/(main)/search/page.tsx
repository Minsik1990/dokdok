"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, BookOpen, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/features/empty-state";

interface BookResult {
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  coverUrl: string;
  description: string;
  pubdate: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
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
    // 책 선택 시 기록 작성 페이지로 이동 (쿼리 파라미터로 책 정보 전달)
    const params = new URLSearchParams({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      coverUrl: book.coverUrl,
      description: book.description,
    });
    router.push(`/record/new?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold">책 검색</h1>

      <form onSubmit={handleSearch} className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="책 제목이나 저자를 검색하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </form>

      {loading && (
        <div className="py-8 text-center">
          <p className="text-muted-foreground text-sm">검색 중...</p>
        </div>
      )}

      {!loading && !searched && (
        <EmptyState
          icon={Search}
          title="책을 검색해보세요"
          description="제목이나 저자 이름으로 읽고 싶은 책을 찾아보세요"
          size="sm"
          className="py-12"
        />
      )}

      {!loading && searched && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="검색 결과가 없어요"
          description="다른 키워드로 다시 검색해보세요"
          size="sm"
          className="py-12"
        />
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {results.map((book) => (
            <button
              key={book.isbn}
              type="button"
              className="hover:bg-muted flex w-full items-start gap-4 rounded-[14px] p-3 text-left transition-colors"
              onClick={() => handleSelect(book)}
            >
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  width={64}
                  height={96}
                  sizes="64px"
                  className="h-24 w-16 flex-shrink-0 rounded-lg object-cover shadow-sm"
                  loading="lazy"
                />
              ) : (
                <div className="bg-muted flex h-24 w-16 flex-shrink-0 items-center justify-center rounded-lg">
                  <BookOpen className="text-muted-foreground h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{book.title}</p>
                <p className="text-muted-foreground mt-0.5 text-[13px]">
                  {book.author} · {book.publisher}
                </p>
                {book.description && (
                  <p className="text-muted-foreground mt-1.5 line-clamp-2 text-[13px] leading-relaxed">
                    {book.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
