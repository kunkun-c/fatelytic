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

  const layoutConfig = useMemo(
    () => ({
      seo: { titleKey: "seo.eastern.title", descriptionKey: "seo.eastern.desc", path: "/eastern-astrology" },
      disableContentWrapper: true,
      showAdvisoryNotice: true,
      advisoryNoticeCompact: true,
    }),
    []
  );

  useLayoutConfig(layoutConfig);
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

  const [partnerPortraitPreview, setPartnerPortraitPreview] = useState<string | null>(null);
  const [partnerPortraitFileName, setPartnerPortraitFileName] = useState("");
  const [partnerPortraitFile, setPartnerPortraitFile] = useState<File | null>(null);
  const partnerPortraitInputRef = useRef<HTMLInputElement>(null);

  const [partnerChartPreview, setPartnerChartPreview] = useState<string | null>(null);
  const [partnerChartFileName, setPartnerChartFileName] = useState("");
  const [partnerChartFile, setPartnerChartFile] = useState<File | null>(null);
  const partnerChartInputRef = useRef<HTMLInputElement>(null);

  const [generatedImages, setGeneratedImages] = useState<Array<{ mimeType: string; data: string }>>([]);
  const [generatedImagenPrompt, setGeneratedImagenPrompt] = useState<string | null>(null);
  const [generatedImagenPromptVi, setGeneratedImagenPromptVi] = useState<string | null>(null);
  const [generatedCompatibilityScore, setGeneratedCompatibilityScore] = useState<number | null>(null);
  const [generatedCompatibilityRationale, setGeneratedCompatibilityRationale] = useState<string | null>(null);
  const [generatedSpousePortraitDirection, setGeneratedSpousePortraitDirection] = useState<string | null>(null);

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

  const handlePartnerPortraitFile = (selected: File) => {
    if (!selected.type.match(/image\/(png|jpeg|jpg)/)) {
      toast.error("Vui lòng chọn ảnh PNG hoặc JPEG.");
      return;
    }
    setPartnerPortraitFile(selected);
    setPartnerPortraitFileName(selected.name);
    const reader = new FileReader();
    reader.onload = (e) => setPartnerPortraitPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handlePartnerChartFile = (selected: File) => {
    if (!selected.type.match(/image\/(png|jpeg|jpg)/)) {
      toast.error("Vui lòng chọn ảnh PNG hoặc JPEG.");
      return;
    }
    setPartnerChartFile(selected);
    setPartnerChartFileName(selected.name);
    const reader = new FileReader();
    reader.onload = (e) => setPartnerChartPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
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
    { id: "overview", label: "Tổng quan", desc: "Phân tích tổng quan dựa trên thông tin bạn cung cấp", icon: Sparkles, prompt: "Hãy luận giải tổng quan Tử Vi/Bát Tự dựa trên thông tin cá nhân của tôi." },
    { id: "career", label: "Sự nghiệp & Công danh", desc: "Góc nhìn về sự nghiệp dựa trên thông tin bạn cung cấp", icon: Briefcase, prompt: "Hãy phân tích sự nghiệp/công danh dựa trên thông tin cá nhân của tôi. Nêu rõ điểm mạnh, điểm yếu, rủi ro và gợi ý hành động." },
    { id: "marriage", label: "Hôn nhân & Gia đạo", desc: "Góc nhìn quan hệ/hôn nhân dựa trên thông tin bạn cung cấp", icon: Heart, prompt: "Hãy phân tích tình duyên/hôn nhân & gia đạo dựa trên thông tin cá nhân của tôi. Tránh dự đoán định mệnh; ưu tiên gợi ý thực tế." },
    { id: "finance", label: "Tài chính & Tài vận", desc: "Góc nhìn tài chính dựa trên thông tin bạn cung cấp", icon: Wallet, prompt: "Hãy phân tích tài chính/tài vận dựa trên thông tin cá nhân của tôi. Tập trung vào thói quen tiền bạc, rủi ro và hệ thống quản trị." },
    { id: "health", label: "Sức khoẻ & Phúc đức", desc: "Góc nhìn wellbeing dựa trên thông tin bạn cung cấp", icon: Activity, prompt: "Hãy phân tích sức khỏe/phúc đức theo hướng wellbeing dựa trên thông tin cá nhân của tôi. Không chẩn đoán y khoa; chỉ gợi ý lối sống." },
    { id: "fortune", label: "Thời vận & Đại vận", desc: "Gợi ý chủ đề theo giai đoạn (mang tính tham khảo)", icon: Calendar, prompt: "Hãy luận giải thời vận theo chủ đề giai đoạn (Đại vận/Tiểu vận) dựa trên thông tin cá nhân của tôi. Tránh khẳng định chắc chắn; đưa checklist chuẩn bị." },
    { id: "image", label: "Ảnh minh hoạ người hôn phối", desc: "Tạo ảnh minh hoạ phong cách Á Đông (có thể dùng chân dung và/hoặc lá số)", icon: ImagePlus, prompt: "" },
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

  const clearPartnerInputs = () => {
    setPartnerPortraitPreview(null);
    setPartnerPortraitFileName("");
    setPartnerPortraitFile(null);
    if (partnerPortraitInputRef.current) partnerPortraitInputRef.current.value = "";

    setPartnerChartPreview(null);
    setPartnerChartFileName("");
    setPartnerChartFile(null);
    if (partnerChartInputRef.current) partnerChartInputRef.current.value = "";

    setGeneratedImages([]);
    setGeneratedImagenPrompt(null);
    setGeneratedImagenPromptVi(null);
    setGeneratedCompatibilityScore(null);
    setGeneratedCompatibilityRationale(null);
    setGeneratedSpousePortraitDirection(null);
  };

  const runGeneratePartnerImage = async () => {
    if (!profile) {
      toast.error(t("eastern.missingProfile"));
      return;
    }

    cancelInFlight();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setGeneratedImages([]);
    setGeneratedImagenPrompt(null);
    setGeneratedImagenPromptVi(null);
    setGeneratedCompatibilityScore(null);
    setGeneratedCompatibilityRationale(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const payload: Record<string, unknown> = {
        messages: [{ role: "user", content: "Generate a symbolic partner portrait." }],
        module: "eastern_image",
        lang,
        stream: false,
        responseFormat: "json",
        profile,
        contextJson: {
          optionId: "image",
        },
      };

      const images: Record<string, unknown> = {};
      if (partnerPortraitPreview && partnerPortraitFile) {
        images.portrait = { data: partnerPortraitPreview.split(",")[1], mimeType: partnerPortraitFile.type };
      }
      if (partnerChartPreview && partnerChartFile) {
        images.chart = { data: partnerChartPreview.split(",")[1], mimeType: partnerChartFile.type };
      }
      if (Object.keys(images).length > 0) payload.images = images;

      const response = await fetch(`${supabaseUrl}/functions/v1/oracle-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to generate image");
      const data = (await response.json()) as {
        images?: Array<{ mimeType: string; data: string }>;
        imagenPrompt?: string;
        imagenPromptVi?: string | null;
        compatibilityScore?: number | null;
        compatibilityRationale?: string | null;
        spousePortraitDirection?: string | null;
      };

      setGeneratedImages(Array.isArray(data.images) ? data.images : []);
      setGeneratedImagenPrompt(typeof data.imagenPrompt === "string" ? data.imagenPrompt : null);
      setGeneratedImagenPromptVi(typeof data.imagenPromptVi === "string" ? data.imagenPromptVi : null);
      setGeneratedCompatibilityScore(typeof data.compatibilityScore === "number" ? data.compatibilityScore : null);
      setGeneratedCompatibilityRationale(typeof data.compatibilityRationale === "string" ? data.compatibilityRationale : null);
      setGeneratedSpousePortraitDirection(
        typeof data.spousePortraitDirection === "string" ? data.spousePortraitDirection : null
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Partner image generation error:", error);
      toast.error("Không thể tạo ảnh lúc này. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
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
    const parsed = JSON.parse(cleaned) as Partial<EasternResult>;
    const sections = Array.isArray(parsed.sections)
      ? parsed.sections
      : Array.isArray(parsed.detailSections)
        ? parsed.detailSections
        : [];

    return {
      ...parsed,
      sections,
    } as EasternResult;
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

      const resolveEasternModule = (opt: string) => {
        switch (opt) {
          case "overview":
            return "eastern_overview";
          case "career":
            return "eastern_career";
          case "finance":
            return "eastern_finance";
          case "marriage":
            return "eastern_marriage";
          case "health":
            return "eastern_health";
          case "fortune":
            return "eastern_fortune";
          default:
            return "eastern";
        }
      };

      const payload: Record<string, unknown> = {
        messages: [{ role: "user", content: prompt }],
        module: isUpload ? "eastern_upload" : resolveEasternModule(resolvedOptionId),
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
      const response = await fetch(`${supabaseUrl}/functions/v1/oracle-chat`, {
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
      setSelectedOption(option.id);
      setResult(null);
      setExtraQuestion("");
      clearPartnerInputs();
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
            ) : selectedOption === "image" ? (
              <Card className="p-5 shadow-sm space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Tuỳ chọn đầu vào</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bạn có thể tải lên chân dung, lá số, cả hai, hoặc không tải lên gì (hệ thống sẽ tạo ảnh dựa trên thông tin hồ sơ).
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Chân dung (tuỳ chọn)</p>
                    <input
                      ref={partnerPortraitInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePartnerPortraitFile(e.target.files[0])}
                    />
                    <div
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-5 text-center transition-colors hover:border-primary/40 cursor-pointer"
                      onClick={() => partnerPortraitInputRef.current?.click()}
                    >
                      {partnerPortraitPreview ? (
                        <div className="relative">
                          <img src={partnerPortraitPreview} alt="Portrait preview" className="max-h-48 rounded-lg" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartnerPortraitPreview(null);
                              setPartnerPortraitFileName("");
                              setPartnerPortraitFile(null);
                              if (partnerPortraitInputRef.current) partnerPortraitInputRef.current.value = "";
                            }}
                            className="absolute -right-2 -top-2 rounded-full bg-foreground/10 p-1 hover:bg-foreground/20"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : partnerPortraitFileName ? (
                        <div className="flex items-center gap-2">
                          <FileImage className="h-6 w-6 text-primary" />
                          <span className="text-xs font-medium text-foreground">{partnerPortraitFileName}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Nhấn để tải ảnh chân dung</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Lá số Tử Vi (tuỳ chọn)</p>
                    <input
                      ref={partnerChartInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePartnerChartFile(e.target.files[0])}
                    />
                    <div
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-5 text-center transition-colors hover:border-primary/40 cursor-pointer"
                      onClick={() => partnerChartInputRef.current?.click()}
                    >
                      {partnerChartPreview ? (
                        <div className="relative">
                          <img src={partnerChartPreview} alt="Chart preview" className="max-h-48 rounded-lg" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartnerChartPreview(null);
                              setPartnerChartFileName("");
                              setPartnerChartFile(null);
                              if (partnerChartInputRef.current) partnerChartInputRef.current.value = "";
                            }}
                            className="absolute -right-2 -top-2 rounded-full bg-foreground/10 p-1 hover:bg-foreground/20"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : partnerChartFileName ? (
                        <div className="flex items-center gap-2">
                          <FileImage className="h-6 w-6 text-primary" />
                          <span className="text-xs font-medium text-foreground">{partnerChartFileName}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Nhấn để tải ảnh lá số</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button onClick={() => void runGeneratePartnerImage()} disabled={loading} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {loading ? "Đang tạo..." : "Tạo ảnh"}
                  </Button>
                  <Button variant="outline" onClick={clearPartnerInputs} disabled={loading}>
                    Xoá đầu vào
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={extraQuestion}
                    onChange={(e) => setExtraQuestion(e.target.value)}
                    placeholder={t("module.eastern.extraQuestionPlaceholder")}
                    className="w-full"
                  />
                  <Button
                    size="lg"
                    className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                    onClick={() => void runAnalyze()}
                    disabled={loading}
                  >
                    Bắt đầu luận giải
                  </Button>
                </div>
                {result && (
                  <div className="mt-6">
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
                  </div>
                )}
              </Card>
            )}
            {selectedOption === "image" && generatedImages.length > 0 && (
              <EasternImageResult
                images={generatedImages}
                imagenPrompt={generatedImagenPrompt}
                imagenPromptVi={generatedImagenPromptVi}
                compatibilityScore={generatedCompatibilityScore}
                compatibilityRationale={generatedCompatibilityRationale}
                spousePortraitDirection={generatedSpousePortraitDirection}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EasternAstrology;
