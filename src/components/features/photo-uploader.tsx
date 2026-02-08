"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, GripVertical, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

interface PhotoUploaderProps {
  clubId: string;
  sessionId: string;
  initialPhotos: string[];
}

function SortablePhoto({
  id,
  url,
  index,
  isDeletingThis,
  onClickPhoto,
  onRequestDelete,
}: {
  id: string;
  url: string;
  index: number;
  isDeletingThis: boolean;
  onClickPhoto: () => void;
  onRequestDelete: () => void;
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
      <button type="button" onClick={onClickPhoto} className="h-full w-full cursor-zoom-in">
        <Image
          src={url}
          alt={`사진 ${index + 1}`}
          fill
          sizes="(max-width: 480px) 33vw, 150px"
          className="object-cover"
        />
      </button>
      {/* 드래그 핸들 */}
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
      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete();
        }}
        disabled={isDeletingThis}
        className="absolute top-0 right-0 flex min-h-[44px] min-w-[44px] items-start justify-end p-1.5"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50">
          {isDeletingThis ? (
            <Loader2 className="h-3 w-3 animate-spin text-white" />
          ) : (
            <X className="h-3 w-3 text-white" />
          )}
        </span>
      </button>
    </div>
  );
}

export function PhotoUploader({ clubId, sessionId, initialPhotos }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number>(0);

  const lightboxOpen = lightboxIndex !== null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : prev));
  }, [photos.length]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "ArrowRight") goToNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, goToPrev, goToNext]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  }

  // 드래그로 순서 변경
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.indexOf(String(active.id));
    const newIndex = photos.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const previousPhotos = [...photos];
    const reordered = arrayMove(photos, oldIndex, newIndex);
    setPhotos(reordered);

    // 서버에 순서 저장
    try {
      const res = await fetch(`/api/club/${clubId}/sessions/${sessionId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: reordered }),
      });
      if (!res.ok) {
        setPhotos(previousPhotos);
      }
    } catch {
      setPhotos(previousPhotos);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 10) {
      setError("사진은 최대 10장까지 업로드 가능합니다.");
      return;
    }

    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        setError("파일 크기는 5MB 이하만 가능합니다.");
        return;
      }
    }

    setError("");
    setUploading(true);

    try {
      // 업로드 전 이미지 압축 (1920px, WebP, ~300-500KB)
      const compressed = await Promise.all(files.map((f) => compressImage(f)));

      const formData = new FormData();
      for (const file of compressed) {
        formData.append("photos", file);
      }

      const res = await fetch(`/api/club/${clubId}/sessions/${sessionId}/photos`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setPhotos(data.photos);
      } else {
        setError(data.error || "업로드에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    const photoUrl = deleteTarget;
    setDeleteTarget(null);
    setDeleting(photoUrl);
    setError("");

    try {
      const res = await fetch(`/api/club/${clubId}/sessions/${sessionId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setPhotos(data.photos);
      } else {
        setError(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">사진</h3>
        {photos.length < 10 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-primary flex items-center gap-1 text-xs font-medium"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {uploading ? "업로드 중..." : "사진 추가"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="sr-only"
        />
      </div>

      {photos.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <SortablePhoto
                  key={url}
                  id={url}
                  url={url}
                  index={i}
                  isDeletingThis={deleting === url}
                  onClickPhoto={() => setLightboxIndex(i)}
                  onRequestDelete={() => setDeleteTarget(url)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-sm">
          아직 사진이 없습니다. 모임 사진을 추가해보세요!
        </p>
      )}

      {error && <p className="text-destructive mt-2 text-center text-sm">{error}</p>}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle>사진 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 사진을 삭제하시겠습니까? 삭제된 사진은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[14px]">취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-[14px]"
              onClick={handleDeleteConfirm}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="h-screen w-screen max-w-none rounded-none border-0 bg-black/95 p-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <DialogTitle className="sr-only">사진 확대 보기</DialogTitle>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 이전 버튼 */}
          {lightboxIndex !== null && lightboxIndex > 0 && (
            <button
              type="button"
              onClick={goToPrev}
              className="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* 다음 버튼 */}
          {lightboxIndex !== null && lightboxIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={goToNext}
              className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* 이미지 */}
          {lightboxIndex !== null && (
            <div className="flex h-full w-full items-center justify-center p-12">
              <Image
                src={photos[lightboxIndex]}
                alt={`사진 ${lightboxIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          )}

          {/* 인디케이터 */}
          {lightboxIndex !== null && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/70">
              {lightboxIndex + 1} / {photos.length}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
