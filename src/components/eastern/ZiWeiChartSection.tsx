import { useMemo, useRef, useState } from "react";
import { Iztrolabe } from "react-iztro";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { astro } from "iztro";
import { ArrowLeft, Download } from "@/components/ui/icons";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/animate-ui/components/buttons/button";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";

import type { UserProfile } from "@/lib/profile";
import {
  translateCommon,
  translateFiveElement,
  getFiveElementColor,
  translateStarName,
  translateZodiac,
  translateWesternZodiac,
  translateEarthlyBranch,
  translateHeavenlyStem,
} from "@/lib/astrology-translations";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

const getChineseHourIndexFromTime = (timeOfBirth?: string) => {
  if (!timeOfBirth) return 0;

  const hourStr = timeOfBirth.split(":")[0];
  const hour = Number(hourStr);
  if (!Number.isFinite(hour)) return 0;

  if (hour >= 23 || hour < 1) return 0; // Tý
  if (hour >= 1 && hour < 3) return 1; // Sửu
  if (hour >= 3 && hour < 5) return 2; // Dần
  if (hour >= 5 && hour < 7) return 3; // Mão
  if (hour >= 7 && hour < 9) return 4; // Thìn
  if (hour >= 9 && hour < 11) return 5; // Tỵ
  if (hour >= 11 && hour < 13) return 6; // Ngọ
  if (hour >= 13 && hour < 15) return 7; // Mùi
  if (hour >= 15 && hour < 17) return 8; // Thân
  if (hour >= 17 && hour < 19) return 9; // Dậu
  if (hour >= 19 && hour < 21) return 10; // Tuất
  return 11; // Hợi
};

const getIztroGender = (value?: string) => {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("female") || normalized.includes("nữ") || normalized.includes("nu")) return "female" as const;
  return "male" as const;
};

const safeString = (value: unknown) => (typeof value === "string" ? value : "");
const safeNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    const rec = getRecord(cur);
    if (!rec) return undefined;
    cur = rec[key];
  }
  return cur;
}

function getFiveElementBadge(elementClass: string) {
  // elementClass can be like "火六局". We derive "火" to map into five elements.
  const firstChar = elementClass.trim().slice(0, 1);
  const elementVi = firstChar ? translateFiveElement(firstChar) : "";
  return {
    elementVi,
    badgeClass: elementVi ? getFiveElementColor(elementVi) : "bg-gray-100 text-gray-800",
  };
}

