import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

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
        const redirectTo = sessionStorage.getItem("authRedirect") || "/dashboard";
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
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">{t("auth.completing")}</p>
      </div>
    </div>
  );
}
