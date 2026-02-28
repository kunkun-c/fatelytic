import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Sparkles, Briefcase, Heart, Wallet, Activity, ImagePlus, FileImage, X, ChevronDown, MessageCircle, ArrowLeft, Clock } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import ChatPanel from "@/components/ChatPanel";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import EasternUploadResult from "@/components/eastern/EasternUploadResult";
import EasternAnalysisResult from "@/components/eastern/EasternAnalysisResult";
import EasternImageResult from "@/components/eastern/EasternImageResult";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { ImageZoom } from "@/components/animate-ui/primitives/effects/image-zoom";
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
  icon: React.ElementType;
  labelKey: string;
  descKey: string;
  promptKey?: string;
}

type EasternTopBarProps = {
  t: (key: string) => string;
  selectedOption: string | null;
  options: OptionItem[];
  setSelectedOption: (value: string | null) => void;
  setResult: (value: EasternResult | null) => void;
};

const EasternTopBar = ({ t, selectedOption, options, setSelectedOption, setResult }: EasternTopBarProps) => {
  return (
    <Reveal from="up" offset={18}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedOption(null); setResult(null); }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Link to="/history">
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="h-4 w-4" animate={true} />
              <span className="hidden sm:inline">{t("eastern.history")}</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            {(() => {
              const selectedOptionData = options.find((o) => o.id === selectedOption);
              const SelectedIcon = selectedOptionData?.icon;
              return (
                <>
                  <div
                    className={`h-4 w-4 shrink-0 items-center justify-center rounded-lg ${
                      selectedOptionData?.id === "image" ? "bg-gold/15" : "bg-primary/10"
                    } flex`}
                  >
                    {SelectedIcon && (
                      <SelectedIcon
                        className={`h-3 w-3 ${selectedOptionData?.id === "image" ? "text-gold" : "text-primary"}`}
                      />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{selectedOptionData ? t(selectedOptionData.labelKey) : ""}</p>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </Reveal>
  );
};

type EasternUploadBlockProps = {
  t: (key: string) => string;
  loading: boolean;
  result: EasternResult | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadPreview: string | null;
  uploadFileName: string;
  uploadFile: File | null;
  handleFile: (selected: File) => void;
  clearUpload: () => void;
  runAnalyze: () => void;
  highlightId: string | null;
  setOpenPalaceId: (id: string | null) => void;
  focusSection: (id: string) => void;
  scrollToId: (id: string) => void;
  renderMarkdown: (text: string) => React.ReactNode;
  splitParagraphs: (text: string) => string[];
  slugify: (value: string) => string;
  isPalaceSectionTitle: (title: string) => boolean;
  qaOpen: boolean;
  setQaOpen: (open: boolean) => void;
  qaSessionKey: string | null;
  lastReadingId: string | null;
  profile: unknown;
  selectedOption: string | null;
};

const EasternUploadBlock = ({
  t,
  loading,
  result,
  fileInputRef,
  uploadPreview,
  uploadFileName,
  uploadFile,
  handleFile,
  clearUpload,
  runAnalyze,
  highlightId,
  setOpenPalaceId,
  focusSection,
  scrollToId,
  renderMarkdown,
  splitParagraphs,
  slugify,
  isPalaceSectionTitle,
  qaOpen,
  setQaOpen,
  qaSessionKey,
  lastReadingId,
  profile,
  selectedOption,
}: EasternUploadBlockProps) => {
  return (
    <>
      <Reveal from="up" offset={18} delay={0.05}>
        <Card className="p-5 shadow-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-8 text-center transition-colors hover:border-primary/40 cursor-pointer sm:p-10 relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Animation overlay khi đang phân tích */}
            {uploadPreview && loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-cyan-500/50 opacity-80 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent animate-pulse" />
                {/* Scanning lines */}
                <div className="absolute inset-0">
                  <div className="h-full w-full bg-gradient-to-b from-transparent via-blue-500/70 to-transparent animate-pulse" 
                       style={{ animation: 'scan 2s linear infinite' }} />
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-purple-500/60 to-transparent animate-pulse" 
                       style={{ animation: 'scan 3s linear infinite reverse' }} />
                </div>
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-grid-pattern opacity-30" 
                     style={{ 
                       backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)',
                       backgroundSize: '20px 20px',
                       animation: 'grid-fade 4s ease-in-out infinite'
                     }} />
              </div>
            )}
            
            {uploadPreview ? (
              <div className="relative z-10">
                <ImageZoom
                  zoomScale={2.5}
                  zoomOnHover={true}
                  zoomOnClick={false}
                  className="max-h-64"
                >
                  <img src={uploadPreview} alt="Chart preview" className={`max-h-64 rounded-lg shadow-lg ${loading ? 'opacity-70' : 'opacity-100'}`} />
                </ImageZoom>
                {/* Analysis indicators - chỉ khi đang phân tích */}
                {loading && (
                  <>
                    <div className="absolute -top-2 -left-2 flex gap-1">
                      <div className="h-3 w-3 bg-blue-500 rounded-full animate-ping shadow-lg shadow-blue-500/50" />
                      <div className="h-3 w-3 bg-purple-500 rounded-full animate-ping shadow-lg shadow-purple-500/50" style={{ animationDelay: '0.5s' }} />
                      <div className="h-3 w-3 bg-cyan-500 rounded-full animate-ping shadow-lg shadow-cyan-500/50" style={{ animationDelay: '1s' }} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-ping shadow-lg shadow-green-500/50" style={{ animationDelay: '1.5s' }} />
                      <div className="h-3 w-3 bg-yellow-500 rounded-full animate-ping shadow-lg shadow-yellow-500/50" style={{ animationDelay: '2s' }} />
                    </div>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearUpload();
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-foreground/10 p-1 hover:bg-foreground/20 backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : uploadFileName ? (
              <div className="flex items-center gap-2 z-10">
                <div className="relative">
                  <FileImage className="h-8 w-8 text-primary" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
                </div>
                <span className="text-sm font-medium text-foreground">{uploadFileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearUpload();
                  }}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="z-10">
                <div className="relative mb-3 flex justify-center">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t("eastern.upload.chooseChart")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("eastern.upload.formats")}</p>
              </div>
            )}
          </div>

          {/* Custom styles cho animations */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes scan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
              }
              @keyframes grid-fade {
                0%, 100% { opacity: 0.1; }
                50% { opacity: 0.3; }
              }
            `
          }} />

          <Button
            size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity mt-6"
            onClick={runAnalyze}
            disabled={loading || !uploadFile}
          >
            {t("eastern.upload.start")}
          </Button>

          {loading && (
            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" animate animateOnHover={false} animation="default" loop />
                <p className="text-sm font-medium text-foreground">{t("eastern.loading.title")}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("eastern.upload.slowNote")}</p>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">{t("eastern.upload.note")}</p>
        </Card>
      </Reveal>

      {result && (
        <Reveal className="mt-6" from="up" offset={18} delay={0.08}>
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
        </Reveal>
      )}
    </>
  );
};

type EasternImageBlockProps = {
  t: (key: string) => string;
  loading: boolean;
  partnerPortraitPreview: string | null;
  partnerPortraitFileName: string;
  partnerPortraitInputRef: React.RefObject<HTMLInputElement>;
  handlePartnerPortraitFile: (selected: File) => void;
  partnerChartPreview: string | null;
  partnerChartFileName: string;
  partnerChartInputRef: React.RefObject<HTMLInputElement>;
  handlePartnerChartFile: (selected: File) => void;
  clearPartnerInputs: () => void;
  runGeneratePartnerImage: () => Promise<void>;
  setPartnerPortraitPreview: (value: string | null) => void;
  setPartnerPortraitFileName: (value: string) => void;
  setPartnerPortraitFile: (value: File | null) => void;
  setPartnerChartPreview: (value: string | null) => void;
  setPartnerChartFileName: (value: string) => void;
  setPartnerChartFile: (value: File | null) => void;
};

const EasternImageBlock = ({
  t,
  loading,
  partnerPortraitPreview,
  partnerPortraitFileName,
  partnerPortraitInputRef,
  handlePartnerPortraitFile,
  partnerChartPreview,
  partnerChartFileName,
  partnerChartInputRef,
  handlePartnerChartFile,
  clearPartnerInputs,
  runGeneratePartnerImage,
  setPartnerPortraitPreview,
  setPartnerPortraitFileName,
  setPartnerPortraitFile,
  setPartnerChartPreview,
  setPartnerChartFileName,
  setPartnerChartFile,
}: EasternImageBlockProps) => {
  return (
    <Reveal from="up" offset={18} delay={0.05}>
      <Card className="p-5 shadow-sm space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("eastern.image.inputOptions.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("eastern.image.inputOptions.desc")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("eastern.image.portraitOptional")}</p>
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
                  <p className="text-xs text-muted-foreground">{t("eastern.image.portraitClick")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("eastern.image.chartOptional")}</p>
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
                  <p className="text-xs text-muted-foreground">{t("eastern.image.chartClick")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={() => void runGeneratePartnerImage()} disabled={loading} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? t("eastern.image.generating") : t("eastern.image.generate")}
          </Button>
          <Button variant="outline" onClick={clearPartnerInputs} disabled={loading}>
            {t("eastern.image.clearInputs")}
          </Button>
        </div>

        {(loading || (partnerPortraitPreview || partnerChartPreview)) && (
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" animate animateOnHover={false} animation="default" loop />
              <p className="text-sm font-medium text-foreground">{t("eastern.image.slowTitle")}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("eastern.image.slowDesc")}</p>
          </div>
        )}
      </Card>
    </Reveal>
  );
};

type EasternProfileReadingBlockProps = {
  t: (key: string) => string;
  loading: boolean;
  runAnalyze: () => Promise<void>;
  result: EasternResult | null;
  highlightId: string | null;
  setOpenPalaceId: (id: string | null) => void;
  focusSection: (id: string) => void;
  scrollToId: (id: string) => void;
  renderMarkdown: (text: string) => React.ReactNode;
  splitParagraphs: (text: string) => string[];
  slugify: (value: string) => string;
  isPalaceSectionTitle: (title: string) => boolean;
  qaOpen: boolean;
  setQaOpen: (open: boolean) => void;
  qaSessionKey: string | null;
  lastReadingId: string | null;
  profile: unknown;
  selectedOption: string | null;
};

const EasternProfileReadingBlock = ({
  t,
  loading,
  runAnalyze,
  result,
  highlightId,
  setOpenPalaceId,
  focusSection,
  scrollToId,
  renderMarkdown,
  splitParagraphs,
  slugify,
  isPalaceSectionTitle,
  qaOpen,
  setQaOpen,
  qaSessionKey,
  lastReadingId,
  profile,
  selectedOption,
}: EasternProfileReadingBlockProps) => {
  return (
    <Reveal from="up" offset={18} delay={0.05}>
      <Card className="p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t("eastern.profileReading.title")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("eastern.profileReading.desc")}</p>
          </div>
          <Button
            size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity sm:w-auto"
            onClick={() => void runAnalyze()}
            disabled={loading}
          >
            {loading ? t("eastern.profileReading.analyzing") : t("eastern.profileReading.start")}
          </Button>
        </div>

        {loading && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" animate animateOnHover={false} animation="default" loop />
              <p className="text-sm font-medium text-foreground">{t("eastern.loading.title")}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("eastern.loading.desc")}</p>
          </div>
        )}

        {result && (
          <Reveal className="mt-6" from="up" offset={18} delay={0.05}>
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
          </Reveal>
        )}
      </Card>
    </Reveal>
  );
};

const EasternAstrology = () => {
  const { t, lang } = useI18n();

  const layoutConfig = useMemo(
    () => ({
      seo: { titleKey: "seo.eastern.title", descriptionKey: "seo.eastern.desc", path: "/eastern-astrology" },
      disableContentWrapper: false,
      contentClassName: "container mx-auto flex max-w-3xl flex-col px-4 py-4 md:py-6",
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
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

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
      toast.error(t("eastern.toast.invalidImage"));
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
      toast.error(t("eastern.toast.invalidImage"));
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
  ];

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
    const selectedPrompt = selected?.promptKey ? t(selected.promptKey) : "";
    const prompt = (overrideQuestion ?? "").trim() || selectedPrompt || t("eastern.analyze");
    const isUpload = resolvedOptionId === "upload";
    if (isUpload && !uploadFile) {
      toast.error(t("eastern.toast.missingChartImage"));
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
          toast.error(t("eastern.toast.invalidJson"));
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
  };

  return (
    <>
      <div className="max-w-3xl space-y-6">
        {/* <UserContextBanner /> */}

        <Reveal className="text-center" from="up" offset={18}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("module.eastern.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("module.eastern.desc")}</p>
        </Reveal>

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
              />
            )}

            {selectedOption === "image" && (
              <EasternImageBlock
                t={t}
                loading={loading}
                partnerPortraitPreview={partnerPortraitPreview}
                partnerPortraitFileName={partnerPortraitFileName}
                partnerPortraitInputRef={partnerPortraitInputRef}
                handlePartnerPortraitFile={handlePartnerPortraitFile}
                partnerChartPreview={partnerChartPreview}
                partnerChartFileName={partnerChartFileName}
                partnerChartInputRef={partnerChartInputRef}
                handlePartnerChartFile={handlePartnerChartFile}
                clearPartnerInputs={clearPartnerInputs}
                runGeneratePartnerImage={runGeneratePartnerImage}
                setPartnerPortraitPreview={setPartnerPortraitPreview}
                setPartnerPortraitFileName={setPartnerPortraitFileName}
                setPartnerPortraitFile={setPartnerPortraitFile}
                setPartnerChartPreview={setPartnerChartPreview}
                setPartnerChartFileName={setPartnerChartFileName}
                setPartnerChartFile={setPartnerChartFile}
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
      </div>
    </>
  );
};

export default EasternAstrology;
