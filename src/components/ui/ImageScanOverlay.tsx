import React from "react";

interface ImageScanOverlayProps {
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function ImageScanOverlay({ loading = false, children, className = "" }: ImageScanOverlayProps) {
  if (!loading) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      <div className={loading ? "opacity-70" : ""}>
        {children}
      </div>
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-cyan-500/50 opacity-80 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent animate-pulse" />
        <div className="absolute inset-0">
          <div
            className="h-full w-full bg-gradient-to-b from-transparent via-blue-500/70 to-transparent animate-pulse"
            style={{ animation: "scan 2s linear infinite" }}
          />
          <div
            className="h-full w-full bg-gradient-to-r from-transparent via-purple-500/60 to-transparent animate-pulse"
            style={{ animation: "scan 3s linear infinite reverse" }}
          />
        </div>
        <div
          className="absolute inset-0 bg-grid-pattern opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            animation: "grid-fade 4s ease-in-out infinite",
          }}
        />
      </div>
      <div className="absolute -top-2 -left-2 flex gap-1">
        <div className="h-3 w-3 bg-blue-500 rounded-full animate-ping shadow-lg shadow-blue-500/50" />
        <div
          className="h-3 w-3 bg-purple-500 rounded-full animate-ping shadow-lg shadow-purple-500/50"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="h-3 w-3 bg-cyan-500 rounded-full animate-ping shadow-lg shadow-cyan-500/50"
          style={{ animationDelay: "1s" }}
        />
      </div>
      <div className="absolute -bottom-2 -right-2 flex gap-1">
        <div
          className="h-3 w-3 bg-green-500 rounded-full animate-ping shadow-lg shadow-green-500/50"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="h-3 w-3 bg-yellow-500 rounded-full animate-ping shadow-lg shadow-yellow-500/50"
          style={{ animationDelay: "2s" }}
        />
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes scan {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100%); }
            }
            @keyframes grid-fade {
              0%, 100% { opacity: 0.1; }
              50% { opacity: 0.3; }
            }
          `,
        }}
      />
    </div>
  );
}
