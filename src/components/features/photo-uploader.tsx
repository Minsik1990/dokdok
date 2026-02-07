"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PhotoUploaderProps {
  clubId: string;
  sessionId: string;
  initialPhotos: string[];
}

export function PhotoUploader({ clubId, sessionId, initialPhotos }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number>(0);

  const lightboxOpen = lightboxIndex !== null;

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
      const formData = new FormData();
      for (const file of files) {
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

  async function handleDelete(photoUrl: string) {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;

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
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-lg">
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="h-full w-full cursor-zoom-in"
              >
                <Image
                  src={url}
                  alt={`사진 ${i + 1}`}
                  fill
                  sizes="(max-width: 480px) 33vw, 150px"
                  className="object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(url)}
                disabled={deleting === url}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-1"
              >
                {deleting === url ? (
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                ) : (
                  <X className="h-3 w-3 text-white" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-sm">
          아직 사진이 없습니다. 모임 사진을 추가해보세요!
        </p>
      )}

      {error && <p className="text-destructive mt-2 text-center text-sm">{error}</p>}

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