function getNominalAgeFromDob(dateOfBirth: string) {
  // 虚岁 (tuổi mụ) ~= currentYear - birthYear + 1
  const year = Number(dateOfBirth.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  const nowYear = new Date().getFullYear();
  return nowYear - year + 1;
}

function translateFourPillars(value: string) {
  // Example: "甲申 庚午 甲午 壬申" -> "Giáp Thân - Canh Ngọ - Giáp Ngọ - Nhâm Thân"
  const raw = value.trim();
  if (!raw) return "";

  const parts = raw.split(/\s+/g).filter(Boolean);
  if (!parts.length) return raw;

  const translated = parts
    .map((p) => {
      const stem = p.slice(0, 1);
      const branch = p.slice(1, 2);
      const stemVi = stem ? translateHeavenlyStem(stem) : "";
      const branchVi = branch ? translateEarthlyBranch(branch) : "";
      const combined = `${stemVi}${stemVi && branchVi ? " " : ""}${branchVi}`.trim();
      return combined || p;
    })
    .join(" - ");

  return translated;
}

function translateChineseLunarDate(value: string) {
  // Convert Chinese lunar date like "二〇二六年正月十三" to Vietnamese
  const raw = value.trim();
  if (!raw) return raw;

  // Map Chinese numerals to Arabic
  const chineseToArabic: Record<string, string> = {
    "〇": "0", "一": "1", "二": "2", "三": "3", "四": "4", 
    "五": "5", "六": "6", "七": "7", "八": "8", "九": "9", "十": "10",
    "廿": "20", "卅": "30"
  };

  // Map Chinese months to Vietnamese
  const chineseMonths: Record<string, string> = {
    "正月": "1", "一月": "1", "二月": "2", "三月": "3", 
    "四月": "4", "五月": "5", "六月": "6", "七月": "7",
    "八月": "8", "九月": "9", "十月": "10", "十一月": "11", "十二月": "12",
    // Special months
    "腊月": "12", "冬月": "11", "闰月": "intercalary" // leap month
  };

  // Handle special format like "Nhâm Thân năm Ngũ nguyệt nhị thập thất"
  if (raw.includes("năm")) {
    // Extract year zodiac (e.g., "Nhâm Thân")
    const zodiacMatch = raw.match(/^([^\s]+)\s/);
    const zodiac = zodiacMatch ? zodiacMatch[1] : "";
    
    // Extract year number (e.g., "2004")
    const yearMatch = raw.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : "";
    
    // Extract month (e.g., "Ngũ nguyệt" -> "5")
    let month = "";
    if (raw.includes("Ngũ nguyệt")) month = "5";
    else if (raw.includes("Tứ nguyệt")) month = "4";
    else if (raw.includes("Lục nguyệt")) month = "6";
    else if (raw.includes("Thất nguyệt")) month = "7";
    else if (raw.includes("Bát nguyệt")) month = "8";
    else if (raw.includes("Cửu nguyệt")) month = "9";
    else if (raw.includes("Thập nguyệt")) month = "10";
    
    // Extract day (e.g., "nhị thập thất" -> "27")
    let day = "";
    const dayMatch = raw.match(/nhị thập ([^\s]+)/);
    if (dayMatch) {
      const dayStr = dayMatch[1];
      const dayMap: Record<string, string> = {
        "nhất": "1", "nhị": "2", "tam": "3", "tứ": "4", "ngũ": "5", "lục": "6", 
        "thất": "7", "bát": "8", "cửu": "9", "thập": "10"
      };
      day = dayMap[dayStr] || dayStr;
    }
    
    if (year && month && day) {
      const result = `${day}/${month}/${year}`;
      return result;
    } else if (year && month) {
      const result = `${month}/${year}`;
      return result;
    } else {
      return raw;
    }
  }

  // Standard Chinese format like "二〇二六年正月十三"
  // Extract year (4 digits starting with 二〇)
  const yearMatch = raw.match(/二〇[〇一二三四五六七八九]{2}/);
  let year = "";
  if (yearMatch) {
    year = yearMatch[0].split('').map(char => chineseToArabic[char] || char).join('');
  }

  // Extract month
  let month = "";
  for (const [chinese, vietnamese] of Object.entries(chineseMonths)) {
    if (raw.includes(chinese)) {
      month = vietnamese;
      break;
    }
  }

  // Extract day
  let day = "";
  const dayMatch = raw.match(/([一二三四五六七八九十廿卅]{1,3})$/);
  if (dayMatch) {
    const dayStr = dayMatch[1];
    if (dayStr.length === 1) {
      day = chineseToArabic[dayStr] || dayStr;
    } else if (dayStr === "十一") {
      day = "11";
    } else if (dayStr === "十二") {
      day = "12";
    } else if (dayStr === "十三") {
      day = "13";
    } else if (dayStr === "十四") {
      day = "14";
    } else if (dayStr === "十五") {
      day = "15";
    } else if (dayStr === "十六") {
      day = "16";
    } else if (dayStr === "十七") {
      day = "17";
    } else if (dayStr === "十八") {
      day = "18";
    } else if (dayStr === "十九") {
      day = "19";
    } else if (dayStr === "二十") {
      day = "20";
    } else if (dayStr === "廿一") {
      day = "21";
    } else if (dayStr === "廿二") {
      day = "22";
    } else if (dayStr === "廿三") {
      day = "23";
    } else if (dayStr === "廿四") {
      day = "24";
    } else if (dayStr === "廿五") {
      day = "25";
    } else if (dayStr === "廿六") {
      day = "26";
    } else if (dayStr === "廿七") {
      day = "27";
    } else if (dayStr === "廿八") {
      day = "28";
    } else if (dayStr === "廿九") {
      day = "29";
    } else if (dayStr === "三十") {
      day = "30";
    } else {
      day = dayStr.split('').map(char => chineseToArabic[char] || char).join('');
    }
  }

  // Format Vietnamese date
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  } else if (year && month) {
    return `${month}/${year}`;
  } else {
    return raw;
  }
}

