import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Sparkles, Briefcase, Heart, Wallet, Activity, Calendar, ImagePlus, FileImage, X, ChevronDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import ChatPanel from "@/components/ChatPanel";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import EasternUploadResult from "@/components/eastern/EasternUploadResult";
import EasternAnalysisResult from "@/components/eastern/EasternAnalysisResult";
import EasternImageResult from "@/components/eastern/EasternImageResult";
import { getStoredProfile } from "@/lib/profile";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { Link, useLocation } from "react-router-dom";

interface SectionItem {
  title: string;
  content: string;
  source?: string;
}

interface QuoteItem {
  heading?: string;
  text: string;
  source?: string;
}

interface PalaceSection {
  title: string;
  items: Array<{ text: string; source?: string }>;
}

interface TopicItem {
  id: string;
  label: string;
  target: string;
}

interface PeriodSection {
  label: string;
  items: Array<{ text: string; source?: string }>;
}

interface EasternResult {
  overview: string;
  sections: SectionItem[];
  overviewQuotes?: string[];
  detailSections?: SectionItem[];
  daiVan?: string[];
  tieuVan?: string[];
  overviewItems?: QuoteItem[];
  palaceSections?: PalaceSection[];
  topics?: TopicItem[];
  daiVanSections?: PeriodSection[];
  tieuVanSections?: PeriodSection[];
}

interface OptionItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  prompt: string;
}

