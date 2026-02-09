import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("club_sessions")
    .select("*, books(*)")
    .eq("club_id", clubId)
    .order("session_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const supabase = createClient();

  // 책 정보가 있으면 books 테이블에 upsert
  let bookId: string | null = null;
  if (body.book) {
    const { isbn, title, author, publisher, coverUrl, description } = body.book;

    // ISBN으로 기존 책 조회
    if (isbn) {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("isbn", isbn)
        .maybeSingle();

      if (existing) {
        bookId = existing.id;
        // 기존 책의 누락된 필드 업데이트
        const updates: Record<string, string> = {};
        if (description) updates.description = description;
        if (Object.keys(updates).length > 0) {
          await supabase.from("books").update(updates).eq("id", existing.id);
        }
      }
    }

    // 없으면 새로 삽입
    if (!bookId) {
      const { data: newBook } = await supabase
        .from("books")
        .insert({
          isbn: isbn || null,
          title,
          author,
          publisher,
          cover_image_url: coverUrl || null,
          description: description || null,
        })
        .select("id")
        .single();

      if (newBook) bookId = newBook.id;
    }
  }

  // 세션 번호 자동 계산: 같은 날짜의 기존 세션이 있으면 동일 번호 부여
  let sessionNumber = body.sessionNumber;
  if (!sessionNumber) {
    // 같은 날짜에 이미 세션이 있는지 확인
    const { data: sameDateSession } = await supabase
      .from("club_sessions")
      .select("session_number")
      .eq("club_id", clubId)
      .eq("session_date", body.sessionDate)
      .limit(1)
      .maybeSingle();

    if (sameDateSession?.session_number) {
      sessionNumber = sameDateSession.session_number;
    } else {
      const { data: maxSession } = await supabase
        .from("club_sessions")
        .select("session_number")
        .eq("club_id", clubId)
        .order("session_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      sessionNumber = (maxSession?.session_number ?? 0) + 1;
    }
  }

  // 세션 생성
  const { data: session, error } = await supabase
    .from("club_sessions")
    .insert({
      club_id: clubId,
      book_id: bookId,
      session_number: sessionNumber,
      session_date: body.sessionDate,
      presenter: body.presenter || [],
      participants: body.participants || [],
      presentation_text: body.presentationText || null,
      content: body.content || null,
      photos: body.photos || [],
      is_counted: body.isCounted ?? true,
      tags: Array.isArray(body.tags)
        ? body.tags
            .filter((t: unknown) => typeof t === "string")
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0 && t.length <= 50)
            .slice(0, 20)
        : [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 멤버 이름 자동 등록 (자동완성용)
  const names = new Set<string>();
  if (body.presenter) (body.presenter as string[]).forEach((n: string) => names.add(n));
  if (body.participants) (body.participants as string[]).forEach((n: string) => names.add(n));

  if (names.size > 0) {
    const membersToInsert = Array.from(names).map((name) => ({
      club_id: clubId,
      name,
    }));
    // 중복 무시
    await supabase.from("members").upsert(membersToInsert, {
      onConflict: "club_id,name",
      ignoreDuplicates: true,
    });
  }

  return NextResponse.json({ session }, { status: 201 });
}
