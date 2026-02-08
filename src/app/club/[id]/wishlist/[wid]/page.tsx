import Image from "next/image";
import { notFound } from "next/navigation";
import { BookOpen, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteWishlistButton } from "@/components/features/delete-wishlist-button";
import { WishlistComments } from "@/components/features/wishlist-comments";
import { ExpandableText } from "@/components/features/expandable-text";

interface WishlistWithBook {
  id: string;
  club_id: string;
  created_at: string | null;
  books: {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
    cover_image_url: string | null;
    description: string | null;
    info_url: string | null;
  } | null;
}

export default async function WishlistDetailPage({
  params,
}: {
  params: Promise<{ id: string; wid: string }>;
}) {
  const { id: clubId, wid } = await params;
  const supabase = createClient();

  const { data } = await supabase
    .from("wishlist_books")
    .select(
      "id, club_id, created_at, books(id, title, author, publisher, cover_image_url, description, info_url)"
    )
    .eq("id", wid)
    .eq("club_id", clubId)
    .maybeSingle();

  if (!data) notFound();

  const wishlist = data as unknown as WishlistWithBook;
  const book = wishlist.books;

  return (
    <div className="space-y-6">
      {/* 상단 액션 */}
      <div className="flex justify-end">
        <DeleteWishlistButton clubId={clubId} wishlistBookId={wid} />
      </div>

      {/* 책 정보 */}
      {book && (
        <div className="bg-card flex gap-4 rounded-[20px] p-4 shadow-sm">
          <div className="bg-muted relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg">
            {book.cover_image_url ? (
              <Image
                src={book.cover_image_url}
                alt={book.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="text-muted-foreground h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold">{book.title}</h2>
            {book.author && <p className="text-muted-foreground mt-0.5 text-sm">{book.author}</p>}
            {book.publisher && <p className="text-muted-foreground text-xs">{book.publisher}</p>}
          </div>
        </div>
      )}

      {/* 책 설명 */}
      {book?.description && (
        <div className="bg-card rounded-[20px] p-4 shadow-sm">
          <h3 className="text-foreground mb-2 text-sm font-semibold">책 소개</h3>
          <ExpandableText text={book.description} maxLines={4} />
          {book.info_url && (
            <a
              href={book.info_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium"
            >
              다음에서 전체 소개 보기
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {/* 댓글 */}
      <div className="bg-card rounded-[20px] p-4 shadow-sm">
        <WishlistComments clubId={clubId} wishlistBookId={wid} />
      </div>
    </div>
  );
}
