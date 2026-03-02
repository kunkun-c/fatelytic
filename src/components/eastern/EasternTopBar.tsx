import { ArrowLeft, Clock } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import React from "react";
import { Link } from "react-router-dom";
import type { EasternResult } from "@/components/eastern/EasternUploadResult";

type OptionItem = {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  descKey: string;
  promptKey?: string;
};

type Props = {
  t: (key: string) => string;
  selectedOption: string | null;
  options: OptionItem[];
  setSelectedOption: (value: string | null) => void;
  setResult: React.Dispatch<React.SetStateAction<EasternResult | null>>;
};

export default function EasternTopBar({ t, selectedOption, options, setSelectedOption, setResult }: Props) {
  return (
    <Reveal from="up" offset={18}>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedOption(null);
            setResult(null);
          }}
        >
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
                  <p className="text-sm font-semibold text-foreground">
                    {selectedOptionData ? t(selectedOptionData.labelKey) : ""}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