export default function ZiWeiChartSection({ profile, onBack }: Props) {
  const timeIndex = useMemo(() => getChineseHourIndexFromTime(profile.timeOfBirth), [profile.timeOfBirth]);
  const gender = useMemo(() => getIztroGender(profile.gender), [profile.gender]);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // We use zh-CN for data so our existing translation dictionary can map Chinese terms -> Vietnamese.
  const astrolabe = useMemo(() => {
    try {
      return astro.astrolabeBySolarDate(profile.dateOfBirth, timeIndex, gender, true, "zh-CN");
    } catch (e) {
      console.error("Failed to build Zi Wei astrolabe", e);
      return null;
    }
  }, [gender, profile.dateOfBirth, timeIndex]);

  const horoscope = useMemo(() => {
    if (!astrolabe) return null;
    try {
      return astrolabe.horoscope(new Date(), timeIndex);
    } catch (e) {
      console.error("Failed to build Zi Wei horoscope", e);
      return null;
    }
  }, [astrolabe, timeIndex]);

  const basicInfo = useMemo(() => {
    // Try to read common fields from astrolabe/horoscope safely (schema differs between versions)
    const solarDate = safeString(getPath(astrolabe, ["rawDates", "solarDate"])) || profile.dateOfBirth;

    const lunarStrRaw =
      safeString(getPath(astrolabe, ["lunarDate"])) ||
      safeString(getPath(astrolabe, ["rawDates", "lunarStr"])) ||
      safeString(getPath(astrolabe, ["rawDates", "lunarDateStr"]));
    
    // Try translateCommon first, then try Chinese lunar date conversion
    let lunarStr = "";
    if (lunarStrRaw) {
      const translated = translateCommon(lunarStrRaw);
      if (translated && translated !== lunarStrRaw) {
        lunarStr = translated;
      } else {
        lunarStr = translateChineseLunarDate(lunarStrRaw);
      }
    }

    const fourPillarsRaw =
      safeString(getPath(astrolabe, ["chineseDate"])) || safeString(getPath(astrolabe, ["rawDates", "chineseDate"]));
    const fourPillars = fourPillarsRaw ? translateFourPillars(fourPillarsRaw) : "";

    const zodiac = safeString(getPath(astrolabe, ["zodiac"])) || safeString(getPath(astrolabe, ["rawDates", "zodiac"]));

    const sign = safeString(getPath(astrolabe, ["sign"])) || safeString(getPath(astrolabe, ["rawDates", "sign"]));

    const fiveElementsClass =
      safeString(getPath(astrolabe, ["fiveElementsClass"])) || safeString(getPath(astrolabe, ["rawDates", "fiveElementsClass"]));

    const nominalAgeFromLib =
      safeNumber(getPath(astrolabe, ["nominalAge"])) ?? safeNumber(getPath(astrolabe, ["rawDates", "nominalAge"])) ?? null;
    const nominalAge = nominalAgeFromLib ?? getNominalAgeFromDob(profile.dateOfBirth);

    const soul = safeString(getPath(astrolabe, ["soul"])) || safeString(getPath(astrolabe, ["rawDates", "soul"]));
    const body = safeString(getPath(astrolabe, ["body"])) || safeString(getPath(astrolabe, ["rawDates", "body"]));

    const soulPalace =
      safeString(getPath(astrolabe, ["soulPalace", "earthlyBranch"])) ||
      safeString(getPath(astrolabe, ["earthlyBranchOfSoulPalace"])) ||
      safeString(getPath(astrolabe, ["rawDates", "earthlyBranchOfSoulPalace"]));

    const bodyPalace =
      safeString(getPath(astrolabe, ["bodyPalace", "earthlyBranch"])) ||
      safeString(getPath(astrolabe, ["earthlyBranchOfBodyPalace"])) ||
      safeString(getPath(astrolabe, ["rawDates", "earthlyBranchOfBodyPalace"]));

    return {
      solarDate,
      lunarStr,
      fourPillars,
      zodiac,
      sign,
      fiveElementsClass,
      nominalAge,
      soul,
      body,
      soulPalace,
      bodyPalace,
    };
  }, [astrolabe, profile.dateOfBirth]);

  const horoscopeInfo = useMemo(() => {
    if (!horoscope) return { solarDate: "", lunarDate: "", scopeLabel: "" };

    const solarDate = safeString(getPath(horoscope, ["solarDate"])) || safeString(getPath(horoscope, ["rawDates", "solarDate"])) || "";

    const lunarDateRaw = safeString(getPath(horoscope, ["lunarDate"])) || safeString(getPath(horoscope, ["rawDates", "lunarDate"])) || "";
    
    // Try translateCommon first, then try Chinese lunar date conversion
    let lunarDate = "";
    if (lunarDateRaw) {
      const translated = translateCommon(lunarDateRaw);
      if (translated && translated !== lunarDateRaw) {
        lunarDate = translated;
      } else {
        lunarDate = translateChineseLunarDate(lunarDateRaw);
      }
    }

    const scopeLabel = safeString(getPath(horoscope, ["scope", "name"])) || safeString(getPath(horoscope, ["scope"])) || "";

    return {
      solarDate,
      lunarDate,
      scopeLabel,
    };
  }, [horoscope]);

  const download = async () => {
    setIsDownloading(true);
    const wrapper = chartRef.current;
    if (!wrapper) {
      setIsDownloading(false);
      return;
    }

    const node = wrapper.firstElementChild as HTMLElement | null;
    if (!node) {
      setIsDownloading(false);
      return;
    }

    try {
      await new Promise((r) => window.setTimeout(r, 100));

      const clone = node.cloneNode(true) as HTMLElement;
      clone.style.transform = "scale(1)";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "-9999px";
      clone.style.overflow = "visible";
      clone.style.width = "1024px";
      clone.style.height = "auto";
      clone.style.background = "#ffffff";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 1024,
        height: clone.offsetHeight,
        scrollX: 0,
        scrollY: 0,
      });

      document.body.removeChild(clone);

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Không thể tạo ảnh. Vui lòng thử lại.");
          setIsDownloading(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tu-vi-${profile.fullName ? profile.fullName.replace(/\s+/g, "-") : "chart"}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      }, "image/png");
    } catch (error) {
      console.error("Failed to export Zi Wei chart", error);
      toast.error("Không thể tải ảnh. Vui lòng thử lại.");
      setIsDownloading(false);
    }
  };

  const fiveElementsClassVi = basicInfo.fiveElementsClass ? translateCommon(basicInfo.fiveElementsClass) : "";
  const { elementVi: fiveElementVi, badgeClass: fiveElementsBadgeClass } = getFiveElementBadge(basicInfo.fiveElementsClass);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Reveal from="left" offset={18} delay={0.04}>
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" animate animateOnHover={false} animation="default"  />
            Quay lại
          </Button>
        </Reveal>
        <Reveal from="right" offset={18} delay={0.04}>
          <Button
            size="sm"
            onClick={() => void download()}
            disabled={isDownloading}
            className="gap-2"
          >
            <Download className="h-4 w-4" animate={isDownloading ? false : undefined} animateOnHover={false} animation="default" loop />
            {isDownloading ? "Đang tải..." : "Tải ảnh"}
          </Button>
        </Reveal>
      </div>

      <Reveal from="up" offset={18} delay={0.08}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Thông tin cơ bản</p>
              <Badge variant="secondary" className="text-xs">
                {gender === "male" ? "Nam" : "Nữ"}
              </Badge>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("阳历")}</p>
                <p className="font-medium text-foreground">{basicInfo.solarDate}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("阴历")}</p>
                <p className="font-medium text-foreground">{basicInfo.lunarStr || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("五行局")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={fiveElementsBadgeClass}>{fiveElementVi || "—"}</Badge>
                  {fiveElementsClassVi ? <span className="text-xs text-muted-foreground">{fiveElementsClassVi}</span> : null}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuổi mụ</p>
                <p className="font-medium text-foreground">{basicInfo.nominalAge ? `${basicInfo.nominalAge} tuổi` : "—"}</p>
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground">Tứ trụ</p>
                <p className="font-medium text-foreground">{basicInfo.fourPillars || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("生肖") || "Con giáp"}</p>
                <p className="font-medium text-foreground">{basicInfo.zodiac ? translateZodiac(basicInfo.zodiac) : "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("星座") || "Cung hoàng đạo"}</p>
                <p className="font-medium text-foreground">{basicInfo.sign ? translateWesternZodiac(basicInfo.sign) : "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("命主") || "Mệnh chủ"}</p>
                <p className="font-medium text-foreground">{basicInfo.soul ? translateStarName(basicInfo.soul) : "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("身主") || "Thân chủ"}</p>
                <p className="font-medium text-foreground">{basicInfo.body ? translateStarName(basicInfo.body) : "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("命宫") || "Cung mệnh"}</p>
                <p className="font-medium text-foreground">{basicInfo.soulPalace ? translateEarthlyBranch(basicInfo.soulPalace) : "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{translateCommon("身宫") || "Cung thân"}</p>
                <p className="font-medium text-foreground">{basicInfo.bodyPalace ? translateEarthlyBranch(basicInfo.bodyPalace) : "—"}</p>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Thông tin vận hạn</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{translateCommon("阳历")}</p>
                  <p className="font-medium text-foreground">{horoscopeInfo.solarDate || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{translateCommon("阴历")}</p>
                  <p className="font-medium text-foreground">{horoscopeInfo.lunarDate || "—"}</p>
                </div>
              </div>
              {horoscopeInfo.scopeLabel ? <p className="text-xs text-muted-foreground">{horoscopeInfo.scopeLabel}</p> : null}
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal from="up" offset={18} delay={0.12}>
        <div className="overflow-x-auto rounded-xl border border-border bg-white p-2">
          <div ref={chartRef} className="flex justify-center">
            <div style={{ width: 1024, minWidth: 1024, height: "auto" }}>
              <Iztrolabe
                birthday={profile.dateOfBirth}
                birthTime={timeIndex}
                birthdayType="solar"
                gender={gender}
                lang="vi-VN"
                horoscopeDate={new Date()}
                horoscopeHour={timeIndex}
              />
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
