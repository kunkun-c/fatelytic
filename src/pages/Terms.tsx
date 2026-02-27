import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";

const Terms = () => {
  useLayoutConfig({
    seo: { titleKey: "seo.terms.title", descriptionKey: "seo.terms.desc", path: "/terms" },
  });

  return (
    <div className="mx-auto max-w-2xl">
        <Reveal from="up" offset={18}>
          <h1 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">Điều Khoản Sử Dụng</h1>
        </Reveal>

        <Reveal from="up" offset={18} delay={0.05}>
          <div className="space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="mb-2 text-lg font-semibold">1. Giới thiệu</h2>
            <p className="text-muted-foreground">
              Chào mừng bạn đến với Fatelytic. Bằng việc sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">2. Mục đích sử dụng</h2>
            <p className="text-muted-foreground">
              Fatelytic cung cấp các công cụ phân tích tâm lý và tử vi nhằm hỗ trợ tự khám phá bản thân. Nội dung được tạo bởi trí tuệ nhân tạo, chỉ mang tính chất tham khảo và suy ngẫm cá nhân. Fatelytic không thay thế tư vấn y tế, pháp lý hoặc tài chính chuyên môn.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">3. Tài khoản người dùng</h2>
            <p className="text-muted-foreground">
              Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình. Mọi hoạt động thực hiện dưới tài khoản của bạn được coi là do bạn thực hiện.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">4. Sở hữu trí tuệ</h2>
            <p className="text-muted-foreground">
              Tất cả nội dung, thiết kế và mã nguồn của Fatelytic thuộc quyền sở hữu của chúng tôi. Bạn không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự cho phép bằng văn bản.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">5. Giới hạn trách nhiệm</h2>
            <p className="text-muted-foreground">
              Fatelytic không chịu trách nhiệm về bất kỳ quyết định nào bạn đưa ra dựa trên kết quả phân tích. Dịch vụ được cung cấp "nguyên trạng" và chúng tôi không đảm bảo tính chính xác tuyệt đối của nội dung.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">6. Thay đổi điều khoản</h2>
            <p className="text-muted-foreground">
              Chúng tôi có quyền cập nhật các điều khoản này bất cứ lúc nào. Phiên bản mới nhất sẽ luôn được đăng tải tại trang này.
            </p>
          </section>

          <p className="pt-4 text-xs text-muted-foreground">Cập nhật lần cuối: Tháng 2, 2026</p>
          </div>
        </Reveal>
      </div>
  );
};

export default Terms;
