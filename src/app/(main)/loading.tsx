export default function Loading() {
  return (
    <div className="space-y-4">
      {/* 제목 스켈레톤 */}
      <div className="bg-muted h-7 w-32 animate-pulse rounded-[14px]" />

      {/* 카드 스켈레톤 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-[20px] border p-5">
          <div className="bg-muted h-20 w-14 flex-shrink-0 animate-pulse rounded-[14px]" />
          <div className="flex-1 space-y-2.5">
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded-[8px]" />
            <div className="bg-muted h-3 w-1/2 animate-pulse rounded-[8px]" />
            <div className="bg-muted h-3 w-1/4 animate-pulse rounded-[8px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
