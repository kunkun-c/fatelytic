import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Sparkles, Briefcase, Heart, Wallet, Activity, ImagePlus, Clock } from "@/components/ui/icons";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/lib/i18n";
import EasternImageResult from "@/components/eastern/EasternImageResult";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import EasternTopBar from "@/components/eastern/EasternTopBar";
import EasternUploadBlock from "@/components/eastern/EasternUploadBlock";
import EasternImageBlock from "@/components/eastern/EasternImageBlock";
import EasternProfileReadingBlock from "@/components/eastern/EasternProfileReadingBlock";
import { getStoredProfile } from "@/lib/profile";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { useLocation } from "react-router-dom";
import type { EasternResult as EasternUploadResultType } from "@/components/eastern/EasternUploadResult";

const ZiWeiChartSection = lazy(() => import("@/components/eastern/ZiWeiChartSection"));

type EasternResult = EasternUploadResultType;

function resolveEasternModule(optionId: string) {
  switch (optionId) {
    case "upload":
      return "eastern_upload" as const;
    case "overview":
      return "eastern_overview" as const;
    case "career":
      return "eastern_career" as const;
    case "finance":
      return "eastern_finance" as const;
    case "marriage":
      return "eastern_marriage" as const;
    case "health":
      return "eastern_health" as const;
    case "fortune":
      return "eastern_fortune" as const;
    case "image":
      return "eastern_image" as const;
    default:
      return "eastern" as const;
  }
}

