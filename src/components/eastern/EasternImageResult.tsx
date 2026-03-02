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

export default function EasternImageResult({
  images,
  compatibilityScore,
  compatibilityRationale,
  spousePortraitDirection,
}: EasternImageResultProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!images || images.length === 0) {
      setImageUrls([]);
      return;
    }

    let cancelled = false;
    const createdObjectUrls: string[] = [];

    const buildUrls = async () => {
      const urls = await Promise.all(
        images.map(async (img) => {
          const raw = String(img.data ?? "").trim();
          const dataUrl = raw.startsWith("data:") ? raw : `data:${img.mimeType};base64,${raw}`;

          try {
            const blob = await (await fetch(dataUrl)).blob();
            const objUrl = URL.createObjectURL(blob);
            createdObjectUrls.push(objUrl);
            return objUrl;
          } catch {
            return dataUrl;
          }
        })
      );

      if (cancelled) return;
      setImageUrls(urls);
    };

    void buildUrls();

    return () => {
      cancelled = true;
      for (const url of createdObjectUrls) URL.revokeObjectURL(url);
    };
  }, [images]);

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

        {(spousePortraitDirection || compatibilityRationale) && (
          <div className="mt-4 space-y-3">
            {spousePortraitDirection ? (
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-sm font-semibold text-foreground">Hướng phác hoạ (từ lá số)</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{spousePortraitDirection}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-3 shadow-sm">
          {images.map((img, idx) => {
            const src = imageUrls[idx];
            return (
              <div key={idx}>
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
                    <a href={src} download={`partner-portrait-${idx + 1}`}>
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

      {lightboxIndex !== null && imageUrls[lightboxIndex] ? (
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
              src={imageUrls[lightboxIndex]}
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
