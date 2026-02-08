import imageCompression from "browser-image-compression";

/**
 * 업로드 전 이미지를 압축합니다.
 * - 최대 1920px 리사이즈
 * - WebP 변환
 * - 최대 0.5MB
 */
export async function compressImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp",
  });

  // 파일명 확장자를 .webp로 변경
  const name = file.name.replace(/\.[^.]+$/, ".webp");
  return new File([compressed], name, { type: "image/webp" });
}
