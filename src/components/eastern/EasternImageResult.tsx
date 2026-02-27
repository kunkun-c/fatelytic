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
  compatibilityScore,
}: EasternImageResultProps) {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex]);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ảnh minh hoạ người hôn phối</h2>
            {typeof compatibilityScore === "number" ? (
              <p className="mt-2 text-sm text-foreground">
                <span className="font-medium">Tỉ lệ tương thích:</span> {compatibilityScore}%
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((img, idx) => {
          const src = objectUrls[idx];
          return (
            <div key={idx} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
              {src ? (
                <button
                  type="button"
                  className="block w-full"
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img
                    src={src}
                    alt={`Generated ${idx + 1}`}
                    className="w-full rounded-xl transition-transform hover:scale-[1.01]"
                  />
                </button>
              ) : null}
              <div className="mt-3 flex items-center justify-end">
                {src ? (
                  <a href={src} download={`partner-portrait-${idx + 1}.jpg`}>
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

      {lightboxIndex !== null && objectUrls[lightboxIndex] ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-h-full max-w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={objectUrls[lightboxIndex]}
              alt={`Generated ${lightboxIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute right-2 top-2"
              onClick={() => setLightboxIndex(null)}
            >
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