interface OptionItem {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  descKey: string;
  promptKey?: string;
}
const EasternAstrology = () => {
  const { t, lang } = useI18n();
  const [showZiWeiChart, setShowZiWeiChart] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Force container width change when showZiWeiChart changes
  useEffect(() => {
    if (containerRef.current) {
      if (showZiWeiChart) {
        containerRef.current.classList.remove('max-w-3xl');
        containerRef.current.classList.add('max-w-6xl');
        // Force style with !important
        containerRef.current.style.setProperty('max-width', '72rem', 'important');
        
        // Also apply to parent containers that might be limiting width
        let parent = containerRef.current.parentElement;
        while (parent && parent !== document.body) {
          if (parent.classList.contains('container')) {
            parent.style.setProperty('max-width', '72rem', 'important');
          }
          parent = parent.parentElement;
        }
      } else {
        containerRef.current.classList.remove('max-w-6xl');
        containerRef.current.classList.add('max-w-3xl');
        // Reset style
        containerRef.current.style.removeProperty('max-width');
        
        // Reset parent containers
        let parent = containerRef.current.parentElement;
        while (parent && parent !== document.body) {
          if (parent.classList.contains('container')) {
            parent.style.removeProperty('max-width');
          }
          parent = parent.parentElement;
        }
      }
    }
  }, [showZiWeiChart]);

  const layoutConfig = useMemo(
    () => ({
      seo: { titleKey: "seo.eastern.title", descriptionKey: "seo.eastern.desc", path: "/eastern-astrology" },
      disableContentWrapper: false,
      contentClassName: showZiWeiChart 
        ? "container mx-auto flex flex-col max-w-6xl px-4 py-4 md:py-6" 
        : "container mx-auto flex max-w-3xl flex-col px-4 py-4 md:py-6",
      showAdvisoryNotice: true,
      advisoryNoticeCompact: true,
    }),
    [showZiWeiChart]
  );

  useLayoutConfig(layoutConfig);
  const { user } = useAuth();
  const location = useLocation();
  const profile = getStoredProfile();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EasternResult | null>(null);
  const [resultsByOptionId, setResultsByOptionId] = useState<Record<string, EasternResult>>({});
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSource, setUploadSource] = useState<"image" | "saved">("image");

  const partnerPortraitInputRef = useRef<HTMLInputElement>(null);
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
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

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
    void selected;
  };

  const handlePartnerChartFile = (selected: File) => {
    void selected;
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

  const options: OptionItem[] = useMemo(
    () => [
      {
        id: "upload",
        labelKey: "eastern.option.upload.label",
        descKey: "eastern.option.upload.desc",
        promptKey: "eastern.option.upload.prompt",
        icon: Upload,
      },
      {
        id: "overview",
        labelKey: "eastern.option.overview.label",
        descKey: "eastern.option.overview.desc",
        promptKey: "eastern.option.overview.prompt",
        icon: Sparkles,
      },
      {
        id: "career",
        labelKey: "eastern.option.career.label",
        descKey: "eastern.option.career.desc",
        promptKey: "eastern.option.career.prompt",
        icon: Briefcase,
      },
      {
        id: "marriage",
        labelKey: "eastern.option.marriage.label",
        descKey: "eastern.option.marriage.desc",
        promptKey: "eastern.option.marriage.prompt",
        icon: Heart,
      },
      {
        id: "finance",
        labelKey: "eastern.option.finance.label",
        descKey: "eastern.option.finance.desc",
        promptKey: "eastern.option.finance.prompt",
        icon: Wallet,
      },
      {
        id: "health",
        labelKey: "eastern.option.health.label",
        descKey: "eastern.option.health.desc",
        promptKey: "eastern.option.health.prompt",
        icon: Activity,
      },
      {
        id: "fortune",
        labelKey: "eastern.option.fortune.label",
        descKey: "eastern.option.fortune.desc",
        promptKey: "eastern.option.fortune.prompt",
        icon: Clock,
      },
      {
        id: "image",
        labelKey: "eastern.option.image.label",
        descKey: "eastern.option.image.desc",
        icon: ImagePlus,
      },
    ],
    []
  );

  const handleFile = (selected: File) => {
    if (!selected.type.match(/image\/(png|jpeg|jpg)/)) {
      toast.error(t("eastern.toast.invalidImage"));
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

  const clearPartnerInputs = useCallback(() => {
    if (partnerPortraitInputRef.current) partnerPortraitInputRef.current.value = "";
    if (partnerChartInputRef.current) partnerChartInputRef.current.value = "";

    setGeneratedImages([]);
    setGeneratedImagenPrompt(null);
    setGeneratedImagenPromptVi(null);
    setGeneratedCompatibilityScore(null);
    setGeneratedCompatibilityRationale(null);
    setGeneratedSpousePortraitDirection(null);
  }, []);

  const runGeneratePartnerImage = async () => {
    if (!profile) {
      toast.error(t("eastern.missingProfile"));
      return;
    }

    const ziweiChartJson = (profile as unknown as { ziweiChartJson?: unknown })?.ziweiChartJson;
    if (!ziweiChartJson) {
      toast.error(t("eastern.toast.missingSavedChart"));
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
          ziweiChartJson,
          ziweiChartImageUrl: (profile as unknown as { ziweiChartImageUrl?: unknown })?.ziweiChartImageUrl ?? null,
        },
      };

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
        response?: unknown;
      };

      const unwrapResponsePayload = (value: unknown) => {
        if (!value) return null;
        if (typeof value === "object") return value as Record<string, unknown>;
        if (typeof value === "string") {
          try {
            return JSON.parse(stripJsonFences(value)) as Record<string, unknown>;
          } catch {
            return null;
          }
        }
        return null;
      };

      const unwrapped = unwrapResponsePayload(data.response);
      const imagesRaw =
        (Array.isArray(data.images) && data.images) ||
        (Array.isArray((unwrapped as { images?: unknown })?.images) ? ((unwrapped as { images?: unknown })?.images as Array<{ mimeType: string; data: string }>) : null);

      setGeneratedImages(Array.isArray(imagesRaw) ? imagesRaw : []);
      setGeneratedImagenPrompt(
        typeof data.imagenPrompt === "string"
          ? data.imagenPrompt
          : typeof (unwrapped as { imagenPrompt?: unknown })?.imagenPrompt === "string"
            ? ((unwrapped as { imagenPrompt?: unknown })?.imagenPrompt as string)
            : null
      );
      setGeneratedImagenPromptVi(
        typeof data.imagenPromptVi === "string"
          ? data.imagenPromptVi
          : typeof (unwrapped as { imagenPromptVi?: unknown })?.imagenPromptVi === "string"
            ? ((unwrapped as { imagenPromptVi?: unknown })?.imagenPromptVi as string)
            : null
      );
      setGeneratedCompatibilityScore(
        typeof data.compatibilityScore === "number"
          ? data.compatibilityScore
          : typeof (unwrapped as { compatibilityScore?: unknown })?.compatibilityScore === "number"
            ? ((unwrapped as { compatibilityScore?: unknown })?.compatibilityScore as number)
            : null
      );
      setGeneratedCompatibilityRationale(
        typeof data.compatibilityRationale === "string"
          ? data.compatibilityRationale
          : typeof (unwrapped as { compatibilityRationale?: unknown })?.compatibilityRationale === "string"
            ? ((unwrapped as { compatibilityRationale?: unknown })?.compatibilityRationale as string)
            : null
      );
      setGeneratedSpousePortraitDirection(
        typeof data.spousePortraitDirection === "string"
          ? data.spousePortraitDirection
          : typeof (unwrapped as { spousePortraitDirection?: unknown })?.spousePortraitDirection === "string"
            ? ((unwrapped as { spousePortraitDirection?: unknown })?.spousePortraitDirection as string)
            : null
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Partner image generation error:", error);
      toast.error(t("eastern.toast.imageGenerateFailed"));
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

  const parseEasternResult = useCallback(
    (raw: string) => {
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
    },
    []
  );

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
    const parsed = reading.result_json as unknown as EasternResult;
    setResult(parsed);
    setResultsByOptionId((prev) => ({ ...prev, [optionId]: parsed }));
    setLastReadingId(reading.id);
    setQaSessionKey(String(Date.now()));
    setStreamingText("");
    setLoading(false);
  }, [location.state]);

  const qaContextJson = useMemo(() => {
    return {
      readingId: lastReadingId,
      optionId: selectedOption,
      profile,
      resultsByOptionId,
      currentResult: result,
      uploadResult: resultsByOptionId.upload ?? null,
    };
  }, [lastReadingId, profile, result, resultsByOptionId, selectedOption]);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const runAnalyze = useCallback(
    async (optionId?: string, overrideQuestion?: string) => {
      if (!profile) {
        toast.error(t("eastern.missingProfile"));
        return;
      }

      const resolvedOptionId = optionId ?? selectedOption ?? "overview";
      if (!options.some((o) => o.id === resolvedOptionId)) return;

      const selected = options.find((o) => o.id === resolvedOptionId) ?? null;

      const prompt =
        typeof overrideQuestion === "string" && overrideQuestion.trim()
          ? overrideQuestion
          : selected?.promptKey
            ? t(selected.promptKey)
            : "";

      const isUpload = resolvedOptionId === "upload";
      const isUploadSaved = isUpload && uploadSource === "saved";

      if (isUpload && uploadSource === "image" && !uploadFile) {
        toast.error(t("eastern.toast.missingUpload"));
        return;
      }

      if (isUploadSaved) {
        const ziweiChartJson = (profile as unknown as { ziweiChartJson?: unknown })?.ziweiChartJson;
        if (!ziweiChartJson) {
          toast.error(t("eastern.toast.missingSavedChart"));
          return;
        }
      }

      cancelInFlight();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setStreamingText("");
      setResult(null);
      setQaOpen(false);
      setQaSessionKey(null);
      setLastReadingId(null);

      const shouldStream = resolvedOptionId !== "upload" && resolvedOptionId !== "image";

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        const payload: Record<string, unknown> = {
          messages: [{ role: "user", content: prompt }],
          module: isUpload ? "eastern_upload" : resolveEasternModule(resolvedOptionId),
          lang,
          stream: shouldStream,
          responseFormat: "json",
          profile,
        };

        if (isUpload && uploadSource === "image" && uploadFile) {
          payload.image = {
            data: uploadPreview ? String(uploadPreview).split(",")[1] ?? "" : "",
            mimeType: uploadFile.type,
          };
        }

        if (isUploadSaved) {
          const profileAny = profile as unknown as {
            ziweiChartJson?: unknown;
            ziweiChartImageUrl?: string | null;
          };
          payload.contextJson = {
            optionId: "upload",
            uploadSource: "saved",
            chartOrigin: "system",
            ziweiChartJson: profileAny.ziweiChartJson ?? null,
            ziweiChartImageUrl: profileAny.ziweiChartImageUrl ?? null,
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
            toast.error(t("eastern.toast.invalidJson"));
            return;
          }

          setResult(parsed);
          setResultsByOptionId((prev) => ({ ...prev, [resolvedOptionId]: parsed }));
          setQaSessionKey(String(Date.now()));

          if (profile && parsed && user?.id) {
            let uploadedImagePath: string | null = null;
            let uploadedImageUrl: string | null = null;
            if (isUpload && uploadSource === "image" && uploadFile) {
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
                  hasImage: isUpload && uploadSource === "image",
                  uploadFileName: uploadFile?.name ?? uploadFileName ?? null,
                  uploadMimeType: uploadFile?.type ?? null,
                  uploadStoragePath: uploadedImagePath,
                  uploadPublicUrl: uploadedImageUrl,
                  uploadSource,
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
            const payloadText = line.replace("data:", "").trim();
            if (payloadText === "[DONE]") {
              const parsed = parseEasternResult(accumulated);
              setResult(parsed);
              setResultsByOptionId((prev) => ({ ...prev, [resolvedOptionId]: parsed }));
              setQaSessionKey(String(Date.now()));

              if (profile && parsed && user?.id) {
                let uploadedImagePath: string | null = null;
                let uploadedImageUrl: string | null = null;
                if (isUpload && uploadSource === "image" && uploadFile) {
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
                      hasImage: isUpload && uploadSource === "image",
                      uploadFileName: uploadFile?.name ?? uploadFileName ?? null,
                      uploadMimeType: uploadFile?.type ?? null,
                      uploadStoragePath: uploadedImagePath,
                      uploadPublicUrl: uploadedImageUrl,
                      uploadSource,
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
              const json = JSON.parse(payloadText) as { text?: string };
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
  }, [
    cancelInFlight,
    lang,
    options,
    parseEasternResult,
    profile,
    selectedOption,
    t,
    uploadFile,
    uploadFileName,
    uploadPreview,
    uploadSource,
    user?.id,
    ]
  );

  useEffect(() => {
    const state = location.state as { autoOptionId?: string; autoUploadSource?: "image" | "saved" } | null;
    const autoOptionId = state?.autoOptionId;
    if (!autoOptionId) return;
    if (!options.some((o) => o.id === autoOptionId)) return;

    if (autoOptionId === "upload" && state?.autoUploadSource) {
      setUploadSource(state.autoUploadSource);
    }

    setSelectedOption(autoOptionId);
    setResult(null);
    setStreamingText("");
    setQaOpen(false);
    setQaSessionKey(null);
    setLastReadingId(null);

    void runAnalyze(autoOptionId);
  }, [location.state, options, runAnalyze]);

  const handleOptionClick = useCallback(
    (option: OptionItem) => {
      if (option.id === "upload") {
        setSelectedOption(option.id);
        setResult(null);
        return;
      }
      if (option.id === "image") {
        setSelectedOption(option.id);
        setResult(null);
        clearPartnerInputs();
        return;
      }
      setSelectedOption(option.id);
      setResult(null);
      void runAnalyze(option.id, option.promptKey ? t(option.promptKey) : "");
    },
    [clearPartnerInputs, runAnalyze, t]
  );

  return (
    <>
      <div ref={containerRef} className={`space-y-6 transition-all duration-300 ${showZiWeiChart ? 'max-w-6xl mx-auto' : 'max-w-3xl mx-auto'}`}>
        {/* <UserContextBanner /> */}

        <Reveal className="text-center" from="up" offset={18}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("module.eastern.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("module.eastern.desc")}</p>
        </Reveal>

        {!showZiWeiChart && (
          <Reveal from="up" offset={18} delay={0.04}>
            <button
              type="button"
              onClick={() => {
                if (!profile) {
                  toast.error(t("eastern.missingProfile"));
                  return;
                }
                setShowZiWeiChart(true);
              }}
              onMouseEnter={() => setHoveredOptionId("ziwei")}
              onMouseLeave={() => setHoveredOptionId(null)}
              className="group flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-200 group-hover:scale-105">
                <Clock className="h-5 w-5 text-primary" animate={hoveredOptionId === "ziwei"} animateOnHover={false} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Lá số tử vi</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Xem nhanh biểu đồ 12 cung tử vi theo hồ sơ của bạn</p>
              </div>
            </button>
          </Reveal>
        )}

        {showZiWeiChart && profile && (
          <Suspense fallback={<div className="w-full min-h-[calc(100dvh-10rem)] rounded-xl bg-muted" />}>
            <ZiWeiChartSection profile={profile} onBack={() => setShowZiWeiChart(false)} />
          </Suspense>
        )}

        {!showZiWeiChart && (
          <>
            {!selectedOption ? (
              <Reveal className="grid gap-3 sm:grid-cols-2" from="up" offset={18} delay={0.05}>
                {options.map((option, idx) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setHoveredOptionId(option.id)}
                    onMouseLeave={() => setHoveredOptionId(null)}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${option.id === "image" ? "bg-gold/15" : "bg-primary/10"}`}>
                      <option.icon
                        className={`h-5 w-5 ${option.id === "image" ? "text-gold" : "text-primary"}`}
                        animate={hoveredOptionId === option.id}
                        animateOnHover={false}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{t(option.labelKey)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t(option.descKey)}</p>
                    </div>
                  </button>
                ))}
              </Reveal>
            ) : (
              <div className="space-y-4">
                <EasternTopBar t={t} selectedOption={selectedOption} options={options} setSelectedOption={setSelectedOption} setResult={setResult} />

                {selectedOption === "upload" && (
                  <EasternUploadBlock
                    t={t}
                    loading={loading}
                    result={result}
                    uploadSource={uploadSource}
                    setUploadSource={setUploadSource}
                    hasSavedChart={!!(profile as unknown as { ziweiChartJson?: unknown })?.ziweiChartJson}
                    savedChartImageUrl={(profile as unknown as { ziweiChartImageUrl?: string | null })?.ziweiChartImageUrl ?? null}
                    fileInputRef={fileInputRef}
                    uploadPreview={uploadPreview}
                    uploadFileName={uploadFileName}
                    uploadFile={uploadFile}
                    handleFile={handleFile}
                    clearUpload={clearUpload}
                    runAnalyze={() => void runAnalyze()}
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
                    qaContextJson={qaContextJson}
                  />
                )}

                {selectedOption === "image" && (
                  <EasternImageBlock
                    t={t}
                    loading={loading}
                    runGeneratePartnerImage={runGeneratePartnerImage}
                  />
                )}

                {selectedOption !== "upload" && selectedOption !== "image" && (
                  <EasternProfileReadingBlock
                    t={t}
                    loading={loading}
                    runAnalyze={() => runAnalyze()}
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
                    qaContextJson={qaContextJson}
                  />
                )}

                {selectedOption === "image" && generatedImages.length > 0 && (
                  <Reveal from="up" offset={18} delay={0.08}>
                    <EasternImageResult
                      images={generatedImages}
                      imagenPrompt={generatedImagenPrompt}
                      imagenPromptVi={generatedImagenPromptVi}
                      compatibilityScore={generatedCompatibilityScore}
                      compatibilityRationale={generatedCompatibilityRationale}
                      spousePortraitDirection={generatedSpousePortraitDirection}
                    />
                  </Reveal>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default EasternAstrology;
