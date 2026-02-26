import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateNumerologyResult } from "@/lib/numerology";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { getStoredProfile } from "@/lib/profile";
import { Loader2 } from "lucide-react";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

const Calculator = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user } = useAuth();

  useLayoutConfig({
    seo: { titleKey: "seo.calc.title", descriptionKey: "seo.calc.desc", path: "/calculator" },
  });
  const [fullName, setFullName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrating, setHydrating] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const storedProfile = getStoredProfile();
    if (storedProfile && storedProfile.fullName && storedProfile.dateOfBirth) {
      setProfile(storedProfile);
      setFullName(storedProfile.fullName);
      const [year, month, day] = storedProfile.dateOfBirth.split("-");
      setYear(year);
      setMonth(month);
      setDay(day);
      if (storedProfile.gender) {
        setGender(storedProfile.gender);
      }
    }
    setHydrating(false);
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = t("calc.nameError");
    if (!day || !month || !year) e.dateOfBirth = t("calc.dobError");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const dateOfBirth = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    // Generate result
    const result = generateNumerologyResult(fullName, dateOfBirth, lang);

    // Save to Supabase if user is logged in
    if (user) {
      try {
        const { error } = await supabase.from("numerology_readings").insert({
          user_id: user.id,
          full_name: fullName,
          date_of_birth: dateOfBirth,
          gender: gender || null,
          life_path_number: result.lifePathNumber,
          expression_number: result.expressionNumber,
          soul_urge_number: result.soulUrgeNumber,
          result_json: result as unknown as Json,
        });

        if (error) {
          console.error("Error saving reading:", error);
        } else {
          toast.success(lang === "vi" ? "Đã lưu kết quả vào lịch sử" : "Reading saved to history");
        }
      } catch (err) {
        console.error("Failed to save reading:", err);
      }
    }

    navigate("/result", { state: { result, fullName, dateOfBirth, gender } });
    setLoading(false);
  };

  // If user has complete profile, show direct analysis button
  if (profile && profile.fullName && profile.dateOfBirth) {
    return (
      <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{t("calc.title")}</h1>
            <p className="text-muted-foreground">
              {lang === "vi" ? "Sẵn sàng phân tích thần số học của bạn" : "Ready to analyze your numerology"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-2xl font-bold text-primary">✨</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {profile.fullName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {profile.dateOfBirth} {profile.placeOfBirth && `• ${profile.placeOfBirth}`}
              </p>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full shadow-md" 
              size="lg" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("calc.generating")}
                </span>
              ) : (
                t("calc.generate")
              )}
            </Button>

            <button 
              onClick={() => {
                setProfile(null);
                setFullName("");
                setDay("");
                setMonth("");
                setYear("");
                setGender("");
              }}
              className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {lang === "vi" ? "Chỉnh sửa thông tin" : "Edit information"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">{t("calc.privacy")}</p>
        </div>
    );
  }

  if (hydrating) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  return (
    <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{t("calc.title")}</h1>
          <p className="text-muted-foreground">{t("calc.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("calc.fullName")}</Label>
            <Input
              id="fullName"
              placeholder={t("calc.fullNamePlaceholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("calc.dob")}</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue placeholder={t("calc.day")} /></SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder={t("calc.month")} /></SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder={t("calc.year")} /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">{t("calc.gender")}</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder={t("calc.selectGender")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("calc.male")}</SelectItem>
                <SelectItem value="female">{t("calc.female")}</SelectItem>
                <SelectItem value="other">{t("calc.other")}</SelectItem>
                <SelectItem value="prefer-not">{t("calc.preferNot")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 opacity-50">
            <Label>{t("calc.timeOfBirth")}</Label>
            <Input disabled placeholder={t("calc.comingSoon")} />
          </div>

          <div className="space-y-2 opacity-50">
            <Label>{t("calc.location")}</Label>
            <Input disabled placeholder={t("calc.comingSoon")} />
          </div>

          <Button type="submit" className="w-full shadow-md" size="lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {t("calc.generating")}
              </span>
            ) : (
              t("calc.generate")
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("calc.privacy")}</p>
      </div>
  );
};

export default Calculator;
