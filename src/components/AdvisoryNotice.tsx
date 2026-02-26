import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AdvisoryNoticeProps {
  className?: string;
  compact?: boolean;
}

export default function AdvisoryNotice({ className, compact = false }: AdvisoryNoticeProps) {
  const [showFull, setShowFull] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFull(false);
      setIsCollapsed(true);
    }, 5000); // Hiển thị đầy đủ trong 5 giây

    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    if (isCollapsed) {
      setShowFull(true);
      setIsCollapsed(false);
      // Tự động ẩn lại sau 10 giây khi click để mở
      setTimeout(() => {
        setShowFull(false);
        setIsCollapsed(true);
      }, 5000);
    }
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border border-border bg-muted/30 hover:bg-muted/50 transition-all duration-200 shadow-sm hover:shadow-md",
            "text-primary/80 hover:text-primary"
          )}
          title="Xem thông tin tư vấn"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 transition-all duration-500",
        compact && "px-3 py-2",
        !showFull && "px-2 py-2 bg-muted/30 border-muted/50",
        className
      )}
    >
      <div className="mt-0.5 shrink-0 transition-all duration-500">
        <Info 
          className={cn(
            compact ? "h-4 w-4" : "h-5 w-5",
            !showFull && "text-primary/80 h-5 w-5 cursor-pointer hover:text-primary",
            showFull && "cursor-pointer hover:text-primary/80"
          )} 
          onClick={handleToggle}
        />
      </div>
      {showFull && (
        <p className={cn("text-muted-foreground leading-relaxed animate-fade-in", compact ? "text-xs" : "text-sm")}>
          Nội dung được tạo bởi trí tuệ nhân tạo, chỉ mang tính tham khảo và hỗ trợ tự suy ngẫm.
          Không thay thế tư vấn y tế, pháp lý hay tài chính chuyên môn.
        </p>
      )}
    </div>
  );
}
