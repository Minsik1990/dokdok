import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/features/star-rating";
import { StatusBadge } from "@/components/features/status-badge";
import type { RecordWithBook } from "@/lib/supabase/types";

const CARD_COLORS: Record<string, string> = {
  white: "bg-card",
  parchment: "bg-[#FEF9EF]",
  sage: "bg-[#EEF2FF]",
  linen: "bg-[#F5F3FF]",
  moss: "bg-[#ECFDF5]",
  sand: "bg-[#FFF7ED]",
  mist: "bg-[#EFF6FF]",
};

export const RecordCard = memo(function RecordCard({ record }: { record: RecordWithBook }) {
  const book = record.books;
  const colorClass = CARD_COLORS[record.card_color] || CARD_COLORS.white;

  return (
    <Link href={`/record/${record.id}`}>
      <Card className={`${colorClass} transition-all hover:-translate-y-0.5 hover:shadow-sm`}>
        <CardContent className="flex gap-3 py-4">
          {book?.cover_image_url ? (
            <Image
              src={book.cover_image_url}
              alt={book.title}
              width={48}
              height={64}
              sizes="48px"
              className="h-16 w-12 flex-shrink-0 rounded object-cover"
              loading="lazy"
            />
          ) : (
            <div className="bg-muted flex h-16 w-12 flex-shrink-0 items-center justify-center rounded">
              <BookOpen className="text-muted-foreground h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold">{book?.title ?? "책 정보 없음"}</p>
              <StatusBadge status={record.status} />
            </div>
            {book?.author && (
              <p className="text-muted-foreground truncate text-xs">{book.author}</p>
            )}
            {record.rating && (
              <div className="mt-1">
                <StarRating value={record.rating} readonly size="sm" />
              </div>
            )}
            {record.summary && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{record.summary}</p>
            )}
            {!record.summary && record.content && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{record.content}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
