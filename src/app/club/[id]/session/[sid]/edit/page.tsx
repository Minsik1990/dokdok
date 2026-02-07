import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionForm } from "@/components/features/session-form";
import type { Database } from "@/lib/supabase/database.types";

type ClubSession = Database["public"]["Tables"]["club_sessions"]["Row"];
type Book = Database["public"]["Tables"]["books"]["Row"];
type SessionWithBook = ClubSession & { books: Book | null };

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>;
}) {
  const { id: clubId, sid } = await params;
  const supabase = createClient();

  const { data } = await supabase
    .from("club_sessions")
    .select("*, books(*)")
    .eq("id", sid)
    .eq("club_id", clubId)
    .maybeSingle();

  if (!data) notFound();

  const session = data as unknown as SessionWithBook;
  const book = session.books;

  const initialData = {
    bookId: session.book_id,
    book: book
      ? {
          isbn: book.isbn ?? "",
          title: book.title,
          author: book.author ?? "",
          publisher: book.publisher ?? "",
          coverUrl: book.cover_image_url ?? "",
          description: book.description ?? "",
        }
      : null,
    sessionDate: session.session_date,
    presenter: session.presenter ?? "",
    participants: session.participants ?? [],
    presentationText: session.presentation_text ?? "",
    content: session.content ?? "",
    photos: session.photos ?? [],
  };

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">모임 기록 수정</h2>
      <SessionForm clubId={clubId} initialData={initialData} sessionId={sid} />
    </div>
  );
}
