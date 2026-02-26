import { cn } from "@/lib/utils";

interface MysticLoaderProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: { wrapper: "h-4 w-4", dot: "h-1.5 w-1.5", ring: "h-6 w-6" },
  md: { wrapper: "h-5 w-5", dot: "h-2 w-2", ring: "h-8 w-8" },
  lg: { wrapper: "h-6 w-6", dot: "h-2.5 w-2.5", ring: "h-10 w-10" },
} as const;

export function MysticLoader({ size = "md", label, className }: MysticLoaderProps) {
  const styles = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center justify-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", styles.ring)}>
        {/* Outer rotating ring */}
        <div 
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            background: "linear-gradient(45deg, #8b5cf6, #3b82f6, #ec4899, #8b5cf6)",
            backgroundSize: "200% 200%",
          }}
        />
        
        {/* Inner mystical core */}
        <div className="absolute inset-1 flex items-center justify-center">
          <div className={cn("relative flex items-center justify-center", styles.wrapper)}>
            {/* Glowing center */}
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-100 animate-pulse shadow-xl",
              styles.wrapper
            )} />
            
            {/* Mystic symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "rounded-full bg-white shadow-2xl",
                styles.dot
              )} />
            </div>
            
            {/* Energy particles */}
            <div className="absolute inset-0">
              <div className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping shadow-md",
                styles.dot
              )} />
              <div className={cn(
                "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping shadow-md",
                styles.dot
              )} style={{ animationDelay: "0.2s" }} />
              <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping shadow-md",
                styles.dot
              )} style={{ animationDelay: "0.4s" }} />
              <div className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping shadow-md",
                styles.dot
              )} style={{ animationDelay: "0.6s" }} />
            </div>
          </div>
        </div>
      </div>
      
      {label && (
        <span className="text-sm font-semibold text-primary animate-pulse bg-background px-2 py-1 rounded-md shadow-sm">
          {label}
        </span>
      )}
    </div>
  );
}
