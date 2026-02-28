import { Clock, FileImage, ImagePlus, Sparkles, Upload, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import React from "react";

type Props = {
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
  runGeneratePartnerImage: () => Promise<void>;
  setPartnerPortraitPreview: (value: string | null) => void;
  setPartnerPortraitFileName: (value: string) => void;
  setPartnerPortraitFile: (value: File | null) => void;
  setPartnerChartPreview: (value: string | null) => void;
  setPartnerChartFileName: (value: string) => void;
  setPartnerChartFile: (value: File | null) => void;
};

export default function EasternImageBlock({
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
  runGeneratePartnerImage,
  setPartnerPortraitPreview,
  setPartnerPortraitFileName,
  setPartnerPortraitFile,
  setPartnerChartPreview,
  setPartnerChartFileName,
  setPartnerChartFile,
}: Props) {
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
            <Sparkles className="h-4 w-4" animate animateOnHover={false} animation="default" loop />
            {loading ? t("eastern.image.generating") : t("eastern.image.generate")}
          </Button>
        </div>

        {(loading || partnerPortraitPreview || partnerChartPreview) && (
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
}
