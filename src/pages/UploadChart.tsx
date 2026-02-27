import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, X, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getStoredProfile } from "@/lib/profile";
import { toast } from "sonner";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

interface SectionItem {
  title: string;
  content: string;
  source?: string;
}

interface EasternResult {
  overview: string;
  sections: SectionItem[];
  daiVan?: string[];
  tieuVan?: string[];
}

const UploadChart = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EasternResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, lang } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.upload.title", descriptionKey: "seo.upload.desc", path: "/upload-chart" },
  });

  const handleFile = (selected: File) => {
    if (!selected.type.match(/image\/(png|jpeg|jpg)/)) return;
    setFile(selected);
    setFileName(selected.name);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const clear = () => {
    setPreview(null);
    setFileName("");
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file || !preview) {
      toast.error(t("upload.invalidFile"));
      return;
    }
    const profile = getStoredProfile();
    if (!profile) {
      toast.error(t("upload.missingProfile"));
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const base64 = preview.split(",")[1];
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/oracle-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: t("upload.prompt"),
            },
          ],
          module: "eastern_upload",
          lang,
          stream: false,
          responseFormat: "json",
          profile,
          image: {
            data: base64,
            mimeType: file.type,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze");
      const data = await response.json();
      const parsed = JSON.parse(data.response) as EasternResult;
      setResult(parsed);
    } catch (error) {
      console.error("Upload analysis error:", error);
      toast.error(t("upload.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{t("upload.title")}</h1>
        <p className="mb-8 text-muted-foreground">{t("upload.subtitle")}</p>

        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-8 text-center transition-colors hover:border-primary/40 cursor-pointer sm:p-10"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Chart preview" className="max-h-64 rounded-lg" />
              <button onClick={(e) => { e.stopPropagation(); clear(); }} className="absolute -right-2 -top-2 rounded-full bg-foreground/10 p-1 hover:bg-foreground/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : fileName ? (
            <div className="flex items-center gap-2">
              <FileImage className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">{fileName}</span>
              <button onClick={(e) => { e.stopPropagation(); clear(); }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">{t("upload.click")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("upload.formats")}</p>
            </>
          )}
        </div>

        <Button className="mt-6 w-full" size="lg" onClick={handleAnalyze} disabled={loading || !file}>
          {loading ? t("upload.analyzing") : t("upload.analyze")}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">{t("upload.note")}</p>

        {result && (
          <div className="mt-10 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">{t("upload.overviewTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{result.overview}</p>
            </div>
            {(result.sections || []).map((section) => (
              <div key={section.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{section.content}</p>
                {section.source && <p className="mt-2 text-xs text-muted-foreground">{section.source}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
  );
};

export default UploadChart;
