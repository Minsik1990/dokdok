"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookSearch } from "./book-search";

interface BookInfo {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverUrl: string;
  description: string;
}

interface SessionFormData {
  bookId?: string | null;
  book?: BookInfo | null;
  sessionDate: string;
  presenter: string;
  participants: string[];
  presentationText: string;
  content: string;
  photos: string[];
}

interface SessionFormProps {
  clubId: string;
  initialData?: SessionFormData;
  sessionId?: string;
}

export function SessionForm({ clubId, initialData, sessionId }: SessionFormProps) {
  const router = useRouter();
  const isEdit = !!sessionId;

  const [book, setBook] = useState<BookInfo | null>(initialData?.book ?? null);
  const [sessionDate, setSessionDate] = useState(
    initialData?.sessionDate ?? new Date().toISOString().split("T")[0]
  );
  const [presenter, setPresenter] = useState(initialData?.presenter ?? "");
  const [participants, setParticipants] = useState<string[]>(initialData?.participants ?? []);
  const [participantInput, setParticipantInput] = useState("");
  const [presentationText, setPresentationText] = useState(initialData?.presentationText ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/club/${clubId}/members`);
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch {
      // 무시
    }
  }, [clubId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  function addParticipant(name: string) {
    const trimmed = name.trim();
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants([...participants, trimmed]);
    }
    setParticipantInput("");
    setShowSuggestions(false);
  }

  function removeParticipant(name: string) {
    setParticipants(participants.filter((p) => p !== name));
  }

  const filteredMembers = members.filter(
    (m) =>
      m.toLowerCase().includes(participantInput.toLowerCase()) &&
      !participants.includes(m) &&
      m !== presenter
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionDate) return;

    setSaving(true);
    try {
      const payload = {
        book: book
          ? {
              isbn: book.isbn,
              title: book.title,
              author: book.author,
              publisher: book.publisher,
              coverUrl: book.coverUrl,
              description: book.description,
            }
          : null,
        sessionDate,
        presenter,
        participants,
        presentationText,
        content,
        photos: [],
      };

      const url = isEdit
        ? `/api/club/${clubId}/sessions/${sessionId}`
        : `/api/club/${clubId}/sessions`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/club/${clubId}/session/${data.session.id}`);
        router.refresh();
      }
    } catch {
      // 에러 처리
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 책 선택 */}
      <div className="space-y-2">
        <Label>읽은 책</Label>
        {book ? (
          <div className="bg-input flex items-center gap-3 rounded-[14px] p-3">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                width={40}
                height={56}
                className="h-14 w-10 rounded object-cover"
              />
            ) : (
              <div className="bg-muted flex h-14 w-10 items-center justify-center rounded">
                <ImageIcon className="text-muted-foreground h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{book.title}</p>
              <p className="text-muted-foreground truncate text-xs">{book.author}</p>
            </div>
            <button
              type="button"
              onClick={() => setBook(null)}
              className="hover:bg-muted rounded-full p-1"
            >
              <X className="text-muted-foreground h-4 w-4" />
            </button>
          </div>
        ) : (
          <BookSearch
            onSelect={(b) => setBook(b)}
            trigger={
              <button
                type="button"
                className="border-border text-muted-foreground hover:bg-muted flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed text-sm"
              >
                <Plus className="h-4 w-4" />책 검색하기
              </button>
            }
          />
        )}
      </div>

      {/* 모임 날짜 */}
      <div className="space-y-2">
        <Label htmlFor="sessionDate">모임 날짜</Label>
        <Input
          id="sessionDate"
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          className="bg-input h-12 border-0"
          required
        />
      </div>

      {/* 발제자 */}
      <div className="space-y-2">
        <Label htmlFor="presenter">발제자</Label>
        <div className="relative">
          <Input
            id="presenter"
            placeholder="발제자 이름"
            value={presenter}
            onChange={(e) => setPresenter(e.target.value)}
            className="bg-input h-12 border-0"
            autoComplete="off"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions &&
            presenter &&
            members.filter(
              (m) => m.toLowerCase().includes(presenter.toLowerCase()) && m !== presenter
            ).length > 0 && (
              <div className="bg-popover absolute top-full z-10 mt-1 w-full rounded-[14px] border p-1 shadow-lg">
                {members
                  .filter(
                    (m) => m.toLowerCase().includes(presenter.toLowerCase()) && m !== presenter
                  )
                  .slice(0, 5)
                  .map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="hover:bg-muted w-full rounded-lg px-3 py-2 text-left text-sm"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPresenter(m);
                        setShowSuggestions(false);
                      }}
                    >
                      {m}
                    </button>
                  ))}
              </div>
            )}
        </div>
      </div>

      {/* 참여자 */}
      <div className="space-y-2">
        <Label>참여자</Label>
        {participants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 rounded-full py-1 pr-1.5 pl-3">
                {p}
                <button
                  type="button"
                  onClick={() => removeParticipant(p)}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="relative">
          <Input
            placeholder="참여자 이름 입력 후 Enter"
            value={participantInput}
            onChange={(e) => setParticipantInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addParticipant(participantInput);
              }
            }}
            className="bg-input h-12 border-0"
            autoComplete="off"
          />
          {participantInput && filteredMembers.length > 0 && (
            <div className="bg-popover absolute top-full z-10 mt-1 w-full rounded-[14px] border p-1 shadow-lg">
              {filteredMembers.slice(0, 5).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="hover:bg-muted w-full rounded-lg px-3 py-2 text-left text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addParticipant(m);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 발제문 */}
      <div className="space-y-2">
        <Label htmlFor="presentationText">발제문</Label>
        <Textarea
          id="presentationText"
          placeholder="발제문을 입력하세요"
          value={presentationText}
          onChange={(e) => setPresentationText(e.target.value)}
          className="bg-input min-h-[120px] border-0"
          maxLength={10000}
        />
      </div>

      {/* 모임 내용/후기 */}
      <div className="space-y-2">
        <Label htmlFor="content">모임 내용 / 후기</Label>
        <Textarea
          id="content"
          placeholder="모임 내용이나 후기를 남겨보세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-input min-h-[100px] border-0"
          maxLength={5000}
        />
      </div>

      {/* 제출 */}
      <Button
        type="submit"
        className="h-12 w-full rounded-[14px]"
        disabled={saving || !sessionDate}
      >
        {saving ? "저장 중..." : isEdit ? "수정하기" : "기록하기"}
      </Button>
    </form>
  );
}
