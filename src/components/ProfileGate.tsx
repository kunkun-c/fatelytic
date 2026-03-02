import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Lunar } from "lunar-javascript";
import { Loader2 } from "@/components/ui/icons";
import { getStoredProfile, setStoredProfile, type UserProfile } from "@/lib/profile";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { astro } from "iztro";
import html2canvas from "html2canvas";
import { Iztrolabe } from "react-iztro";
import type { Json } from "@/integrations/supabase/types";

interface ProfileGateProps {
  children?: React.ReactNode;
  mode?: "gate" | "edit";
}

export default function ProfileGate({ children, mode = "gate" }: ProfileGateProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { t, lang } = useI18n();
  const chartCaptureRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [birthHour, setBirthHour] = useState("");
  const [birthMinute, setBirthMinute] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [provinces, setProvinces] = useState<Array<{ code: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ code: number; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: number; name: string }>>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [gender, setGender] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const parsed = getStoredProfile();
      if (parsed) {
        const [storedYear, storedMonth, storedDay] = parsed.dateOfBirth.split("-");
        setProfile(parsed);
        setFullName(parsed.fullName ?? "");
        setGender(parsed.gender ?? "");
        setPlaceOfBirth(parsed.placeOfBirth ?? "");
        setDay(storedDay);
        setMonth(storedMonth.replace(/^0/, ""));
        setYear(storedYear);
        if (parsed.timeOfBirth) {
          const [hour, minute] = parsed.timeOfBirth.split(":");
          setBirthHour(hour);
          setBirthMinute(minute);
        }
        setHydrating(false);
        return;
      }

      if (!user) {
        setHydrating(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "full_name,date_of_birth,lunar_date_of_birth,time_of_birth,place_of_birth,gender,ziwei_chart_json,ziwei_chart_image_url"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          const nextProfile: UserProfile = {
            fullName: data.full_name,
            dateOfBirth: data.date_of_birth,
            lunarDateOfBirth: data.lunar_date_of_birth,
            timeOfBirth: data.time_of_birth ?? undefined,
            placeOfBirth: data.place_of_birth,
            gender: data.gender ?? undefined,
            ziweiChartJson: (data as unknown as { ziwei_chart_json?: unknown }).ziwei_chart_json,
            ziweiChartImageUrl: (data as unknown as { ziwei_chart_image_url?: string | null }).ziwei_chart_image_url ?? undefined,
          };
          const [storedYear, storedMonth, storedDay] = nextProfile.dateOfBirth.split("-");
          setStoredProfile(nextProfile);
          setProfile(nextProfile);
          setFullName(nextProfile.fullName ?? "");
          setGender(nextProfile.gender ?? "");
          setPlaceOfBirth(nextProfile.placeOfBirth ?? "");
          setDay(storedDay);
          setMonth(storedMonth.replace(/^0/, ""));
          setYear(storedYear);
          if (nextProfile.timeOfBirth) {
            const [hour, minute] = nextProfile.timeOfBirth.split(":");
            setBirthHour(hour);
            setBirthMinute(minute);
          }
        }
      } catch (error) {
        console.error("Failed to hydrate profile:", error);
      } finally {
        setHydrating(false);
      }
    };

    void hydrate();
  }, [user]);

  useEffect(() => {
    const loadProvinces = async () => {
      setLocationsLoading(true);
      try {
        const response = await fetch("https://provinces.open-api.vn/api/p/?depth=1");
        if (!response.ok) throw new Error("Failed to load provinces");
        const data = (await response.json()) as Array<{ code: number; name: string }>;
        setProvinces(data);
      } catch (error) {
        console.error("Failed to load provinces:", error);
      } finally {
        setLocationsLoading(false);
      }
    };

    void loadProvinces();
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      setDistrictCode("");
      setWards([]);
      setWardCode("");
      return;
    }

    const loadDistricts = async () => {
      setLocationsLoading(true);
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        if (!response.ok) throw new Error("Failed to load districts");
        const data = (await response.json()) as { districts: Array<{ code: number; name: string }> };
        setDistricts(data.districts ?? []);
      } catch (error) {
        console.error("Failed to load districts:", error);
        setDistricts([]);
      } finally {
        setLocationsLoading(false);
      }
    };

    void loadDistricts();
  }, [provinceCode]);

  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      setWardCode("");
      return;
    }

    const loadWards = async () => {
      setLocationsLoading(true);
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        if (!response.ok) throw new Error("Failed to load wards");
        const data = (await response.json()) as { wards: Array<{ code: number; name: string }> };
        setWards(data.wards ?? []);
      } catch (error) {
        console.error("Failed to load wards:", error);
        setWards([]);
      } finally {
        setLocationsLoading(false);
      }
    };

    void loadWards();
  }, [districtCode]);

  const requiresProfile = useMemo(() => {
    if (mode === "edit") return true;
    const hasCompleteProfile =
      !!profile && !!profile.fullName && !!profile.dateOfBirth && !!profile.placeOfBirth;

    return !hasCompleteProfile;
  }, [mode, profile]);

  if (loading || hydrating) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!requiresProfile) {
    return <>{children}</>;
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = t("profile.fullNameError");
    if (!day || !month || !year) nextErrors.dateOfBirth = t("profile.dobError");
    const hasSelectedLocation = !!provinceCode && !!districtCode && !!wardCode;
    if (!hasSelectedLocation && !placeOfBirth.trim()) nextErrors.placeOfBirth = t("profile.placeError");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const dateOfBirth = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const timeOfBirth = birthHour && birthMinute ? `${birthHour}:${birthMinute}` : "";
    const lunar = Lunar.fromDate(new Date(dateOfBirth));
    const lunarDateOfBirth = `${lunar.getYear()}-${String(lunar.getMonth()).padStart(2, "0")}-${String(lunar.getDay()).padStart(2, "0")}`;

    const hasSelectedLocation = !!provinceCode && !!districtCode && !!wardCode;
    const provinceName = provinces.find((item) => String(item.code) === provinceCode)?.name ?? "";
    const districtName = districts.find((item) => String(item.code) === districtCode)?.name ?? "";
    const wardName = wards.find((item) => String(item.code) === wardCode)?.name ?? "";
    const nextPlace = hasSelectedLocation
      ? [wardName, districtName, provinceName].filter(Boolean).join(", ")
      : placeOfBirth.trim();

    const nextProfile: UserProfile = {
      fullName: fullName.trim(),
      dateOfBirth,
      lunarDateOfBirth,
      timeOfBirth: timeOfBirth || undefined,
      placeOfBirth: nextPlace,
      gender: gender || undefined,
    };

    const getChineseHourIndexFromTime = (value?: string) => {
      if (!value) return 0;
      const hourStr = value.split(":")[0];
      const hour = Number(hourStr);
      if (!Number.isFinite(hour)) return 0;
      if (hour >= 23 || hour < 1) return 0;
      if (hour >= 1 && hour < 3) return 1;
      if (hour >= 3 && hour < 5) return 2;
      if (hour >= 5 && hour < 7) return 3;
      if (hour >= 7 && hour < 9) return 4;
      if (hour >= 9 && hour < 11) return 5;
      if (hour >= 11 && hour < 13) return 6;
      if (hour >= 13 && hour < 15) return 7;
      if (hour >= 15 && hour < 17) return 8;
      if (hour >= 17 && hour < 19) return 9;
      if (hour >= 19 && hour < 21) return 10;
      return 11;
    };

    const getIztroGender = (value?: string) => {
      const normalized = (value ?? "").toLowerCase();
      if (normalized.includes("female") || normalized.includes("nữ") || normalized.includes("nu")) return "female" as const;
      return "male" as const;
    };

    const createZiweiChart = () => {
      try {
        const timeIndex = getChineseHourIndexFromTime(nextProfile.timeOfBirth);
        const izGender = getIztroGender(nextProfile.gender);
        return astro.astrolabeBySolarDate(nextProfile.dateOfBirth, timeIndex, izGender, true, "zh-CN");
      } catch (err) {
        console.error("Failed to create Zi Wei chart:", err);
        return null;
      }
    };

    const captureChartImageAndUpload = async (): Promise<string | null> => {
      if (!chartCaptureRef.current) return null;
      const timeIndex = getChineseHourIndexFromTime(nextProfile.timeOfBirth);
      const izGender = getIztroGender(nextProfile.gender);
      try {
        await new Promise((r) => window.setTimeout(r, 200));

        const node = chartCaptureRef.current.firstElementChild as HTMLElement | null;
        if (!node) return null;

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

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/png");
        });
        if (!blob) return null;

        const file = new File([blob], "ziwei-chart.png", { type: "image/png" });
        const path = `${user.id}/profile-${Date.now()}-ziwei.png`;

        const { error: uploadError } = await supabase.storage
          .from("eastern_uploads")
          .upload(path, file, { upsert: true, contentType: "image/png" });
        if (uploadError) {
          console.error("Failed to upload Zi Wei chart image:", uploadError);
          return null;
        }

        const publicUrl = supabase.storage.from("eastern_uploads").getPublicUrl(path).data.publicUrl;
        if (!publicUrl) return null;
        return publicUrl;
      } catch (err) {
        console.error("Failed to capture/upload Zi Wei chart image:", err);
        return null;
      } finally {
        void timeIndex;
        void izGender;
      }
    };

    const ziweiChart = createZiweiChart();
    const ziweiChartJson = ziweiChart ? (ziweiChart as unknown) : null;
    const ziweiChartImageUrl = await captureChartImageAndUpload();

    const nextProfileWithChart: UserProfile = {
      ...nextProfile,
      ziweiChartJson: ziweiChartJson ?? undefined,
      ziweiChartImageUrl: ziweiChartImageUrl ?? undefined,
    };

    setStoredProfile(nextProfileWithChart);
    setProfile(nextProfileWithChart);
    setPlaceOfBirth(nextPlace);

    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: nextProfileWithChart.fullName,
        date_of_birth: nextProfileWithChart.dateOfBirth,
        lunar_date_of_birth: nextProfileWithChart.lunarDateOfBirth,
        time_of_birth: nextProfileWithChart.timeOfBirth ?? null,
        place_of_birth: nextProfileWithChart.placeOfBirth,
        gender: nextProfileWithChart.gender ?? null,
        ziwei_chart_json: (nextProfileWithChart.ziweiChartJson as unknown as Json) ?? null,
        ziwei_chart_image_url: nextProfileWithChart.ziweiChartImageUrl ?? null,
      });

      if (error) {
        console.error("Failed to save profile:", error);
      }
    } catch (error) {
      console.error("Profile save error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto">
      <div
        style={{ position: "absolute", left: -99999, top: 0, width: 1024, background: "#ffffff" }}
        aria-hidden
      >
        <div ref={chartCaptureRef} style={{ width: 1024, padding: 8, background: "#ffffff" }}>
          <Iztrolabe
            birthday={`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`}
            birthTime={(birthHour && birthMinute ? (() => {
              const hour = Number(birthHour);
              if (!Number.isFinite(hour)) return 0;
              if (hour >= 23 || hour < 1) return 0;
              if (hour >= 1 && hour < 3) return 1;
              if (hour >= 3 && hour < 5) return 2;
              if (hour >= 5 && hour < 7) return 3;
              if (hour >= 7 && hour < 9) return 4;
              if (hour >= 9 && hour < 11) return 5;
              if (hour >= 11 && hour < 13) return 6;
              if (hour >= 13 && hour < 15) return 7;
              if (hour >= 15 && hour < 17) return 8;
              if (hour >= 17 && hour < 19) return 9;
              if (hour >= 19 && hour < 21) return 10;
              return 11;
            })() : 0) as number}
            birthdayType="solar"
            gender={(gender && gender.toLowerCase().includes("female") ? "female" : "male") as "male" | "female"}
            lang="vi-VN"
            horoscopeDate={new Date()}
            horoscopeHour={0}
          />
        </div>
      </div>
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8 mx-auto">
        <Reveal from="up" offset={18}>
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("profile.tagline")}</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              <GradientText text={t("profile.title")} />
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("profile.subtitle")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t("profile.timeNote")}</p>
          </div>
        </Reveal>

        <Reveal from="up" offset={18} delay={0.05}>
          <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="profile-full-name">{t("profile.fullName")}</Label>
            <Input
              id="profile-full-name"
              placeholder={t("profile.fullNamePlaceholder")}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("profile.dob")}</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue placeholder={t("calc.day")} /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder={t("calc.month")} /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder={t("calc.year")} /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("profile.timeOfBirth")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={birthHour} onValueChange={setBirthHour}>
                  <SelectTrigger><SelectValue placeholder="HH" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={birthMinute} onValueChange={setBirthMinute}>
                  <SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-gender">{t("profile.gender")}</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="profile-gender">
                  <SelectValue placeholder={t("profile.genderPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("calc.male")}</SelectItem>
                  <SelectItem value="female">{t("calc.female")}</SelectItem>
                  <SelectItem value="other">{t("calc.other")}</SelectItem>
                  <SelectItem value="prefer-not">{t("calc.preferNot")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("profile.placeOfBirth")}</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <Select value={provinceCode} onValueChange={setProvinceCode}>
                <SelectTrigger>
                  <SelectValue placeholder={t("profile.provincePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.code} value={String(province.code)}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={districtCode} onValueChange={setDistrictCode} disabled={!provinceCode}>
                <SelectTrigger>
                  <SelectValue placeholder={t("profile.districtPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.code} value={String(district.code)}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={wardCode} onValueChange={setWardCode} disabled={!districtCode}>
                <SelectTrigger>
                  <SelectValue placeholder={t("profile.wardPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward.code} value={String(ward.code)}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {locationsLoading && (
              <p className="text-xs text-muted-foreground">{t("profile.locationLoading")}</p>
            )}
            {placeOfBirth ? (
              <Input
                id="profile-place"
                placeholder={t("profile.placePlaceholder")}
                value={placeOfBirth}
                readOnly
              />
            ) : null}
            {errors.placeOfBirth && <p className="text-sm text-destructive">{errors.placeOfBirth}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? t("profile.saving") : t("profile.save")}
          </Button>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
