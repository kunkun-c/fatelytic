import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";

const Privacy = () => {
  useLayoutConfig({
    seo: { titleKey: "seo.privacy.title", descriptionKey: "seo.privacy.desc", path: "/privacy" },
  });

  return (
    <div className="mx-auto max-w-2xl">
        <Reveal from="up" offset={18}>
          <h1 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">Chính Sách Bảo Mật</h1>
        </Reveal>

        <Reveal from="up" offset={18} delay={0.05}>
          <div className="space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="mb-2 text-lg font-semibold">1. Thông tin chúng tôi thu thập</h2>
            <p className="text-muted-foreground">
              Khi bạn sử dụng Fatelytic, chúng tôi có thể thu thập: thông tin tài khoản (email, tên), thông tin hồ sơ (ngày sinh, giờ sinh, nơi sinh), và dữ liệu sử dụng (lịch sử phân tích, cuộc hội thoại tư vấn).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">2. Mục đích sử dụng dữ liệu</h2>
            <p className="text-muted-foreground">
              Dữ liệu của bạn được sử dụng để: cung cấp kết quả phân tích cá nhân hoá, cải thiện trải nghiệm người dùng, và lưu trữ lịch sử sử dụng để bạn có thể xem lại.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">3. Bảo mật dữ liệu</h2>
            <p className="text-muted-foreground">
              Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ thông tin của bạn. Dữ liệu được mã hoá trong quá trình truyền tải và lưu trữ trên hạ tầng bảo mật của Supabase.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">4. Chia sẻ thông tin</h2>
            <p className="text-muted-foreground">
              Chúng tôi không bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn cho bên thứ ba, ngoại trừ khi được yêu cầu bởi pháp luật hoặc để cung cấp dịch vụ (ví dụ: xử lý AI qua Google Gemini).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">5. Quyền của bạn</h2>
            <p className="text-muted-foreground">
              Bạn có quyền: xem, chỉnh sửa hoặc xoá thông tin cá nhân bất cứ lúc nào thông qua trang Cá nhân. Bạn cũng có thể yêu cầu xoá toàn bộ tài khoản bằng cách liên hệ với chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">6. Cookie và bộ nhớ cục bộ</h2>
            <p className="text-muted-foreground">
              Fatelytic sử dụng localStorage để lưu cache dữ liệu nhằm tối ưu hiệu suất. Bạn có thể xoá dữ liệu này bất cứ lúc nào thông qua cài đặt trình duyệt.
            </p>
          </section>

          <p className="pt-4 text-xs text-muted-foreground">Cập nhật lần cuối: Tháng 2, 2026</p>
          </div>
        </Reveal>
      </div>
  );
};

export default Privacy;
