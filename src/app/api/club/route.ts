import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

// 인메모리 rate limit (IP당 3회/시간 — 모임 생성 남용 방지)
const createAttempts = new Map<string, { count: number; resetAt: number }>();

function checkCreateRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = createAttempts.get(ip);

  if (!record || now > record.resetAt) {
    createAttempts.set(ip, { count: 1, resetAt: now + 3600_000 });
    return true;
  }

  if (record.count >= 3) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (!checkCreateRateLimit(ip)) {
    return NextResponse.json(
      { error: "모임 생성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { name, description, accessCode, adminPassword } = body;

  if (!name || !accessCode || !adminPassword) {
    return NextResponse.json(
      { error: "모임 이름, 접속 코드, 관리자 비밀번호는 필수입니다." },
      { status: 400 }
    );
  }

  if (accessCode.length < 2) {
    return NextResponse.json({ error: "접속 코드는 2자 이상이어야 합니다." }, { status: 400 });
  }

  if (adminPassword.length < 4) {
    return NextResponse.json(
      { error: "관리자 비밀번호는 4자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // 접속 코드 중복 확인
  const { data: existing } = await supabase
    .from("clubs")
    .select("id")
    .eq("access_code", accessCode)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "이미 사용 중인 접속 코드입니다. 다른 코드를 입력하세요." },
      { status: 409 }
    );
  }

  // 비밀번호 해시
  const hash = await bcrypt.hash(adminPassword, 10);

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      name,
      description: description || null,
      access_code: accessCode,
      admin_password_hash: hash,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clubId: club.id }, { status: 201 });
}
