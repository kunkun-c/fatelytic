import { Activity, FileImage, Sparkles, Upload, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { ImageZoom } from "@/components/animate-ui/primitives/effects/image-zoom";
import EasternUploadResult from "@/components/eastern/EasternUploadResult";
import React from "react";
import type { EasternResult } from "@/components/eastern/EasternUploadResult";

type Props = {
  t: (key: string) => string;
  loading: boolean;
  result: EasternResult | null;
  uploadSource: "image" | "saved";
  setUploadSource: (next: "image" | "saved") => void;
  hasSavedChart: boolean;
  savedChartImageUrl?: string | null;
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
  qaContextJson?: unknown;
};

export default function EasternUploadBlock({
  t,
  loading,
  result,
  uploadSource,
  setUploadSource,
  hasSavedChart,
  savedChartImageUrl,
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
  qaContextJson,
}: Props) {
  return (
    <>
      <Reveal from="up" offset={18} delay={0.05}>
        <Card className="p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t("eastern.option.upload.label")}</p>
              <p className="mt-1 text-xs text-muted-foreground truncate">{t("eastern.option.upload.desc")}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1 ring-1 ring-border/60 flex-shrink-0">
              <Highlight
                as="div"
                mode="parent"
                controlledItems
                hover={false}
                click={false}
                value={uploadSource}
                exitDelay={120}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="rounded-full bg-background shadow-md shadow-foreground/5"
                containerClassName="flex items-center gap-1 rounded-full"
                boundsOffset={{ top: 0, left: 0, width: 0, height: 0 }}
              >
                <HighlightItem value="image" asChild>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Image button clicked, uploadSource:', uploadSource, 'loading:', loading);
                      setUploadSource("image");
                    }}
                    disabled={loading}
                    className={`relative rounded-full px-3 py-2 text-sm font-bold transition-all duration-300 select-none ${
                      uploadSource === "image" 
                        ? "text-gradient-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
                  >
                    {t("eastern.upload.chooseChart")}
                  </button>
                </HighlightItem>
                <HighlightItem value="saved" asChild>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Saved button clicked, uploadSource:', uploadSource, 'loading:', loading, 'hasSavedChart:', hasSavedChart);
                      setUploadSource("saved");
                    }}
                    disabled={loading || !hasSavedChart}
                    className={`relative rounded-full px-3 py-2 text-sm font-bold transition-all duration-300 select-none ${
                      uploadSource === "saved" 
                        ? "text-gradient-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    } ${(loading || !hasSavedChart) ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
                  >
                    {t("eastern.option.savedChart.label")}
                  </button>
                </HighlightItem>
              </Highlight>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-8 text-center transition-colors hover:border-primary/40 cursor-pointer sm:p-10 relative overflow-hidden"
            onClick={() => {
              if (uploadSource !== "image") return;
              fileInputRef.current?.click();
            }}
          >
            {loading && (uploadPreview || (uploadSource === "saved" && hasSavedChart)) && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/60 via-purple-500/60 to-cyan-500/60 opacity-90 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 to-transparent animate-pulse" />
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
                <div className="absolute inset-0 backdrop-blur-[1px]" />
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
            )}

            {uploadSource === "saved" && hasSavedChart ? (
              <div className="relative z-10">
                {savedChartImageUrl ? (
                  <>
                    <ImageZoom zoomScale={2.5} zoomOnHover={true} zoomOnClick={false} className="max-h-64">
                      <img
                        src={savedChartImageUrl}
                        alt="Saved chart"
                        className={`max-h-64 rounded-lg shadow-lg ${loading ? "opacity-70" : "opacity-100"}`}
                      />
                    </ImageZoom>
                    {loading && (
                      <>
                        <div className="absolute -top-2 -left-2 flex gap-1">
                          <div className="h-3 w-3 bg-blue-500 rounded-full animate-ping shadow-lg shadow-blue-500/60" />
                          <div
                            className="h-3 w-3 bg-purple-500 rounded-full animate-ping shadow-lg shadow-purple-500/60"
                            style={{ animationDelay: "0.5s" }}
                          />
                          <div
                            className="h-3 w-3 bg-cyan-500 rounded-full animate-ping shadow-lg shadow-cyan-500/60"
                            style={{ animationDelay: "1s" }}
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 flex gap-1">
                          <div
                            className="h-3 w-3 bg-green-500 rounded-full animate-ping shadow-lg shadow-green-500/60"
                            style={{ animationDelay: "1.5s" }}
                          />
                          <div
                            className="h-3 w-3 bg-yellow-500 rounded-full animate-ping shadow-lg shadow-yellow-500/60"
                            style={{ animationDelay: "2s" }}
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="z-10">
                    <div className="relative mb-3 flex justify-center">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{t("eastern.option.savedChart.label")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("eastern.upload.note")}</p>
                  </div>
                )}
              </div>
            ) : uploadPreview ? (
              <div className="relative z-10">
                <ImageZoom zoomScale={2.5} zoomOnHover={true} zoomOnClick={false} className="max-h-64">
                  <img
                    src={uploadPreview}
                    alt="Chart preview"
                    className={`max-h-64 rounded-lg shadow-lg ${loading ? "opacity-70" : "opacity-100"}`}
                  />
                </ImageZoom>
                {loading && (
                  <>
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

          <Button
            size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity mt-6"
            onClick={runAnalyze}
            disabled={loading || (uploadSource === "image" && !uploadFile) || (uploadSource === "saved" && !hasSavedChart)}
          >
            <Sparkles className="h-4 w-4" animate animateOnHover={false} animation="default" loop />
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
            result={result as unknown as import("@/components/eastern/EasternUploadResult").EasternResult}
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
        </Reveal>
      )}
    </>
  );
}
