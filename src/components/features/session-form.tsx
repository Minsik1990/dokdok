"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Plus, ImageIcon, Camera, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookSearch } from "./book-search";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  isCounted?: boolean;
  presenter: string[];
  participants: string[];
  presentationText: string;
  content: string;
  photos: string[];
  tags: string[];
}

interface SessionFormProps {
  clubId: string;
  initialData?: SessionFormData;
  sessionId?: string;
}

function SortablePhotoItem({
  id,
  src,
  alt,
  onRemove,
}: {
  id: string;
  src: string;
  alt: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square overflow-hidden rounded-lg"
    >
      <Image src={src} alt={alt} fill sizes="80px" className="object-cover" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute bottom-0 left-0 flex min-h-[44px] min-w-[44px] touch-none items-end justify-start p-1.5"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50">
          <GripVertical className="h-3 w-3 text-white" />
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0 right-0 flex min-h-[44px] min-w-[44px] items-start justify-end p-1.5"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50">
          <X className="h-3 w-3 text-white" />
        </span>
      </button>
    </div>
  );
}

export function SessionForm({ clubId, initialData, sessionId }: SessionFormProps) {
  const router = useRouter();
  const isEdit = !!sessionId;

  const [book, setBook] = useState<BookInfo | null>(initialData?.book ?? null);
  const [sessionDate, setSessionDate] = useState(
    initialData?.sessionDate ??
      new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
        .toISOString()
        .split("T")[0]
  );
  const [isCounted, setIsCounted] = useState(initialData?.isCounted ?? true);
  const [presenters, setPresenters] = useState<string[]>(initialData?.presenter ?? []);
  const [presenterInput, setPresenterInput] = useState("");
  const presenterValueRef = useRef("");
  const [participants, setParticipants] = useState<string[]>(initialData?.participants ?? []);
  const [participantInput, setParticipantInput] = useState("");
  const participantValueRef = useRef("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [presentationText, setPresentationText] = useState(initialData?.presentationText ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialData?.photos ?? []);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const tagValueRef = useRef("");
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // 드래그 결과로 사진 순서 변경 (기존/새 사진 각각 그룹 내에서만)
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 기존 사진끼리 순서 변경
    if (activeId.startsWith("existing-") && overId.startsWith("existing-")) {
      const oldIndex = parseInt(activeId.replace("existing-", ""));
      const newIndex = parseInt(overId.replace("existing-", ""));
      setExistingPhotos((prev) => arrayMove(prev, oldIndex, newIndex));
      return;
    }

    // 새 사진끼리 순서 변경
    if (activeId.startsWith("new-") && overId.startsWith("new-")) {
      const oldIndex = parseInt(activeId.replace("new-", ""));
      const newIndex = parseInt(overId.replace("new-", ""));
      setPhotoFiles((prev) => arrayMove(prev, oldIndex, newIndex));
      setPhotoPreviews((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/club/${clubId}/members`);
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch {
      // 무시
    }
  }, [clubId]);

  const loadTags = useCallback(async () => {
    try {
      const res = await fetch(`/api/club/${clubId}/tags`);
      const data = await res.json();
      setExistingTags(data.tags ?? []);
    } catch {
      // 무시
    }
  }, [clubId]);

  useEffect(() => {
    loadMembers();
    loadTags();
  }, [loadMembers, loadTags]);

  function addPresenter(name: string) {
    const trimmed = name.trim();
    if (trimmed && !presenters.includes(trimmed)) {
      setPresenters((prev) => [...prev, trimmed]);
    }
    setPresenterInput("");
    presenterValueRef.current = "";
  }

  function addPresenterSafe() {
    setTimeout(() => {
      const val = presenterValueRef.current.trim() || presenterInput.trim();
      if (val) {
        addPresenter(val);
      }
    }, 50);
  }

  function removePresenter(name: string) {
    setPresenters(presenters.filter((p) => p !== name));
  }

  function addParticipant(name: string) {
    const trimmed = name.trim();
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants((prev) => [...prev, trimmed]);
    }
    setParticipantInput("");
    participantValueRef.current = "";
  }

  // IME 조합 완료 후 안전하게 추가 (한국어 입력 대응)
  function addParticipantSafe() {
    setTimeout(() => {
      const val = participantValueRef.current.trim() || participantInput.trim();
      if (val) {
        addParticipant(val);
      }
    }, 50);
  }

  function removeParticipant(name: string) {
    setParticipants(participants.filter((p) => p !== name));
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
    tagValueRef.current = "";
  }

  function addTagSafe() {
    setTimeout(() => {
      const val = tagValueRef.current.trim() || tagInput.trim();
      if (val) {
        addTag(val);
      }
    }, 50);
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalCount = photoFiles.length + existingPhotos.length + files.length;
    if (totalCount > 10) {
      setError("사진은 최대 10장까지 첨부할 수 있습니다.");
      return;
    }
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        setError("파일 크기는 5MB 이하만 가능합니다.");
        return;
      }
    }
    setError("");
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPhotoFiles((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  const filteredTags = existingTags.filter(
    (t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t) && t !== tagInput
  );

  const filteredMembers = members.filter(
    (m) =>
      m.toLowerCase().includes(participantInput.toLowerCase()) &&
      !participants.includes(m) &&
      !presenters.includes(m)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!sessionDate) {
      setError("모임 날짜를 입력해주세요.");
      return;
    }

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
        isCounted,
        presenter: presenters,
        participants,
        presentationText,
        content,
        photos: existingPhotos,
        tags,
      };

      const url = isEdit
        ? `/api/club/${clubId}/sessions/${sessionId}`
        : `/api/club/${clubId}/sessions`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "저장에 실패했습니다.");
        return;
      }

      const savedSessionId = data.session.id;

      // 새 사진이 있으면 업로드
      if (photoFiles.length > 0) {
        const formData = new FormData();
        for (const file of photoFiles) {
          formData.append("photos", file);
        }
        const photoRes = await fetch(`/api/club/${clubId}/sessions/${savedSessionId}/photos`, {
          method: "POST",
          body: formData,
        });
        if (!photoRes.ok) {
          const photoData = await photoRes.json();
          setError(photoData.error || "사진 업로드에 실패했습니다.");
          return;
        }
      }

      router.push(`/club/${clubId}/session/${savedSessionId}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
          e.preventDefault();
        }
      }}
      className="space-y-6"
    >
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
          <div className="space-y-2">
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
            <p className="text-muted-foreground text-center text-xs">
              책 없는 모임은 건너뛰어도 됩니다
            </p>
          </div>
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

      {/* 모임 횟수 포함 여부 */}
      <label className="flex items-center gap-3 px-1">
        <input
          type="checkbox"
          checked={isCounted}
          onChange={(e) => setIsCounted(e.target.checked)}
          className="accent-primary h-5 w-5 rounded"
        />
        <div>
          <span className="text-sm font-medium">모임 횟수에 포함</span>
          <p className="text-muted-foreground text-xs">해제하면 회차 번호와 통계에서 제외됩니다</p>
        </div>
      </label>

      {/* 발제자 */}
      <div className="space-y-2">
        <Label>발제자</Label>
        {presenters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {presenters.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 rounded-full py-1 pr-1.5 pl-3">
                {p}
                <button
                  type="button"
                  onClick={() => removePresenter(p)}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="flex gap-2">
            <Input
              placeholder="발제자 이름 입력"
              value={presenterInput}
              onChange={(e) => {
                setPresenterInput(e.target.value);
                presenterValueRef.current = e.target.value;
              }}
              onCompositionEnd={(e) => {
                const val = (e.target as HTMLInputElement).value;
                setPresenterInput(val);
                presenterValueRef.current = val;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addPresenterSafe();
                }
              }}
              className="bg-input h-12 flex-1 border-0"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-12 shrink-0 rounded-[14px] px-4"
              onClick={addPresenterSafe}
              disabled={!presenterInput.trim()}
            >
              추가
            </Button>
          </div>
          {presenterInput &&
            members.filter(
              (m) =>
                m.toLowerCase().includes(presenterInput.toLowerCase()) &&
                !presenters.includes(m) &&
                m !== presenterInput
            ).length > 0 && (
              <div className="bg-popover absolute top-full z-10 mt-1 w-full rounded-[14px] border p-1 shadow-lg">
                {members
                  .filter(
                    (m) =>
                      m.toLowerCase().includes(presenterInput.toLowerCase()) &&
                      !presenters.includes(m) &&
                      m !== presenterInput
                  )
                  .slice(0, 5)
                  .map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="hover:bg-muted w-full rounded-lg px-3 py-2 text-left text-sm"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addPresenter(m)}
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
          <div className="flex gap-2">
            <Input
              placeholder="참여자 이름 입력"
              value={participantInput}
              onChange={(e) => {
                setParticipantInput(e.target.value);
                participantValueRef.current = e.target.value;
              }}
              onCompositionEnd={(e) => {
                const val = (e.target as HTMLInputElement).value;
                setParticipantInput(val);
                participantValueRef.current = val;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addParticipantSafe();
                }
              }}
              className="bg-input h-12 flex-1 border-0"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-12 shrink-0 rounded-[14px] px-4"
              onClick={addParticipantSafe}
              disabled={!participantInput.trim()}
            >
              추가
            </Button>
          </div>
          {participantInput && filteredMembers.length > 0 && (
            <div className="bg-popover absolute top-full z-10 mt-1 w-full rounded-[14px] border p-1 shadow-lg">
              {filteredMembers.slice(0, 5).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="hover:bg-muted w-full rounded-lg px-3 py-2 text-left text-sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addParticipant(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 태그 */}
      <div className="space-y-2">
        <Label>태그</Label>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1 rounded-full py-1 pr-1.5 pl-3">
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="flex gap-2">
            <Input
              placeholder="태그 입력 (예: 소설, 철학, 번개모임)"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                tagValueRef.current = e.target.value;
              }}
              onCompositionEnd={(e) => {
                const val = (e.target as HTMLInputElement).value;
                setTagInput(val);
                tagValueRef.current = val;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addTagSafe();
                }
              }}
              className="bg-input h-12 flex-1 border-0"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-12 shrink-0 rounded-[14px] px-4"
              onClick={addTagSafe}
              disabled={!tagInput.trim()}
            >
              추가
            </Button>
          </div>
          {tagInput && filteredTags.length > 0 && (
            <div className="bg-popover absolute top-full z-10 mt-1 w-full rounded-[14px] border p-1 shadow-lg">
              {filteredTags.slice(0, 5).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="hover:bg-muted w-full rounded-lg px-3 py-2 text-left text-sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTag(t)}
                >
                  {t}
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

      {/* 사진 첨부 */}
      <div className="space-y-2">
        <Label>사진</Label>
        {(existingPhotos.length > 0 || photoPreviews.length > 0) && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={[
                ...existingPhotos.map((_, i) => `existing-${i}`),
                ...photoPreviews.map((_, i) => `new-${i}`),
              ]}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-4 gap-2">
                {existingPhotos.map((url, i) => (
                  <SortablePhotoItem
                    key={`existing-${i}`}
                    id={`existing-${i}`}
                    src={url}
                    alt={`사진 ${i + 1}`}
                    onRemove={() => removeExistingPhoto(i)}
                  />
                ))}
                {photoPreviews.map((url, i) => (
                  <SortablePhotoItem
                    key={`new-${i}`}
                    id={`new-${i}`}
                    src={url}
                    alt={`새 사진 ${i + 1}`}
                    onRemove={() => removeNewPhoto(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {existingPhotos.length + photoFiles.length < 10 && (
          <>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="border-border text-muted-foreground hover:bg-muted flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed text-sm"
            >
              <Camera className="h-4 w-4" />
              사진 추가 (최대 10장)
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="sr-only"
            />
          </>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && <p className="text-destructive text-center text-sm">{error}</p>}

      {/* 제출 */}
      <Button type="submit" className="h-12 w-full rounded-[14px]" disabled={saving}>
        {saving ? "저장 중..." : isEdit ? "수정하기" : "기록하기"}
      </Button>
    </form>
  );
}
