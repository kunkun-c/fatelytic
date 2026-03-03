import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Menu, X, User, ChevronDown, LogOut, Globe } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { MorphingText } from "@/components/animate-ui/primitives/texts/morphing";
import { useI18n } from "@/lib/i18n";
import { APP_INITIAL, APP_NAME } from "@/lib/brand";
import { useAuth } from "@/lib/auth";

export default function LayoutHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();

  const avatarSrc =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    undefined;

  const navItems = [
    { label: t("nav.overview"), path: "/overview" },
    { label: t("nav.explore"), path: "/explore" },
    { label: t("nav.easternAstrology"), path: "/eastern-astrology", highlight: true },
    { label: t("nav.consultation"), path: "/consultation" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const [navActive, setNavActive] = useState(location.pathname);

  const [langActive, setLangActive] = useState(lang);

  const langItems = useMemo(
    () => [
      { value: "vi" as const, label: "VI" },
      { value: "en" as const, label: "EN" },
    ],
    []
  );

  useEffect(() => {
    setNavActive(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    setLangActive(lang);
  }, [lang]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-foreground">
          <img src="/assets/images/logo.png" alt="Fatelytic" className="h-9 w-9 rounded-xl" />
          <GradientText 
            text={APP_NAME} 
            className="font-display text-xl font-semibold tracking-tight"
            gradient="var(--gradient-primary)"
            neon={false}
            transition={{ duration: 3000, repeat: Infinity, ease: 'linear' }}
          />
        </Link>

        <Highlight
          as="nav"
          mode="parent"
          controlledItems
          hover={false}
          click={false}
          value={navActive}
          exitDelay={120}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="rounded-full bg-background/80 shadow-md shadow-foreground/5 ring-1 ring-border/60"
          containerClassName="hidden items-center gap-2 rounded-full bg-secondary/60 p-1 md:flex"
          boundsOffset={{ top: 0, left: 0, width: 0, height: 0 }}
        >
          {navItems.map((item) => (
            <HighlightItem key={item.path} value={item.path} asChild>
              <Link
                to={item.path}
                onMouseEnter={() => setNavActive(item.path)}
                onMouseLeave={() => setNavActive(location.pathname)}
                className={`relative rounded-full px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer select-none ${
                  isActive(item.path)
                    ? "text-foreground"
                    : (item as { highlight?: boolean }).highlight
                      ? "text-gradient-primary font-semibold hover:opacity-80"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </HighlightItem>
          ))}
        </Highlight>

        <div className="hidden items-center gap-2 md:flex">
          {/* <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1 ring-1 ring-border/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-muted-foreground">
              <Globe className="h-4 w-4" />
            </div>
            <Highlight
              as="div"
              mode="parent"
              controlledItems
              hover={false}
              click={false}
              value={langActive}
              exitDelay={120}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="rounded-full bg-background/80 shadow-sm shadow-foreground/5"
              containerClassName="flex items-center gap-1 rounded-full"
              boundsOffset={{ top: 0, left: 0, width: 0, height: 0 }}
            >
              {langItems.map((item) => (
                <HighlightItem key={item.value} value={item.value} asChild>
                  <button
                    type="button"
                    onClick={() => setLang(item.value)}
                    onMouseEnter={() => setLangActive(item.value)}
                    onMouseLeave={() => setLangActive(lang)}
                    aria-label={t(item.value === "vi" ? "lang.vi" : "lang.en")}
                    className={`relative rounded-full px-3 py-2 text-sm font-semibold transition-colors select-none ${
                      lang === item.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                </HighlightItem>
              ))}
            </Highlight>
          </div> */}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-secondary"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={avatarSrc}
                    alt={
                      (user.user_metadata?.full_name as string | undefined) ??
                      (user.user_metadata?.name as string | undefined) ??
                      user.email ??
                      "User"
                    }
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card/95 p-1 shadow-xl"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {t("nav.profile")}
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setUserMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {t("nav.history")}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {t("nav.signIn")}
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-full p-2 hover:bg-secondary">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(item.path)
                    ? "bg-secondary text-foreground"
                    : (item as { highlight?: boolean }).highlight
                      ? "text-gradient-primary font-semibold"
                      : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {/* <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1 ring-1 ring-border/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                  </div>
                  <Highlight
                    as="div"
                    mode="parent"
                    controlledItems
                    hover={false}
                    click={false}
                    value={langActive}
                    exitDelay={120}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="rounded-full bg-background/80 shadow-sm shadow-foreground/5"
                    containerClassName="flex items-center gap-1 rounded-full"
                    boundsOffset={{ top: 0, left: 0, width: 0, height: 0 }}
                  >
                    {langItems.map((item) => (
                      <HighlightItem key={item.value} value={item.value} asChild>
                        <button
                          type="button"
                          onClick={() => setLang(item.value)}
                          onMouseEnter={() => setLangActive(item.value)}
                          onMouseLeave={() => setLangActive(lang)}
                          aria-label={t(item.value === "vi" ? "lang.vi" : "lang.en")}
                          className={`relative rounded-full px-3 py-2 text-sm font-semibold transition-colors select-none ${
                            lang === item.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {item.label}
                        </button>
                      </HighlightItem>
                    ))}
                  </Highlight>
                </div>
              </div> */}

              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={avatarSrc}
                        alt={
                          (user.user_metadata?.full_name as string | undefined) ??
                          (user.user_metadata?.name as string | undefined) ??
                          user.email ??
                          "User"
                        }
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      {t("nav.profile")}
                    </Button>
                  </Link>
                  <Link to="/history" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      {t("nav.history")}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-destructive"
                    onClick={() => {
                      signOut();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.signOut")}
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    {t("nav.signIn")}
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
