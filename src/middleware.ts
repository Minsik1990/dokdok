import { NextResponse, type NextRequest } from "next/server";

// 정확히 일치해야 하는 공개 경로
const PUBLIC_EXACT = ["/", "/api/club", "/api/club/verify", "/api/club/leave", "/api/books/search"];
// prefix 일치 허용 경로
const PUBLIC_PREFIX = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로 통과
  if (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIX.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // 정적 파일 통과
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // /club/[id]/* 또는 /api/club/[id]/* 경로: 쿠키에서 club_id 확인
  const clubMatch = pathname.match(/^\/(?:api\/)?club\/([^/]+)/);
  if (clubMatch) {
    const urlClubId = clubMatch[1];
    const cookieClubId = request.cookies.get("club_id")?.value;

    if (!cookieClubId || cookieClubId !== urlClubId) {
      // API 경로는 403 반환, 페이지 경로는 리다이렉트
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.png).*)"],
};