const EasternAstrology = () => {
  const { t, lang } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.eastern.title", descriptionKey: "seo.eastern.desc", path: "/eastern-astrology" },
    disableContentWrapper: true,
    showAdvisoryNotice: true,
    advisoryNoticeCompact: true,
  });
  const { user } = useAuth();
  const location = useLocation();
  const profile = getStoredProfile();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [extraQuestion, setExtraQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EasternResult | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openPalaceId, setOpenPalaceId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const [selectedDaiVanIndex, setSelectedDaiVanIndex] = useState(0);
  const [selectedTieuVanIndex, setSelectedTieuVanIndex] = useState(0);

  const [qaOpen, setQaOpen] = useState(false);
  const [qaSessionKey, setQaSessionKey] = useState<string | null>(null);
  const [lastReadingId, setLastReadingId] = useState<string | null>(null);

  const profileSummary = useMemo(() => {
    if (!profile) return "";
    return `${profile.fullName} — ${profile.dateOfBirth}${profile.timeOfBirth ? " · " + profile.timeOfBirth : ""} · ${profile.placeOfBirth}`;
  }, [profile]);

  const slugify = (value: string) => {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .trim();
  };

  const splitParagraphs = (text: string) => {
    return text
      .split(/\n\s*\n/g)
      .map((p) => p.trim())
      .filter(Boolean);
  };

  const isPalaceSectionTitle = (title: string) => {
    const t = title.toLowerCase();
    return (
      t.includes("cung mệnh") ||
      t.includes("cung than") ||
      t.includes("cung thân") ||
      t.includes("cung quan lộc") ||
      t.includes("cung tài bạch") ||
      t.includes("cung thiên di") ||
      t.includes("cung phúc đức") ||
      t.includes("cung phu thê") ||
      t.includes("cung điền trạch") ||
      t.includes("cung tật ách") ||
      t.includes("cung phụ mẫu") ||
      t.includes("cung huynh đệ") ||
      t.includes("cung tử tức") ||
      t.includes("cung nô bộc")
    );
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const focusSection = (id: string) => {
    if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    setHighlightId(id);
    highlightTimerRef.current = window.setTimeout(() => setHighlightId(null), 1400);
  };

  const renderMarkdown = (text: string) => {
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 text-sm leading-relaxed text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="mt-1">{children}</li>,
          br: () => <br />,
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  const options: OptionItem[] = [
    { id: "upload", label: "Tải lá số", desc: "Upload ảnh lá số tử vi để luận giải chi tiết", icon: Upload, prompt: "Luận giải chi tiết lá số tử vi từ ảnh" },
    { id: "overview", label: "Luận giải tổng quan", desc: "Phân tích toàn diện lá số dựa trên thông tin cá nhân", icon: Sparkles, prompt: "Luận giải tổng quan lá số tử vi của tôi" },
    { id: "career", label: "Sự nghiệp & Công danh", desc: "Phân tích cung Quan Lộc và xu hướng nghề nghiệp", icon: Briefcase, prompt: "Phân tích chi tiết về sự nghiệp và công danh trong lá số tử vi của tôi" },
    { id: "marriage", label: "Hôn nhân & Gia đạo", desc: "Luận giải cung Phu Thê và tình duyên", icon: Heart, prompt: "Phân tích chi tiết về hôn nhân, tình duyên và gia đạo trong lá số tử vi của tôi" },
    { id: "finance", label: "Tài chính & Tài vận", desc: "Phân tích cung Tài Bạch và vận tài lộc", icon: Wallet, prompt: "Phân tích chi tiết về tài chính và tài vận trong lá số tử vi của tôi" },
    { id: "health", label: "Sức khoẻ & Phúc đức", desc: "Luận giải cung Tật Ách và Phúc Đức", icon: Activity, prompt: "Phân tích chi tiết về sức khoẻ và phúc đức trong lá số tử vi của tôi" },
    { id: "fortune", label: "Thời vận & Đại vận", desc: "Xem vận hạn theo từng giai đoạn cuộc đời", icon: Calendar, prompt: "Phân tích đại vận và tiểu vận trong lá số tử vi của tôi" },
    { id: "image", label: "Ảnh minh hoạ vợ chồng", desc: "Tạo ảnh minh hoạ phong cách Á Đông", icon: ImagePlus, prompt: "" },
  ];

  const handleFile = (selected: File) => {
    if (!selected.type.match(/image\/(png|jpeg|jpg)/)) {
      toast.error("Vui lòng chọn ảnh PNG hoặc JPEG.");
      return;
    }
    setUploadFile(selected);
    setUploadFileName(selected.name);
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const clearUpload = () => {
    setUploadPreview(null);
    setUploadFileName("");
    setUploadFile(null);
    setResult(null);
    setStreamingText("");
    setOpenPalaceId(null);
    setHighlightId(null);
    setQaOpen(false);
    setQaSessionKey(null);
    setLastReadingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const stripJsonFences = (text: string) => {
    return text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  };

  const parseEasternResult = (raw: string) => {
    const cleaned = stripJsonFences(raw);
    return JSON.parse(cleaned) as EasternResult;
  };

  useEffect(() => {
    const state = location.state as { reading?: { id: string; input_json: Json; result_json: Json } } | null;
    const reading = state?.reading;
    if (!reading) return;

    const input = reading.input_json;
    const optionId =
      input && typeof input === "object" && !Array.isArray(input) && typeof (input as Record<string, unknown>).optionId === "string"
        ? ((input as Record<string, unknown>).optionId as string)
        : "upload";

    const fileName =
      input && typeof input === "object" && !Array.isArray(input) && typeof (input as Record<string, unknown>).uploadFileName === "string"
        ? ((input as Record<string, unknown>).uploadFileName as string)
        : "";

    setSelectedOption(optionId);
    setUploadFileName(fileName);
    setResult(reading.result_json as unknown as EasternResult);
    setLastReadingId(reading.id);
    setQaSessionKey(String(Date.now()));
    setStreamingText("");
    setLoading(false);
  }, [location.state]);

  const cancelInFlight = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const runAnalyze = async (optionId?: string, overrideQuestion?: string) => {
    if (!profile) {
      toast.error(t("eastern.missingProfile"));
      return;
    }

    const resolvedOptionId = optionId ?? selectedOption;
    const selected = options.find((o) => o.id === resolvedOptionId);
    const prompt = (overrideQuestion ?? extraQuestion).trim() || selected?.prompt || t("eastern.analyze");
    const isUpload = resolvedOptionId === "upload";
    if (isUpload && !uploadFile) {
      toast.error("Vui lòng chọn ảnh lá số.");
      return;
    }

    const shouldStream = false;

    cancelInFlight();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setResult(null);
    setStreamingText("");
    setOpenPalaceId(null);
    setHighlightId(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const payload: Record<string, unknown> = {
        messages: [{ role: "user", content: prompt }],
        module: isUpload ? "eastern_upload" : "eastern",
        lang,
        stream: shouldStream,
        profile,
        responseFormat: "json",
      };
      if (isUpload && uploadPreview) {
        payload.image = {
          data: uploadPreview.split(",")[1],
          mimeType: uploadFile!.type,
        };
      }
      const response = await fetch(`${supabaseUrl}/functions/v1/gemini-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to get response");

      if (!shouldStream) {
        const data = await response.json();
        let parsed: EasternResult;
        try {
          parsed = parseEasternResult(String((data as { response?: unknown })?.response ?? ""));
        } catch (err) {
          const text = String((data as { response?: unknown })?.response ?? "");
          console.error("Eastern astrology JSON parse error:", err, text);
          toast.error("Kết quả trả về không đúng định dạng JSON. Vui lòng thử lại.");
          return;
        }
        setResult(parsed);

        setQaSessionKey(String(Date.now()));

        if (profile && parsed && user?.id) {
          let uploadedImagePath: string | null = null;
          let uploadedImageUrl: string | null = null;
          if (isUpload && uploadFile) {
            try {
              const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
              const path = `${user.id}/${Date.now()}-${safeName}`;
              const { error: uploadError } = await supabase.storage
                .from("eastern_uploads")
                .upload(path, uploadFile, { upsert: false, contentType: uploadFile.type });
              if (!uploadError) {
                uploadedImagePath = path;
                uploadedImageUrl = supabase.storage.from("eastern_uploads").getPublicUrl(path).data.publicUrl;
              } else {
                console.error("Failed to upload chart image:", uploadError);
              }
            } catch (err) {
              console.error("Failed to upload chart image:", err);
            }
          }

          const { data: inserted, error: insertError } = await supabase
            .from("eastern_readings")
            .insert({
            user_id: user.id,
            input_json: {
              question: prompt,
              profile,
              optionId: resolvedOptionId,
              hasImage: isUpload,
              uploadFileName: uploadFile?.name ?? uploadFileName ?? null,
              uploadMimeType: uploadFile?.type ?? null,
              uploadStoragePath: uploadedImagePath,
              uploadPublicUrl: uploadedImageUrl,
            } as unknown as Json,
            result_json: parsed as unknown as Json,
            })
            .select("id")
            .single();
          if (!insertError && inserted?.id) setLastReadingId(inserted.id as string);
        }

        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.replace("data:", "").trim();
          if (payload === "[DONE]") {
            const parsed = parseEasternResult(accumulated);
            setResult(parsed);

            setQaSessionKey(String(Date.now()));

            if (profile && parsed && user?.id) {
              let uploadedImagePath: string | null = null;
              let uploadedImageUrl: string | null = null;
              if (isUpload && uploadFile) {
                try {
                  const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
                  const path = `${user.id}/${Date.now()}-${safeName}`;
                  const { error: uploadError } = await supabase.storage
                    .from("eastern_uploads")
                    .upload(path, uploadFile, { upsert: false, contentType: uploadFile.type });
                  if (!uploadError) {
                    uploadedImagePath = path;
                    uploadedImageUrl = supabase.storage.from("eastern_uploads").getPublicUrl(path).data.publicUrl;
                  } else {
                    console.error("Failed to upload chart image:", uploadError);
                  }
                } catch (err) {
                  console.error("Failed to upload chart image:", err);
                }
              }

              const { data: inserted, error: insertError } = await supabase
                .from("eastern_readings")
                .insert({
                user_id: user.id,
                input_json: {
                  question: prompt,
                  profile,
                  optionId: resolvedOptionId,
                  hasImage: isUpload,
                  uploadFileName: uploadFile?.name ?? uploadFileName ?? null,
                  uploadMimeType: uploadFile?.type ?? null,
                  uploadStoragePath: uploadedImagePath,
                  uploadPublicUrl: uploadedImageUrl,
                } as unknown as Json,
                result_json: parsed as unknown as Json,
                })
                .select("id")
                .single();
              if (!insertError && inserted?.id) setLastReadingId(inserted.id as string);
            }

            return;
          }
          try {
            const json = JSON.parse(payload) as { text?: string };
            if (json.text) {
              accumulated += json.text;
              setStreamingText((prev) => `${prev}${json.text}`);
            }
          } catch (err) {
            console.error("Stream parse error:", err);
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Eastern astrology error:", error);
      toast.error(t("eastern.error"));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleOptionClick = (option: OptionItem) => {
    if (option.id === "upload") {
      setSelectedOption(option.id);
      setResult(null);
      setExtraQuestion("");
      return;
    }
    if (option.id === "image") {
      toast.info("Tính năng tạo ảnh đang được phát triển. Sắp ra mắt!");
      return;
    }
    setSelectedOption(option.id);
    setResult(null);
    setExtraQuestion("");
    void runAnalyze(option.id, option.prompt);
  };

  return (
    <div className="container mx-auto px-3 py-6 md:px-4 md:py-8 lg:py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* <UserContextBanner /> */}

        <div className="text-center animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("module.eastern.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("module.eastern.desc")}</p>
        </div>

        {!selectedOption ? (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
            {options.map((option, idx) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionClick(option)}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer animate-fade-in"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${option.id === "image" ? "bg-gold/15" : "bg-primary/10"}`}>
                  <option.icon className={`h-5 w-5 ${option.id === "image" ? "text-gold" : "text-primary"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{option.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{option.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedOption(null); setResult(null); setExtraQuestion(""); }}>
                ← Quay lại
              </Button>
              <div className="flex items-center gap-2">
                <Link to="/history">
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">⏱</span>
                    <span className="hidden sm:inline">Lịch sử</span>
                  </Button>
                </Link>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                {(() => {
                  const selectedOptionData = options.find((o) => o.id === selectedOption);
                  const SelectedIcon = selectedOptionData?.icon;
                  return (
                    <>
                      <div className={`h-4 w-4 shrink-0 items-center justify-center rounded-lg ${selectedOptionData?.id === "image" ? "bg-gold/15" : "bg-primary/10"} flex`}>
                        {SelectedIcon && <SelectedIcon className={`h-3 w-3 ${selectedOptionData?.id === "image" ? "text-gold" : "text-primary"}`} />}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedOptionData?.label}
                      </p>
                    </>
                  );
                })()}
              </div>
              </div>
            </div>

            {selectedOption === "upload" ? (
              <Card className="p-5 shadow-sm">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <div
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-8 text-center transition-colors hover:border-primary/40 cursor-pointer sm:p-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadPreview ? (
                    <div className="relative">
                      <img src={uploadPreview} alt="Chart preview" className="max-h-64 rounded-lg" />
                      <button onClick={(e) => { e.stopPropagation(); clearUpload(); }} className="absolute -right-2 -top-2 rounded-full bg-foreground/10 p-1 hover:bg-foreground/20">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : uploadFileName ? (
                    <div className="flex items-center gap-2">
                      <FileImage className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium text-foreground">{uploadFileName}</span>
                      <button onClick={(e) => { e.stopPropagation(); clearUpload(); }}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">Chọn ảnh lá số tử vi</p>
                      <p className="mt-1 text-xs text-muted-foreground">Hỗ trợ PNG, JPEG</p>
                    </>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity mt-6"
                  onClick={() => runAnalyze()}
                  disabled={loading || !uploadFile}
                >
                  Bắt đầu luận giải
                </Button>

                <p className="mt-4 text-center text-xs text-muted-foreground">Ảnh sẽ được phân tích và luận giải chi tiết.</p>
              </Card>
            ) : null}

            {loading && !result && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">{t("eastern.analyzing")}</p>
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: "0.4s" }} />
                  </span>
                </div>
                {streamingText && (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-line line-clamp-6">
                    {streamingText}
                  </p>
                )}
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-fade-in">
                {selectedOption === "upload" ? (
                  <EasternUploadResult
                    t={t}
                    result={result}
                    highlightId={highlightId}
                    setOpenPalaceId={setOpenPalaceId}
                    focusSection={focusSection}
                    scrollToId={scrollToId}
                    renderMarkdown={renderMarkdown}
                    splitParagraphs={splitParagraphs}
                    slugify={slugify}
                    isPalaceSectionTitle={isPalaceSectionTitle}
                    qaOpen={qaOpen}
                    setQaOpen={setQaOpen}
                    qaSessionKey={qaSessionKey}
                    lastReadingId={lastReadingId}
                    profile={profile}
                    selectedOption={selectedOption}
                  />
                ) : selectedOption === "image" ? (
                  <EasternImageResult />
                ) : (
                  <EasternAnalysisResult
                    t={t}
                    result={result}
                    highlightId={highlightId}
                    setOpenPalaceId={setOpenPalaceId}
                    focusSection={focusSection}
                    scrollToId={scrollToId}
                    renderMarkdown={renderMarkdown}
                    splitParagraphs={splitParagraphs}
                    slugify={slugify}
                    isPalaceSectionTitle={isPalaceSectionTitle}
                    qaOpen={qaOpen}
                    setQaOpen={setQaOpen}
                    qaSessionKey={qaSessionKey}
                    lastReadingId={lastReadingId}
                    profile={profile}
                    selectedOption={selectedOption}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EasternAstrology;
