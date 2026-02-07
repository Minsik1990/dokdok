import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 인메모리 rate limit (IP당 5회/분)
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (record.count >= 5) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "너무 많은 시도입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const accessCode = body.accessCode?.trim();

  if (!accessCode) {
    return NextResponse.json({ error: "접속 코드를 입력해주세요." }, { status: 400 });
  }

  const supabase = createClient();
  const { data: club, error } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("access_code", accessCode)
    .maybeSingle();

  if (error) {
    console.error("[verify] supabase error:", error.message);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }

  if (!club) {
    return NextResponse.json({ error: "존재하지 않는 접속 코드입니다." }, { status: 404 });
  }

  // 쿠키에 club_id 설정
  const response = NextResponse.json({ clubId: club.id, clubName: club.name });
  response.cookies.set("club_id", club.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: "/",
  });

  return response;
}
