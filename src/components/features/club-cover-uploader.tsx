"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, Users } from "lucide-react";

interface ClubCoverUploaderProps {
  clubId: string;
  initialUrl: string | null;
}

export function ClubCoverUploader({ clubId, initialUrl }: ClubCoverUploaderProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하만 가능합니다.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);

      const res = await fetch(`/api/club/${clubId}/cover`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setCoverUrl(data.coverUrl);
      }
    } catch {
      // 무시
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full"
    >
      {coverUrl ? (
        <Image src={coverUrl} alt="모임 사진" fill sizes="64px" className="object-cover" />
      ) : (
        <div className="bg-muted flex h-full w-full items-center justify-center">
          <Users className="text-muted-foreground h-6 w-6" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <Camera className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="sr-only"
      />
    </button>
  );
}
