import { useState } from "react";
import { Button, Input, Label, MysticLoader } from "@/components/ui";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthApiError } from "@supabase/supabase-js";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const { signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutConfig({
    seo: { titleKey: "seo.login.title", descriptionKey: "seo.login.desc", path: "/login" },
    disableContentWrapper: true,
  });

  // Store intended destination for post-login redirect
  const from = location.state?.from || "/explore";

  const validate = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error(t("login.validation.emailRequired"));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error(t("login.validation.emailInvalid"));
      return false;
    }
    if (!password) {
      toast.error(t("login.validation.passwordRequired"));
      return false;
    }
    if (password.length < 6) {
      toast.error(t("login.validation.passwordMin"));
      return false;
    }
    if (isSignUp && !name.trim()) {
      toast.error(t("login.validation.nameRequired"));
      return false;
    }
    return true;
  };

  const getAuthErrorCode = (error: AuthApiError): string => {
    const maybeWithCode = error as unknown as { code?: unknown };
    return typeof maybeWithCode.code === "string" ? maybeWithCode.code : "";
  };

  const logAuthError = (context: string, error: unknown) => {
    if (error instanceof AuthApiError) {
      console.error(`${context}:`, {
        name: error.name,
        status: error.status,
        code: getAuthErrorCode(error),
        message: error.message,
      });
      return;
    }
    console.error(`${context}:`, error);
  };

  const handleAuthErrorToast = (error: unknown) => {
    if (!(error instanceof AuthApiError)) {
      toast.error(t("login.toast.authError"));
      return;
    }

    const message = (error.message || "").toLowerCase();
    const code = getAuthErrorCode(error).toLowerCase();

    if (message.includes("invalid login credentials")) {
      toast.error(t("login.error.invalidCredentials"));
      return;
    }

    if (code.includes("user_already_exists") || message.includes("already registered")) {
      toast.error(t("login.error.userAlreadyExists"));
      return;
    }

    if (message.includes("password") && message.includes("should")) {
      toast.error(t("login.error.passwordWeak"));
      return;
    }

    if (message.includes("invalid") && message.includes("email")) {
      toast.error(t("login.validation.emailInvalid"));
      return;
    }

    toast.error(error.message || t("login.toast.authError"));
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Save redirect destination before OAuth flow
      sessionStorage.setItem("authRedirect", from);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error(t("login.toast.googleError"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    
    try {
      if (isSignUp) {
        const result = await signUpWithPassword(email, password, name || undefined);
        
        if (result.user && result.session) {
          // Auto-login successful - user is signed in
          toast.success(t("login.toast.signUpSuccess"));
          navigate(from, { replace: true });
        } else if (result.user && !result.session) {
          // Email confirmation required
          toast.success(t("login.toast.signUpSuccess"));
          toast.info(t("login.toast.emailConfirmation"));
          navigate("/login", { replace: true });
        } else {
          throw new Error("Sign up failed");
        }
      } else {
        await signInWithPassword(email, password);
        toast.success(t("login.toast.signInSuccess"));
        navigate(from, { replace: true });
      }
    } catch (error) {
      logAuthError("Auth error", error);

      if (!isSignUp && error instanceof AuthApiError && (error.message || "").toLowerCase().includes("invalid login credentials")) {
        toast.info("Chưa có tài khoản? Mình đã chuyển bạn sang tạo tài khoản với thông tin vừa nhập.");
        setIsSignUp(true);
        handleAuthErrorToast(error);
      } else {
        handleAuthErrorToast(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Reveal from="up" offset={18}>
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
              <GradientText text={isSignUp ? t("login.createAccount") : t("login.welcome")} />
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? t("login.startJourney") : t("login.continueJourney")}
            </p>
          </div>
        </Reveal>

        {/* Google Login */}
        <Button
          variant="outline"
          size="lg"
          className="mb-4 w-full gap-3 text-base font-medium shadow-sm"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? <MysticLoader size="sm" label={t("login.loading")} /> : t("login.google")}
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t("login.orContinue")}</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">{t("login.name")}</Label>
              <Input 
                id="name" 
                placeholder={t("login.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("login.password")}</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder={t("login.enterPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            className="w-full shadow-sm" 
            size="lg"
            type="submit"
            disabled={loading}
          >
            {loading ? <MysticLoader size="sm" /> : (isSignUp ? t("login.signUpBtn") : t("login.signInBtn"))}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isSignUp ? t("login.alreadyHave") : t("login.dontHave")}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-primary hover:underline">
            {isSignUp ? t("login.signInBtn") : t("login.signUpBtn")}
          </button>
        </p>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            {t("login.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
