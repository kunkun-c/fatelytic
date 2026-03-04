export type ModuleKey =
  | "speech_to_text"
  | "eastern_image"
  | "eastern_upload"
  | "eastern_overview"
  | "eastern_career"
  | "eastern_finance"
  | "eastern_marriage"
  | "eastern_health"
  | "eastern_fortune"
  | "eastern_saved_chart"
  | "eastern"
  | "numerology";

export type TopupPackageOption = {
  amountVnd: number;
  credits: number;
  titleVi: string;
  taglineVi: string;
  benefitsVi: string[];
};

export const TOPUP_PACKAGES: TopupPackageOption[] = [
  {
    amountVnd: 29000,
    credits: 50,
    titleVi: "Gói Khởi Đầu",
    taglineVi: "Dùng thử nghiêm túc, hỏi nhanh gọn",
    benefitsVi: ["~50 lượt chat", "hoặc ~6 lần xem lá số (upload)", "hoặc ~2 lần tạo ảnh + vài lượt chat"],
  },
  {
    amountVnd: 59000,
    credits: 120,
    titleVi: "Gói Tiêu Chuẩn",
    taglineVi: "Dùng thường xuyên cho luận giải",
    benefitsVi: ["~120 lượt chat", "hoặc ~15 lần xem lá số (upload)", "hoặc ~4 lần tạo ảnh + chat"],
  },
  {
    amountVnd: 99000,
    credits: 220,
    titleVi: "Gói Nâng Cao",
    taglineVi: "Cân bằng giữa chat và chuyên sâu",
    benefitsVi: ["~220 lượt chat", "hoặc ~27 lần xem lá số (upload)", "hoặc ~8 lần tạo ảnh + chat"],
  },
  {
    amountVnd: 199000,
    credits: 500,
    titleVi: "Gói Chuyên Sâu",
    taglineVi: "Tối ưu cho tạo ảnh và dùng dài hạn",
    benefitsVi: ["~500 lượt chat", "hoặc ~62 lần xem lá số (upload)", "hoặc ~20 lần tạo ảnh + chat"],
  },
];

export function getModuleCost(resolvedModule: string): number {
  switch (resolvedModule) {
    case "speech_to_text":
      return 2;
    case "eastern_image":
      return 25;
    case "eastern_upload":
      return 8;
    case "eastern_overview":
    case "eastern_career":
    case "eastern_finance":
    case "eastern_marriage":
    case "eastern_health":
    case "eastern_fortune":
    case "eastern_saved_chart":
    case "eastern":
      return 5;
    default:
      return 1;
  }
}
