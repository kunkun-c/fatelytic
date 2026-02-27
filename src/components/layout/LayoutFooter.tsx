import { Link } from "react-router-dom";

import { useI18n } from "@/lib/i18n";
import { APP_INITIAL, APP_NAME } from "@/lib/brand";

export default function LayoutFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">{APP_INITIAL}</span>
              {APP_NAME}
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Nền tảng khám phá bản thân qua phân tích tâm lý, tử vi và thần số học.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Khám phá</p>
            <div className="flex flex-col gap-2">
              <Link to="/overview" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Tổng quan
              </Link>
              <Link to="/explore" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Khám phá
              </Link>
              <Link to="/eastern-astrology" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Tử vi phương đông
              </Link>
              <Link to="/consultation" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Tư vấn
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tài khoản</p>
            <div className="flex flex-col gap-2">
              <Link to="/profile" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Trang cá nhân
              </Link>
              <Link to="/history" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Lịch sử
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pháp lý</p>
            <div className="flex flex-col gap-2">
              <Link to="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Điều khoản sử dụng
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Chính sách bảo mật
              </Link>
              <Link to="/disclaimer" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("footer.disclaimer")}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">{t("footer.forReflection")}</p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} {APP_NAME}. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
