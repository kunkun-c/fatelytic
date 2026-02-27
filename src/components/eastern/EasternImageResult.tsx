import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

type GeneratedImage = {
  mimeType: string;
  data: string;
};

interface EasternImageResultProps {
  images: GeneratedImage[];
  imagenPrompt?: string | null;
  imagenPromptVi?: string | null;
  compatibilityScore?: number | null;
  compatibilityRationale?: string | null;
  spousePortraitDirection?: string | null;
  onRegenerate?: () => void;
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

export default function EasternImageResult({
  images,
  imagenPrompt,
  imagenPromptVi,
  compatibilityScore,
  compatibilityRationale,
  spousePortraitDirection,
}: EasternImageResultProps) {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  const blobs = useMemo(() => {
    if (!images || images.length === 0) return [];
    return images.map((img) => base64ToBlob(img.data, img.mimeType));
  }, [images]);

  useEffect(() => {
    if (!blobs || blobs.length === 0) {
      setObjectUrls([]);
      return;
    }

    const urls = blobs.map((b) => URL.createObjectURL(b));
    setObjectUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [blobs]);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ảnh minh hoạ người hôn phối</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ảnh mang tính biểu tượng, chỉ dùng để tham khảo thẩm mỹ.</p>
            {typeof compatibilityScore === "number" ? (
              <p className="mt-2 text-sm text-foreground">
                <span className="font-medium">Tỉ lệ tương thích:</span> {compatibilityScore}%
              </p>
            ) : null}
            {compatibilityRationale ? (
              <p className="mt-1 text-sm text-muted-foreground">{compatibilityRationale}</p>
            ) : null}
            {spousePortraitDirection ? (
              <p className="mt-2 text-sm text-muted-foreground">{spousePortraitDirection}</p>
            ) : null}
          </div>
        </div>

        {imagenPromptVi ? (
          <details className="mt-4 rounded-xl border border-border bg-background p-4" open>
            <summary className="cursor-pointer select-none text-sm font-medium text-foreground">Prompt (Tiếng Việt)</summary>
            <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-muted-foreground">{imagenPromptVi}</pre>
          </details>
        ) : null}

        {imagenPrompt ? (
          <details className="mt-4 rounded-xl border border-border bg-background p-4">
            <summary className="cursor-pointer select-none text-sm font-medium text-foreground">Prompt (English)</summary>
            <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-muted-foreground">{imagenPrompt}</pre>
          </details>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((img, idx) => {
          const src = objectUrls[idx];
          const fileExt = img.mimeType === "image/jpeg" ? "jpg" : "png";
          return (
            <div key={idx} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
              {src ? <img src={src} alt={`Generated ${idx + 1}`} className="w-full rounded-xl" /> : null}
              <div className="mt-3 flex items-center justify-end">
                {src ? (
                  <a href={src} download={`partner-portrait-${idx + 1}.${fileExt}`}>
                    <Button size="sm" variant="outline">
                      Tải ảnh
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
