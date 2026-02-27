import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Loader2 } from "@/components/ui/icons";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.authCallback.title", descriptionKey: "seo.authCallback.desc", path: "/auth/callback" },
    disableContentWrapper: true,
  });

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Get the intended destination from sessionStorage
        const redirectTo = sessionStorage.getItem("authRedirect") || "/explore";
        sessionStorage.removeItem("authRedirect");
        navigate(redirectTo, { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center">
        <Reveal from="up" offset={18}>
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-5 w-5 text-primary" />
          </div>
        </Reveal>
        <Reveal from="up" offset={18} delay={0.05}>
          <p className="text-sm font-semibold text-foreground">
            <GradientText text={t("auth.completing")} />
          </p>
        </Reveal>
      </div>
    </div>
  );
}
