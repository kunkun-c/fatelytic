import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BASE_PROMPTS, MODULE_PROMPTS } from "./prompts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getModuleCost } from "../_shared/credits.ts";

type ModuleKey = Extract<keyof typeof MODULE_PROMPTS, string>;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_API_STREAM_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL or SERVICE_ROLE_KEY environment variable is not set");
}

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    })
  : null;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set");
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization") ?? "";
  const m = header.match(/^\s*Bearer\s+(.+)\s*$/i);
  return m ? m[1] : null;
}

function moduleCost(resolvedModule: string): number {
  return getModuleCost(resolvedModule);
}

function buildSseResponse(corsHeaders: Record<string, string>, text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function callGeminiText(
  apiKey: string,
  systemPrompt: string,
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
): Promise<string> {
  const url = `${GEMINI_API_URL}?key=${apiKey}`;
  const payload = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini Text API error:", res.status, err);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const json = await res.json();
  const outParts = json.candidates?.[0]?.content?.parts;
  return String(readGeminiTextParts(outParts) ?? "");
}

function parseBirthYear(dateOfBirth: string | undefined) {
  if (!dateOfBirth) return null;
  const m = /^\s*(\d{4})/.exec(dateOfBirth);
  if (!m) return null;
  const year = Number(m[1]);
  if (!Number.isFinite(year) || year < 1900 || year > 2100) return null;
  return year;
}

function inferLocaleFromPlace(placeOfBirth: string | undefined | null) {
  const raw = (placeOfBirth ?? "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const parts = normalized.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const country = parts[parts.length - 1];
    return country;
  }

  return normalized;
}

function buildImagenProfileContext(profile?: ProfileContext, lang: "en" | "vi" = "en") {
  if (!profile) return "";

  const birthYear = parseBirthYear(profile.dateOfBirth);
  const currentYear = new Date().getUTCFullYear();
  const age = birthYear ? Math.max(0, currentYear - birthYear) : null;

  const gender = profile.gender ?? null;
  const locale = inferLocaleFromPlace(profile.placeOfBirth);

  if (lang === "vi") {
    return `\nNgữ cảnh người dùng (đã ẩn danh):\n- Bối cảnh địa lý (khái quát): ${locale ?? "(không cung cấp)"}\n- Năm sinh (ước lượng): ${birthYear ?? "(không cung cấp)"}\n- Độ tuổi (ước lượng): ${age ?? "(không cung cấp)"}\n- Giới tính: ${gender ?? "(không cung cấp)"}\n`;
  }

  return `\nUser context (anonymized):\n- Geographic context (coarse): ${locale ?? "(not provided)"}\n- Birth year (approx): ${birthYear ?? "(not provided)"}\n- Age (approx): ${age ?? "(not provided)"}\n- Gender: ${gender ?? "(not provided)"}\n`;
}

function buildImageAnalysisProfileContext(profile?: ProfileContext, lang: "en" | "vi" = "en") {
  if (!profile) return "";

  const birthYear = parseBirthYear(profile.dateOfBirth);
  const currentYear = new Date().getUTCFullYear();
  const age = birthYear ? Math.max(0, currentYear - birthYear) : null;

  if (lang === "vi") {
    return `\nHồ sơ người dùng (dùng để suy luận, không đưa vào prompt Imagen dưới dạng PII):\n- Năm sinh: ${birthYear ?? "(không cung cấp)"}\n- Độ tuổi (ước lượng): ${age ?? "(không cung cấp)"}\n- Giới tính: ${profile.gender ?? "(không cung cấp)"}\n- Nơi sinh (chỉ dùng làm gợi ý bối cảnh/văn hoá): ${profile.placeOfBirth ?? "(không cung cấp)"}\n- Giờ sinh: ${profile.timeOfBirth ?? "(không cung cấp)"}\n- Ngày sinh âm lịch: ${profile.lunarDateOfBirth ?? "(không cung cấp)"}\n`;
  }

  return `\nUser profile (for reasoning; do not put PII into Imagen prompt):\n- Birth year: ${birthYear ?? "(not provided)"}\n- Approx age: ${age ?? "(not provided)"}\n- Gender: ${profile.gender ?? "(not provided)"}\n- Place of birth (only for cultural context): ${profile.placeOfBirth ?? "(not provided)"}\n- Time of birth: ${profile.timeOfBirth ?? "(not provided)"}\n- Lunar date of birth: ${profile.lunarDateOfBirth ?? "(not provided)"}\n`;
}

function coercePartnerSketch(obj: unknown): {
  genderPresentation?: string | null;
  ageRange?: string | null;
  style?: string | null;
  overallVibe?: string | null;
  facialFeatures?: string[] | null;
  hair?: string | null;
} | null {
  if (!obj || typeof obj !== "object") return null;
  const anyObj = obj as Record<string, unknown>;
  const facialFeaturesRaw = anyObj.facialFeatures;
  return {
    genderPresentation: typeof anyObj.genderPresentation === "string" ? anyObj.genderPresentation : null,
    ageRange: typeof anyObj.ageRange === "string" ? anyObj.ageRange : null,
    style: typeof anyObj.style === "string" ? anyObj.style : null,
    overallVibe: typeof anyObj.overallVibe === "string" ? anyObj.overallVibe : null,
    facialFeatures: Array.isArray(facialFeaturesRaw)
      ? facialFeaturesRaw.filter((x) => typeof x === "string")
      : null,
    hair: typeof anyObj.hair === "string" ? anyObj.hair : null,
  };
}

async function callGeminiJson(
  apiKey: string,
  systemPrompt: string,
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
): Promise<unknown> {
  const url = `${GEMINI_API_URL}?key=${apiKey}`;
  const payload = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini JSON API error:", res.status, err);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const json = await res.json();
  const outParts = json.candidates?.[0]?.content?.parts;
  const text = readGeminiTextParts(outParts);

  try {
    const cleaned = stripJsonFences(String(text));
    const extracted = extractFirstJsonObject(cleaned) ?? cleaned;
    return JSON.parse(extracted);
  } catch (err) {
    console.error("Failed to parse Gemini JSON:", err, text);
    throw new Error("Invalid JSON from Gemini");
  }
}

function getEasternUploadSystemMarker(contextJson: unknown, lang: "en" | "vi"): string {
  if (!contextJson || typeof contextJson !== "object" || Array.isArray(contextJson)) return "";
  const obj = contextJson as Record<string, unknown>;
  const uploadSource = obj.uploadSource;
  const chartOrigin = obj.chartOrigin;
  const isSaved = uploadSource === "saved" || chartOrigin === "system";
  if (!isSaved) return "";

  return lang === "vi"
    ? "\n\nGHI CHÚ HỆ THỐNG (QUAN TRỌNG): Đây là lá số do HỆ THỐNG sinh ra và đã lưu (không phải ảnh user tự upload).\n\n1) DỮ KIỆN LÁ SỐ:\n- Nếu có ziweiChartJson trong contextJson: dùng nó như NGUỒN DỮ KIỆN CHÍNH (authoritative).\n- Tuyệt đối KHÔNG bịa sao/cung/địa bàn. Thiếu gì thì ghi rõ đúng một trong hai câu: 'Không có trong dữ liệu lá số' hoặc 'Không rõ từ ảnh'.\n\n2) THỐNG NHẤT TÊN GỌI:\n- Dùng tên Cung/Sao chuẩn (ví dụ: Cung Mệnh, Cung Thân, Quan Lộc, Tài Bạch, Thiên Di, Phúc Đức, Phu Thê, Điền Trạch, Tật Ách, Phụ Mẫu, Huynh Đệ, Tử Tức, Nô Bộc).\n- Khi viết tổ hợp, dùng đúng dạng: 'Cung Thân đồng cung với cung Quan Lộc'.\n\n3) OVERVIEW ITEMS (BẮT BUỘC ỔN ĐỊNH):\n- overviewItems CHỈ gồm các mục sau, ĐÚNG heading, KHÔNG thêm mục khác: Họ và tên; Ngày sinh dương lịch; Ngày sinh âm lịch; Giờ sinh; Giới tính; Năm xem; Âm dương; Bản mệnh; Cân lượng; Chủ mệnh; Chủ thân; Lai nhân cung; Cung hoàng đạo; Tuổi.\n- Nếu không có dữ liệu: item.text = 'Không có trong dữ liệu lá số'.\n\n4) LUẬN GIẢI 12 CUNG (HEADING CỐ ĐỊNH):\n- Các tiêu đề cung phải theo đúng dạng: 'Cung Mệnh (Luận về con người)', 'Cung Quan Lộc (Luận về công danh)', ... (đủ 12 cung).\n\n5) NGUỒN TRÍCH DẪN:\n- Mỗi đoạn luận giải quan trọng nên kèm nguồn uy tín nếu có: Tử Vi Đẩu Số Toàn Thư, Tử Vi Hàm Số, Trung Châu Tử Vi Đẩu Số (Tứ Hóa Phái), Tử Vi Đẩu Số Tinh Hoa Tập Thành...\n- Văn phong dạng trích dẫn sách: ngắn, rõ, có căn cứ."
    : "\n\nSYSTEM NOTE (IMPORTANT): This is a SYSTEM-generated saved Tu Vi chart (not a user-uploaded image).\n\n1) CHART FACTS:\n- If contextJson includes ziweiChartJson: treat it as the authoritative source of chart facts.\n- Never invent palaces/stars. If missing, use exactly one: 'Not present in chart data' or 'Not visible from image'.\n\n2) TERMINOLOGY:\n- Use standardized palace/star names and consistent phrasing (e.g. 'Cung Thân đồng cung với cung Quan Lộc').\n\n3) OVERVIEW ITEMS (MUST BE STABLE):\n- overviewItems must contain ONLY these headings (no extras): Họ và tên; Ngày sinh dương lịch; Ngày sinh âm lịch; Giờ sinh; Giới tính; Năm xem; Âm dương; Bản mệnh; Cân lượng; Chủ mệnh; Chủ thân; Lai nhân cung; Cung hoàng đạo; Tuổi.\n- If a value is unavailable: item.text = 'Not present in chart data'.\n\n4) SOURCES:\n- Prefer reputable sources (Tu Vi classics) and write in short book-style excerpt items.";
}

function isSavedEasternUpload(contextJson: unknown): boolean {
  if (!contextJson || typeof contextJson !== "object" || Array.isArray(contextJson)) return false;
  const obj = contextJson as Record<string, unknown>;
  return obj.uploadSource === "saved" || obj.chartOrigin === "system";
}

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractBirthYear(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const m = String(dateOfBirth).match(/(\d{4})/);
  if (!m) return null;
  const year = Number(m[1]);
  return Number.isFinite(year) ? year : null;
}

function getCanChiYearVi(year: number): string {
  const can = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
  const chi = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  const canIndex = (year + 6) % 10;
  const chiIndex = (year + 8) % 12;
  return `${can[canIndex]} ${chi[chiIndex]}`;
}

function getChineseZodiacVi(year: number): string {
  const animals = [
    "Con Chuột (Tý)",
    "Con Trâu (Sửu)",
    "Con Hổ (Dần)",
    "Con Mèo (Mão)",
    "Con Rồng (Thìn)",
    "Con Rắn (Tỵ)",
    "Con Ngựa (Ngọ)",
    "Con Dê (Mùi)",
    "Con Khỉ (Thân)",
    "Con Gà (Dậu)",
    "Con Chó (Tuất)",
    "Con Heo (Hợi)",
  ];
  const idx = (year + 8) % 12;
  return animals[idx];
}

function getWesternZodiacVi(dateOfBirth?: string | null): string | null {
  if (!dateOfBirth) return null;
  const match = String(dateOfBirth).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;

  const signs = [
    { name: "Ma Kết", m: 1, d: 20 },
    { name: "Bảo Bình", m: 2, d: 19 },
    { name: "Song Ngư", m: 3, d: 21 },
    { name: "Bạch Dương", m: 4, d: 20 },
    { name: "Kim Ngưu", m: 5, d: 21 },
    { name: "Song Tử", m: 6, d: 22 },
    { name: "Cự Giải", m: 7, d: 23 },
    { name: "Sư Tử", m: 8, d: 23 },
    { name: "Xử Nữ", m: 9, d: 23 },
    { name: "Thiên Bình", m: 10, d: 24 },
    { name: "Bọ Cạp", m: 11, d: 23 },
    { name: "Nhân Mã", m: 12, d: 22 },
    { name: "Ma Kết", m: 12, d: 32 },
  ];
  const mmdd = month * 100 + day;
  for (const s of signs) {
    if (mmdd < s.m * 100 + s.d) return s.name;
  }
  return "Ma Kết";
}

function getSavedUploadOverviewItems(profile: ProfileContext | undefined, contextJson: unknown) {
  const ctxObj =
    contextJson && typeof contextJson === "object" && !Array.isArray(contextJson)
      ? (contextJson as Record<string, unknown>)
      : null;

  const ziweiChartJson = ctxObj && ctxObj.ziweiChartJson && typeof ctxObj.ziweiChartJson === "object" ? (ctxObj.ziweiChartJson as Record<string, unknown>) : null;
  const nowYear = new Date().getFullYear();
  const birthYear = extractBirthYear(profile?.dateOfBirth ?? null);
  const tuoi = birthYear ? nowYear - birthYear + 1 : null;
  const namXem = `${getCanChiYearVi(nowYear)} (${nowYear})${typeof tuoi === "number" ? `, ${tuoi} tuổi` : ""}`;

  const fromChartOrMissing = (keys: string[]): string => {
    if (!ziweiChartJson) return "Không có trong dữ liệu lá số";
    for (const k of keys) {
      const v = ziweiChartJson[k];
      const s = safeString(v);
      if (s) return s;
    }
    return "Không có trong dữ liệu lá số";
  };

  const solarDob = safeString(profile?.dateOfBirth) ?? "Không có trong dữ liệu lá số";
  const lunarDob = safeString(profile?.lunarDateOfBirth) ?? "Không có trong dữ liệu lá số";
  const timeOfBirth = safeString(profile?.timeOfBirth) ?? "Không có trong dữ liệu lá số";
  const gender = safeString(profile?.gender) ?? "Không có trong dữ liệu lá số";

  const westernZodiac = getWesternZodiacVi(profile?.dateOfBirth ?? null) ?? "Không có trong dữ liệu lá số";
  const tuoiConGiap = birthYear ? getChineseZodiacVi(birthYear) : "Không có trong dữ liệu lá số";

  const overviewItems = [
    { heading: "Họ và tên", text: safeString(profile?.fullName) ?? "Không có trong dữ liệu lá số" },
    { heading: "Ngày sinh dương lịch", text: solarDob },
    { heading: "Ngày sinh âm lịch", text: lunarDob },
    { heading: "Giờ sinh", text: timeOfBirth },
    { heading: "Giới tính", text: gender },
    { heading: "Năm xem", text: namXem },
    { heading: "Âm dương", text: fromChartOrMissing(["amDuong", "yinYang", "am_duong"]) },
    {
      heading: "Bản mệnh",
      text: (() => {
        const menh = fromChartOrMissing(["banMenh", "menh", "ban_menh"]);
        const cuc = safeString(ziweiChartJson?.cuc) ?? safeString(ziweiChartJson?.cucLabel) ?? null;
        const menhKhacCuc = safeString(ziweiChartJson?.menhKhacCuc) ?? safeString(ziweiChartJson?.menh_khac_cuc) ?? null;
        const parts = [
          menh !== "Không có trong dữ liệu lá số" ? menh : null,
          cuc ? `- ${cuc}` : null,
          menhKhacCuc ? `(${menhKhacCuc})` : null,
        ].filter(Boolean);
        return parts.length ? String(parts.join(" ")) : "Không có trong dữ liệu lá số";
      })(),
    },
    { heading: "Cân lượng", text: fromChartOrMissing(["canLuong", "canXuong", "can_xuong", "can_luong"]) },
    { heading: "Chủ mệnh", text: fromChartOrMissing(["chuMenh", "chu_menh"]) },
    { heading: "Chủ thân", text: fromChartOrMissing(["chuThan", "chu_than"]) },
    { heading: "Lai nhân cung", text: fromChartOrMissing(["laiNhanCung", "lai_nhan_cung"]) },
    { heading: "Cung hoàng đạo", text: westernZodiac },
    { heading: "Tuổi", text: typeof tuoi === "number" ? `${tuoi} tuổi` : "Không có trong dữ liệu lá số" },
  ];

  return { overviewItems, tuoiConGiap };
}

const EASTERN_UPLOAD_OVERVIEW_HEADINGS = [
  "Họ và tên",
  "Ngày sinh dương lịch",
  "Ngày sinh âm lịch",
  "Giờ sinh",
  "Giới tính",
  "Năm xem",
  "Âm dương",
  "Bản mệnh",
  "Cân lượng",
  "Chủ mệnh",
  "Chủ thân",
  "Lai nhân cung",
  "Cung hoàng đạo",
  "Tuổi",
] as const;

const EASTERN_UPLOAD_TOPICS = [
  { id: "menh-than", label: "Công danh sự nghiệp", target: "Cung Quan Lộc (Luận về công danh)" },
  { id: "no-boc", label: "Anh em, bạn bè", target: "Cung Nô Bộc (Luận về bạn bè)" },
  { id: "tu-tuc", label: "Con cái", target: "Cung Tử Tức (Luận về con cái)" },
  { id: "phu-the", label: "Tình duyên", target: "Cung Phu Thê (Luận về vợ chồng)" },
  { id: "phu-the-2", label: "Vợ chồng", target: "Cung Phu Thê (Luận về vợ chồng)" },
  { id: "tai-bach", label: "Tài vận, kinh tế", target: "Cung Tài Bạch (Luận về tiền bạc)" },
  { id: "tat-ach", label: "Sức khỏe, bệnh tật", target: "Cung Tật Ách (Luận về bệnh tật)" },
  { id: "thien-di", label: "Xuất ngoại", target: "Cung Thiên Di (Luận về xuất hành)" },
  { id: "no-boc-2", label: "Bằng hữu, đồng nghiệp", target: "Cung Nô Bộc (Luận về bạn bè)" },
  { id: "phuc-duc", label: "Phúc khí tổ tiên", target: "Cung Phúc Đức (Luận về họ hàng)" },
  { id: "phu-mau", label: "Cha mẹ", target: "Cung Phụ Mẫu (Luận về cha mẹ)" },
  { id: "dien-trach", label: "Nhà cửa, đất đai", target: "Cung Điền Trạch (Luận về nhà đất)" },
  { id: "menh", label: "Mệnh và Thân", target: "Cung Mệnh (Luận về con người)" },
] as const;

const EASTERN_UPLOAD_PALACE_TITLES = [
  "Cung Mệnh (Luận về con người)",
  "Cung Thân",
  "Cung Quan Lộc (Luận về công danh)",
  "Cung Tài Bạch (Luận về tiền bạc)",
  "Cung Thiên Di (Luận về xuất hành)",
  "Cung Phúc Đức (Luận về họ hàng)",
  "Cung Phu Thê (Luận về vợ chồng)",
  "Cung Điền Trạch (Luận về nhà đất)",
  "Cung Tật Ách (Luận về bệnh tật)",
  "Cung Phụ Mẫu (Luận về cha mẹ)",
  "Cung Huynh Đệ (Luận về anh/em)",
  "Cung Tử Tức (Luận về con cái)",
  "Cung Nô Bộc (Luận về bạn bè)",
] as const;

function normalizeDateVi(input: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  const m1 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m1) {
    const dd = String(m1[3]).padStart(2, "0");
    const mm = String(m1[2]).padStart(2, "0");
    return `${dd}-${mm}-${m1[1]}`;
  }
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) {
    const dd = String(m2[1]).padStart(2, "0");
    const mm = String(m2[2]).padStart(2, "0");
    return `${dd}-${mm}-${m2[3]}`;
  }
  const m3 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m3) {
    const dd = String(m3[1]).padStart(2, "0");
    const mm = String(m3[2]).padStart(2, "0");
    return `${dd}-${mm}-${m3[3]}`;
  }
  return s;
}

function normalizeTime(input: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/(\d{1,2})\s*[:hH]\s*(\d{1,2})/);
  if (m) {
    const hh = String(m[1]).padStart(2, "0");
    const mm = String(m[2]).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return s;
}

function normalizeGenderVi(input: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower === "male" || lower.includes("nam") || lower.includes("man")) return "Nam";
  if (lower === "female" || lower.includes("nữ") || lower.includes("nu") || lower.includes("woman")) return "Nữ";
  return s;
}

function stripDiacriticsForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeEasternUploadOverviewItems(
  profile: ProfileContext | undefined,
  parsed: Record<string, unknown>,
  contextJson: unknown
): Array<{ heading: string; text: string; source?: string; type?: string }> {
  const raw = Array.isArray(parsed.overviewItems) ? (parsed.overviewItems as unknown[]) : [];
  const map = new Map<string, { text: string; source?: string; type?: string }>();

  const canonicalizeHeading = (heading: string): string => {
    const key = stripDiacriticsForMatch(heading);
    if (key.includes("can xuong") || key.includes("can luong")) return "Cân lượng";
    if (key === "chu menh" || key.includes("chu menh")) return "Chủ mệnh";
    if (key === "chu than" || key.includes("chu than")) return "Chủ thân";
    if (key.includes("am duong") || key.includes("yin yang")) return "Âm dương";
    if (key.includes("ban menh") || key === "menh") return "Bản mệnh";
    if (key.includes("lai nhan cung")) return "Lai nhân cung";
    if (key.includes("cung hoang dao") || key.includes("zodiac")) return "Cung hoàng đạo";
    if (key.includes("nam xem") || key.includes("nam xem")) return "Năm xem";
    if (key.includes("gioi tinh") || key.includes("gender")) return "Giới tính";
    if (key.includes("ngay sinh duong")) return "Ngày sinh dương lịch";
    if (key.includes("ngay sinh am")) return "Ngày sinh âm lịch";
    if (key.includes("gio sinh") || key.includes("time")) return "Giờ sinh";
    if (key.includes("ho va ten") || key.includes("full name") || key.includes("name")) return "Họ và tên";
    if (key === "tuoi" || key.includes("age")) return "Tuổi";
    return heading;
  };

  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const obj = item as Record<string, unknown>;
    const heading = safeString(obj.heading) ?? null;
    const text = safeString(obj.text) ?? null;
    if (!heading || !text) continue;
    map.set(canonicalizeHeading(heading), {
      text,
      source: safeString(obj.source) ?? undefined,
      type: safeString(obj.type) ?? undefined,
    });
  }

  const nowYear = new Date().getFullYear();
  const birthYear = extractBirthYear(profile?.dateOfBirth ?? null);
  const tuoi = birthYear ? nowYear - birthYear + 1 : null;
  const namXem = `${getCanChiYearVi(nowYear)} (${nowYear})${typeof tuoi === "number" ? `, ${tuoi} tuổi` : ""}`;

  const solarDob = normalizeDateVi(safeString(profile?.dateOfBirth)) ?? "Không có trong dữ liệu lá số";
  const lunarDob = normalizeDateVi(safeString(profile?.lunarDateOfBirth)) ?? "Không có trong dữ liệu lá số";
  const timeOfBirth = normalizeTime(safeString(profile?.timeOfBirth)) ?? "Không có trong dữ liệu lá số";
  const gender = normalizeGenderVi(safeString(profile?.gender)) ?? "Không có trong dữ liệu lá số";

  const westernZodiac = getWesternZodiacVi(profile?.dateOfBirth ?? null) ?? "Không có trong dữ liệu lá số";

  const getOrMissing = (heading: (typeof EASTERN_UPLOAD_OVERVIEW_HEADINGS)[number]): string => {
    const v = map.get(heading)?.text;
    return v && v.trim() ? v : "Không có trong dữ liệu lá số";
  };

  return EASTERN_UPLOAD_OVERVIEW_HEADINGS.map((heading) => {
    switch (heading) {
      case "Họ và tên":
        return { heading, text: safeString(profile?.fullName) ?? getOrMissing(heading) };
      case "Ngày sinh dương lịch":
        return { heading, text: solarDob };
      case "Ngày sinh âm lịch":
        return { heading, text: lunarDob };
      case "Giờ sinh":
        return { heading, text: timeOfBirth };
      case "Giới tính":
        return { heading, text: gender };
      case "Năm xem":
        return { heading, text: namXem };
      case "Cung hoàng đạo":
        return { heading, text: westernZodiac };
      case "Tuổi":
        return { heading, text: typeof tuoi === "number" ? `${tuoi} tuổi` : getOrMissing(heading) };
      default:
        return { heading, text: getOrMissing(heading) };
    }
  });
}

function normalizeEasternUploadPalaceSections(parsed: Record<string, unknown>) {
  const raw = Array.isArray(parsed.palaceSections) ? (parsed.palaceSections as unknown[]) : [];
  const byKey = new Map<string, { title: string; starAnalyses: unknown[]; summary: unknown[] }>();

  for (const p of raw) {
    if (!p || typeof p !== "object" || Array.isArray(p)) continue;
    const obj = p as Record<string, unknown>;
    const title = safeString(obj.title);
    if (!title) continue;
    const key = stripDiacriticsForMatch(title);
    const starAnalyses = Array.isArray(obj.starAnalyses) ? (obj.starAnalyses as unknown[]) : [];
    const summary = Array.isArray(obj.summary) ? (obj.summary as unknown[]) : [];
    byKey.set(key, { title, starAnalyses, summary });
  }

  const normalizeStarAnalyses = (items: unknown[]) =>
    items
      .map((it) => {
        if (!it || typeof it !== "object" || Array.isArray(it)) return null;
        const o = it as Record<string, unknown>;
        const text = safeString(o.text);
        if (!text) return null;
        return {
          heading: safeString(o.heading) ?? undefined,
          text,
          source: safeString(o.source) ?? undefined,
        };
      })
      .filter(Boolean);

  const normalizeSummary = (items: unknown[]) =>
    items
      .map((it) => {
        if (!it || typeof it !== "object" || Array.isArray(it)) return null;
        const o = it as Record<string, unknown>;
        const text = safeString(o.text);
        if (!text) return null;
        return {
          text,
          source: safeString(o.source) ?? undefined,
          type: safeString(o.type) ?? undefined,
        };
      })
      .filter(Boolean);

  return EASTERN_UPLOAD_PALACE_TITLES.map((canonicalTitle) => {
    const cKey = stripDiacriticsForMatch(canonicalTitle);
    const hit = byKey.get(cKey);
    // fallback: partial match (e.g. model outputs "Cung Mệnh" only)
    const fallback =
      hit ??
      Array.from(byKey.entries()).find(([k]) => k.includes(stripDiacriticsForMatch(canonicalTitle.split("(")[0] ?? canonicalTitle)))?.[1];

    return {
      title: canonicalTitle,
      starAnalyses: normalizeStarAnalyses(fallback?.starAnalyses ?? []),
      summary: normalizeSummary(fallback?.summary ?? []),
    };
  });
}

function normalizeEasternUploadJson(
  profile: ProfileContext | undefined,
  parsed: Record<string, unknown>,
  contextJson: unknown
): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...parsed };
  normalized.overviewItems = normalizeEasternUploadOverviewItems(profile, parsed, contextJson);
  normalized.palaceSections = normalizeEasternUploadPalaceSections(parsed);
  normalized.topics = [...EASTERN_UPLOAD_TOPICS];
  return normalized;
}

function looksNonEnglish(text: string): boolean {
  // quick heuristic: Vietnamese diacritics or the word 'tuổi'
  return /[\u00C0-\u024F\u1E00-\u1EFF]/.test(text) || /tuổi/i.test(text);
}

function sanitizePartnerSketchEnglish<T extends { [k: string]: unknown }>(partnerSketch: T | null): T | null {
  if (!partnerSketch) return null;
  const out = { ...partnerSketch } as Record<string, unknown>;

  const sanitizeString = (v: unknown): string | null => {
    if (typeof v !== "string") return null;
    const s = v.trim();
    if (!s) return null;
    if (looksNonEnglish(s)) {
      // allow a very small fix for ageRange
      if (/\d+\s*-\s*\d+\s*tuổi/i.test(s)) return s.replace(/tuổi/gi, "years old");
      return null;
    }
    return s;
  };

  out.ageRange = sanitizeString(out.ageRange) ?? out.ageRange;
  out.overallVibe = sanitizeString(out.overallVibe) ?? out.overallVibe;
  out.hair = sanitizeString(out.hair) ?? out.hair;
  out.style = sanitizeString(out.style) ?? out.style;
  out.setting = sanitizeString(out.setting) ?? out.setting;
  out.colorPalette = sanitizeString(out.colorPalette) ?? out.colorPalette;
  out.genderPresentation = sanitizeString(out.genderPresentation) ?? out.genderPresentation;

  if (Array.isArray(out.facialFeatures)) {
    const ff = (out.facialFeatures as unknown[])
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean)
      .filter((x) => !looksNonEnglish(x));
    out.facialFeatures = ff.length ? ff : out.facialFeatures;
  }

  return out as T;
}

function buildProfileContext(profile?: ProfileContext, lang: "en" | "vi" = "en"): string {
  if (!profile) return "";
  if (lang === "vi") {
    return `\nHồ sơ người dùng:\n- Họ và tên: ${profile.fullName}\n- Ngày sinh dương lịch: ${profile.dateOfBirth}\n- Ngày sinh âm lịch: ${profile.lunarDateOfBirth ?? "(chưa có)"}\n- Giờ sinh: ${profile.timeOfBirth ?? "(không cung cấp)"}\n- Nơi sinh: ${profile.placeOfBirth ?? "(không cung cấp)"}\n- Giới tính: ${profile.gender ?? "(không cung cấp)"}\n`;
  }

  return `\nUser profile:\n- Full name: ${profile.fullName}\n- Date of birth: ${profile.dateOfBirth}\n- Lunar date of birth: ${profile.lunarDateOfBirth ?? "(not provided)"}\n- Time of birth: ${profile.timeOfBirth ?? "(not provided)"}\n- Place of birth: ${profile.placeOfBirth ?? "(not provided)"}\n- Gender: ${profile.gender ?? "(not provided)"}\n`;
}

interface NumerologyContext {
  lifePathNumber: number;
  strengths: string[];
  challenges: string[];
  careerSuggestions: string[];
  description: string;
}

interface ProfileContext {
  fullName: string;
  dateOfBirth: string;
  lunarDateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
}

interface RequestBody {
  messages: Message[];
  context?: NumerologyContext;
  contextJson?: unknown;
  profile?: ProfileContext;
  audio?: {
    data: string;
    mimeType: string;
  };
  image?: {
    data: string;
    mimeType: string;
  };
  images?: {
    portrait?: { data: string; mimeType: string };
    chart?: { data: string; mimeType: string };
  };
  lang?: "en" | "vi";
  module?:
    | "numerology"
    | "eastern"
    | "speech_to_text"
    | "eastern_image"
    | "eastern_overview"
    | "eastern_career"
    | "eastern_finance"
    | "eastern_marriage"
    | "eastern_health"
    | "eastern_fortune"
    | "eastern_upload"
    | "eastern_saved_chart"
    | "western"
    | "tarot"
    | "iching"
    | "career";
  stream?: boolean;
  responseFormat?: "json" | "text";
}

type InlineImage = { data: string; mimeType: string };

function coerceInlineImage(value: unknown): InlineImage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.data !== "string" || typeof obj.mimeType !== "string") return null;
  return { data: obj.data, mimeType: obj.mimeType };
}

function buildImagenParts(
  userText: string,
  portrait?: InlineImage | null,
  chart?: InlineImage | null
): Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: userText }];

  if (portrait?.data && portrait.mimeType) {
    parts.push({ text: "INPUT: USER PORTRAIT IMAGE (aesthetic reference only, do not copy identity)." });
    parts.push({ inlineData: { mimeType: portrait.mimeType, data: portrait.data } });
  }

  if (chart?.data && chart.mimeType) {
    parts.push({
      text: "INPUT: TU VI CHART IMAGE (focus on extracting spouse/partner-related signals, especially PHU THE palace; no destiny claims).",
    });
    parts.push({ inlineData: { mimeType: chart.mimeType, data: chart.data } });
  }

  return parts;
}

async function generateImagenImages(
  apiKey: string,
  imagenPrompt: string,
  options?: { sampleCount?: number; aspectRatio?: string; personGeneration?: string }
): Promise<Array<{ mimeType: string; data: string }>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`;
  const payload = {
    instances: [{ prompt: imagenPrompt }],
    parameters: {
      sampleCount: options?.sampleCount ?? 1,
      ...(options?.aspectRatio ? { aspectRatio: options.aspectRatio } : {}),
      ...(options?.personGeneration ? { personGeneration: options.personGeneration } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Imagen API error:", res.status, errText);
    throw new Error(`Imagen API error: ${res.status}`);
  }

  const json = (await res.json()) as { predictions?: unknown[] };
  const predictions = Array.isArray(json.predictions) ? json.predictions : [];

  const images: Array<{ mimeType: string; data: string }> = [];
  for (const pred of predictions) {
    if (!pred || typeof pred !== "object" || Array.isArray(pred)) continue;
    const obj = pred as Record<string, unknown>;

    const direct = typeof obj.bytesBase64Encoded === "string" ? obj.bytesBase64Encoded : null;
    const imageBytes = typeof obj.imageBytes === "string" ? obj.imageBytes : null;
    const nestedImage =
      obj.image && typeof obj.image === "object" && !Array.isArray(obj.image)
        ? (obj.image as Record<string, unknown>)
        : null;
    const nested = nestedImage && typeof nestedImage.imageBytes === "string" ? (nestedImage.imageBytes as string) : null;
    const b64 = direct ?? imageBytes ?? nested;
    if (b64) images.push({ mimeType: "image/png", data: b64 });
  }

  return images;
}

function stripJsonFences(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function readGeminiTextParts(parts: unknown) {
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => {
      if (!p || typeof p !== "object" || Array.isArray(p)) return "";
      const obj = p as Record<string, unknown>;
      return typeof obj.text === "string" ? obj.text : "";
    })
    .join("");
}

type JsonSchema = {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "BOOLEAN";
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
};

function getEasternResultSchema(): JsonSchema {
  return {
    type: "OBJECT",
    required: ["overview"],
    properties: {
      overview: { type: "STRING" },
      topics: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["id", "label", "target"],
          properties: {
            id: { type: "STRING" },
            label: { type: "STRING" },
            target: { type: "STRING" },
          },
        },
      },
      overviewItems: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["text"],
          properties: {
            heading: { type: "STRING" },
            text: { type: "STRING" },
            source: { type: "STRING" },
          },
        },
      },
      sections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["title", "content"],
          properties: {
            title: { type: "STRING" },
            content: { type: "STRING" },
            source: { type: "STRING" },
          },
        },
      },
      palaceSections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["title", "items"],
          properties: {
            title: { type: "STRING" },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                required: ["text"],
                properties: {
                  text: { type: "STRING" },
                  source: { type: "STRING" },
                },
              },
            },
          },
        },
      },
      overviewQuotes: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
      detailSections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["title", "content"],
          properties: {
            title: { type: "STRING" },
            content: { type: "STRING" },
            source: { type: "STRING" },
          },
        },
      },
      daiVan: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
      tieuVan: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
  };
}

function getEasternUploadSchema(): JsonSchema {
  return {
    type: "OBJECT",
    required: ["overview", "topics", "overviewItems", "palaceSections", "daiVan", "tieuVan"],
    properties: {
      overview: { type: "STRING" },
      topics: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["id", "label", "target"],
          properties: {
            id: { type: "STRING" },
            label: { type: "STRING" },
            target: { type: "STRING" },
          },
        },
      },
      overviewItems: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["text"],
          properties: {
            heading: { type: "STRING" },
            text: { type: "STRING" },
            source: { type: "STRING" },
            type: { type: "STRING" },
          },
        },
      },
      palaceSections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["title", "starAnalyses", "summary"],
          properties: {
            title: { type: "STRING" },
            starAnalyses: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                required: ["text"],
                properties: {
                  heading: { type: "STRING" },
                  text: { type: "STRING" },
                  source: { type: "STRING" },
                },
              },
            },
            summary: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                required: ["text"],
                properties: {
                  text: { type: "STRING" },
                  source: { type: "STRING" },
                  type: { type: "STRING" },
                },
              },
            },
          },
        },
      },
      daiVan: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
      tieuVan: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
  };
}

function getSystemPrompt(
  lang: "en" | "vi",
  moduleKey: ModuleKey,
  responseFormat?: "json" | "text"
) {
  const formatLine =
    responseFormat === "json"
      ? lang === "vi"
        ? "\n\nTrả về JSON hợp lệ và không thêm văn bản ngoài JSON."
        : "\n\nReturn valid JSON only and do not add any text outside JSON."
      : "";

  const modulePrompt = MODULE_PROMPTS[moduleKey];
  const promptText = modulePrompt?.[lang] ?? modulePrompt?.en;

  const safePromptText =
    promptText ?? MODULE_PROMPTS.numerology?.[lang] ?? MODULE_PROMPTS.numerology?.en ?? "";

  // For strict-JSON modules, we must not force the base disclaimer instruction,
  // because the API already returns disclaimer separately and the JSON must be clean.
  if (moduleKey === "eastern_upload" || moduleKey === "eastern_image") {
    return `${safePromptText}${formatLine}`;
  }

  return `${BASE_PROMPTS[lang]}\n\n${safePromptText}${formatLine}`;
}

function isModuleKey(value: unknown): value is ModuleKey {
  return typeof value === "string" && value in MODULE_PROMPTS;
}

function resolveModuleKey(moduleKey: ModuleKey, contextJson?: unknown): ModuleKey {
  if (!moduleKey.startsWith("eastern")) return moduleKey;

  if (
    moduleKey === "eastern_image" ||
    moduleKey === "eastern_overview" ||
    moduleKey === "eastern_career" ||
    moduleKey === "eastern_finance" ||
    moduleKey === "eastern_marriage" ||
    moduleKey === "eastern_health" ||
    moduleKey === "eastern_fortune" ||
    moduleKey === "eastern_upload"
  ) {
    return moduleKey;
  }

  const optionId =
    contextJson && typeof contextJson === "object" && !Array.isArray(contextJson) && typeof (contextJson as Record<string, unknown>).optionId === "string"
      ? ((contextJson as Record<string, unknown>).optionId as string)
      : null;

  switch (optionId) {
    case "career":
      return "eastern_career";
    case "finance":
      return "eastern_finance";
    case "marriage":
      return "eastern_marriage";
    case "health":
      return "eastern_health";
    case "fortune":
      return "eastern_fortune";
    case "overview":
      return "eastern_overview";
    default:
      return "eastern";
  }
}

function buildUserContext(context?: NumerologyContext, lang: "en" | "vi" = "en"): string {
  if (!context) return "";

  if (lang === "vi") {
    return `
Thông tin người dùng:
- Số Chủ Đạo: ${context.lifePathNumber}
- Điểm mạnh: ${context.strengths.join(", ")}
- Thách thức: ${context.challenges.join(", ")}
- Gợi ý nghề nghiệp: ${context.careerSuggestions.join(", ")}
- Mô tả: ${context.description}
`;
  }

  return `
User Information:
- Life Path Number: ${context.lifePathNumber}
- Strengths: ${context.strengths.join(", ")}
- Challenges: ${context.challenges.join(", ")}
- Career Suggestions: ${context.careerSuggestions.join(", ")}
- Description: ${context.description}
`;
}

function buildGenericContext(contextJson: unknown, lang: "en" | "vi" = "en"): string {
  if (!contextJson) return "";
  try {
    const raw = JSON.stringify(contextJson);
    const maxLen = 60000;
    const truncated = raw.length > maxLen ? `${raw.slice(0, maxLen)}…(truncated)` : raw;
    if (lang === "vi") {
      return `\nNgữ cảnh bổ sung (JSON):\n${truncated}\n`;
    }
    return `\nAdditional Context (JSON):\n${truncated}\n`;
  } catch (_err) {
    return "";
  }
}

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is not set");
    return new Response(JSON.stringify({ error: "Service configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      messages,
      context,
      contextJson,
      profile,
      audio,
      image,
      images,
      lang = "en",
      module = "numerology",
      stream = false,
      responseFormat = "text",
    } = (await req.json()) as RequestBody;

    const token = getBearerToken(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const authedUser = authData?.user ?? null;
    if (authError || !authedUser) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (module === "speech_to_text") {
      const resolvedModule = "speech_to_text";
      const cost = moduleCost(resolvedModule);

      // Use the same RPC function as frontend for consistent balance checking
      const { data: balanceData, error: balanceErr } = await supabaseAdmin.rpc("get_wallet_balance_for_user", {
        p_user_id: authedUser.id
      });
      
      if (balanceErr) {
        console.error("Speech-to-text balance RPC error:", balanceErr);
      }

      const balanceRaw = balanceData ?? 0;
      const balance = Number(balanceRaw);
      const costInt = Math.max(0, Math.trunc(Number(cost)));
      
      console.log(`Speech-to-text credit check for user ${authedUser.id}: balance=${balance}, cost=${costInt}, balanceData=${balanceRaw}`);
      
      if (!Number.isFinite(balance) || balance < costInt) {
        console.log(`Speech-to-text insufficient credits: balance=${balance} < cost=${costInt}`);
        return new Response(JSON.stringify({ error: "INSUFFICIENT_CREDITS", required: costInt, balance }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseUser = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const { error: spendErr } = await supabaseUser.rpc("spend_credits", {
        p_user_id: authedUser.id,
        p_cost: costInt,
        p_reason: resolvedModule,
        p_ref_type: "oracle_chat",
        p_ref_id: null,
      });
      if (spendErr) {
        const msg = typeof (spendErr as { message?: unknown } | null)?.message === "string"
          ? (spendErr as { message: string }).message
          : String(spendErr);
        console.error("Spend credits error:", spendErr);

        if (msg.includes("insufficient_credits")) {
          return new Response(JSON.stringify({ error: "INSUFFICIENT_CREDITS", required: costInt, balance }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "SPEND_CREDITS_FAILED", required: costInt, balance }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!audio?.data || !audio?.mimeType) {
        return new Response(JSON.stringify({ error: "Missing audio" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const systemPrompt =
        lang === "vi"
          ? "Bạn là máy chuyển giọng nói thành văn bản. Nhiệm vụ: chép lại chính xác nội dung người dùng nói. Quy tắc: chỉ trả về phần văn bản, không thêm giải thích. Nếu người dùng nói tiếng Việt thì trả tiếng Việt."
          : "You are a speech-to-text transcriber. Task: accurately transcribe the user's speech. Rules: output only the transcript text, no extra commentary.";

      const parts = [
        { text: lang === "vi" ? "Hãy chép lại nội dung audio." : "Transcribe this audio." },
        { inlineData: { mimeType: audio.mimeType, data: audio.data } },
      ];

      const text = (await callGeminiText(GEMINI_API_KEY, systemPrompt, parts)).trim();
      return new Response(JSON.stringify({ text, creditsSpent: cost }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedModule = isModuleKey(module) ? module : "numerology";
    if (!isModuleKey(module)) {
      console.warn("Unknown module key received; falling back to numerology:", module);
    }

    const resolvedModule = resolveModuleKey(normalizedModule, contextJson);

    const cost = moduleCost(resolvedModule);
    
    // Use the same RPC function as frontend for consistent balance checking
    const { data: balanceData, error: balanceErr } = await supabaseAdmin.rpc("get_wallet_balance_for_user", {
      p_user_id: authedUser.id
    });
    
    if (balanceErr) {
      console.error("Balance RPC error:", balanceErr);
    }
    
    const balanceRaw = balanceData ?? 0;
    const balance = Number(balanceRaw);
    const costInt = Math.max(0, Math.trunc(Number(cost)));
    
    console.log(`Credit check for user ${authedUser.id}: balance=${balance}, cost=${costInt}, module=${resolvedModule}, balanceData=${balanceRaw}`);
    
    if (!Number.isFinite(balance) || balance < costInt) {
      console.log(`Insufficient credits: balance=${balance} < cost=${costInt}`);
      if (resolvedModule === "eastern_image") {
        return new Response(JSON.stringify({ error: "PAYWALL_IMAGE", required: costInt, balance }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (stream) {
        const msg = lang === "vi"
          ? "Bạn đã dùng hết credit. Nạp tiền để xem phân tích chi tiết và tiếp tục sử dụng."
          : "You are out of credits. Top up to get detailed answers and continue.";
        return buildSseResponse(corsHeaders, msg);
      }

      return new Response(JSON.stringify({ error: "INSUFFICIENT_CREDITS", required: costInt, balance }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { error: spendErr } = await supabaseUser.rpc("spend_credits", {
      p_user_id: authedUser.id,
      p_cost: costInt,
      p_reason: resolvedModule,
      p_ref_type: "oracle_chat",
      p_ref_id: null,
    });
    if (spendErr) {
      const msg = typeof (spendErr as { message?: unknown } | null)?.message === "string"
        ? (spendErr as { message: string }).message
        : String(spendErr);
      console.error("Spend credits error:", spendErr);

      if (msg.includes("insufficient_credits")) {
        return new Response(JSON.stringify({ error: "INSUFFICIENT_CREDITS", required: costInt, balance }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "SPEND_CREDITS_FAILED", required: costInt, balance }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resolvedModule === "eastern_image") {
      const ctxObj =
        contextJson && typeof contextJson === "object" && !Array.isArray(contextJson)
          ? (contextJson as Record<string, unknown>)
          : null;
      const ziweiChartJson = ctxObj ? ctxObj.ziweiChartJson : null;
      if (!ziweiChartJson) {
        return new Response(JSON.stringify({ error: "Missing ziweiChartJson" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const inputMode = "CHART_JSON_ONLY";

      const analysisSystemPrompt =
        lang === "vi"
          ? `Bạn là chuyên gia phân tích DỮ LIỆU LÁ SỐ TỬ VI DẠNG JSON để trích xuất thuộc tính có cấu trúc phục vụ dựng chân dung minh hoạ NGƯỜI HÔN PHỐI (không định mệnh).

NHIỆM VỤ:
- Đọc ziweiChartJson (dữ liệu lá số do hệ thống sinh) và trích xuất tín hiệu liên quan CUNG PHU THÊ + các yếu tố phụ trợ (tam hợp, xung chiếu, giáp cung nếu có trong JSON).

QUY TẮC:
- Output CHỈ JSON, không kèm chữ ngoài JSON.
- Không suy đoán danh tính. Không tạo PII (tên, địa chỉ, số điện thoại).
- Nếu dữ kiện không có trong ziweiChartJson: vẫn phải trả về JSON đầy đủ, dùng null/[] và ghi notes.
- Không kết luận định mệnh; chỉ rút ra gợi ý trung tính về khí chất/vibe/gu thẩm mỹ.
- BẮT BUỘC trả thêm confidence (0-1) cho các phần quan trọng.

DỮ LIỆU ĐẦU VÀO:
- Bạn sẽ nhận ziweiChartJson trong phần user text/context. Hãy coi đó là nguồn dữ kiện lá số (authoritative).

JSON schema (GIỮ NGUYÊN): { "hasPortrait": boolean, "hasChart": boolean, "portraitInsights": { "genderPresentation": string|null, "ageRange": string|null, "overallVibe": string|null, "hair": string|null, "style": string|null, "colorPalette": string|null }|null, "chartInsights": { "chartType": "tu_vi"|"unknown", "phuThe": { "found": boolean, "confidence": number, "palaceLabel": string|null, "palaceLabelConfidence": number, "mainStars": string[], "mainStarsConfidence": number, "auxStars": string[], "auxStarsConfidence": number, "notes": string|null }, "relatedPalaces": { "tamHop": string[], "xungChieu": string[], "giapCung": string[] }, "spouseTraitHints": { "vibeKeywords": string[], "appearanceKeywords": string[], "styleKeywords": string[], "personalityKeywords": string[], "nationalityHint": string|null }, "ocrSnippets": string[], "notes": string|null }|null }`
          : `You analyze STRUCTURED TU VI CHART JSON to extract spouse-related signals for generating a symbolic partner portrait (non-fatalistic).

TASK:
- Read ziweiChartJson (system-generated structured chart data) and extract spouse/PHU THE palace signals plus related palaces (tam hop, xung chieu, giap cung) if present in the JSON.

RULES:
- Output STRICT JSON only.
- Never infer identity. Never invent PII (name, address, phone).
- If a fact is not present in ziweiChartJson, still return the full JSON using null/[] and add notes.
- Do NOT make destiny claims; only neutral trait/vibe/style hints.
- MUST output confidence scores (0-1) for key extracted fields.

INPUT:
- ziweiChartJson will be provided in user text/context. Treat it as authoritative chart facts.

JSON schema (KEEP EXACTLY): { "hasPortrait": boolean, "hasChart": boolean, "portraitInsights": { "genderPresentation": string|null, "ageRange": string|null, "overallVibe": string|null, "hair": string|null, "style": string|null, "colorPalette": string|null }|null, "chartInsights": { "chartType": "tu_vi"|"unknown", "phuThe": { "found": boolean, "confidence": number, "palaceLabel": string|null, "palaceLabelConfidence": number, "mainStars": string[], "mainStarsConfidence": number, "auxStars": string[], "auxStarsConfidence": number, "notes": string|null }, "relatedPalaces": { "tamHop": string[], "xungChieu": string[], "giapCung": string[] }, "spouseTraitHints": { "vibeKeywords": string[], "appearanceKeywords": string[], "styleKeywords": string[], "personalityKeywords": string[], "nationalityHint": string|null }, "ocrSnippets": string[], "notes": string|null }|null }`;

      const sketchSystemPrompt =
        lang === "vi"
          ? `Bạn là chuyên gia luận giải phong cách và art director. Nhiệm vụ: dựa trên TOÀN BỘ thông tin người dùng (hồ sơ + ngữ cảnh) và kết quả phân tích ảnh (nếu có) để phác hoạ chân dung người hôn phối/đối tác theo hướng thực tế, không định mệnh.

QUY TẮC:
- Output CHỈ JSON.
- MỌI đặc điểm (tuổi, quốc gia, phong cách, nét mặt) PHẢI được suy ra từ hồ sơ người dùng (tên, ngày/giờ/nơi sinh) và suy luận thời điểm kết hôn hợp lý. KHÔNG TỰ TẠO.
- Quốc gia/khu vực PHẢI được suy từ ngữ cảnh lá số và dữ liệu người dùng: nếu người dùng ở nước ngoài hoặc lá số chỉ bối cảnh quốc tế, hãy phản ánh điều đó. KHÔNG mặc định Việt Nam/Đông Nam Á nếu không có bằng chứng.
- KHÔNG ĐƯA TRANG SỨC, phụ kiện, hoặc đồ trang trí vào partnerSketch.
- KHÔNG hardcode quốc gia/phong cách; mọi gợi ý phải đến từ input.
- Không đưa PII (tên, ngày sinh đầy đủ, địa chỉ cụ thể) vào output.

COMPATIBILITY SCORE (BẮT BUỘC):
- Trả thêm "compatibilityScore" (0-100): phải suy ra từ tín hiệu lá số (Cung Phu Thê + tam hợp/xung chiếu/giáp cung + sao liên quan nếu có) và mức độ phù hợp tổng thể với hồ sơ người dùng. KHÔNG chấm điểm cảm tính.
- Trả thêm "compatibilityRationaleVi": 1-3 câu giải thích ngắn gọn, nêu rõ dựa trên cung/sao nào.

HƯỚNG PHÁC HOẠ (BẮT BUỘC):
- Trả thêm "spousePortraitDirectionVi": 3-6 câu mô tả hướng phát hoạ dựa trên lá số. BẮT BUỘC phải nêu rõ Cung Phu Thê có sao nào (chính tinh/tạp tinh) và các cung liên quan (tam hợp, xung chiếu, giáp cung) đã định hình nên đặc điểm nào. Ví dụ: "Cung Phu Thê có Thiên Cơ và Thái Âm, tam hợp với Cung Phúc Đức có Thái Dương...".
- TUYỆT ĐỐI KHÔNG ghi % hoặc câu kiểu "Mức độ chắc chắn là 75%" trong field này.
- Độ chắc chắn chỉ được thể hiện bằng field "confidence" (number 0-1) theo schema, KHÔNG được đưa vào text.

CHUYỂN ĐỔI ÂM LỊCH:
- Nếu người dùng cung cấp ngày sinh âm lịch, chuyển sang dương lịch để tính tuổi.
- Chuyển giờ sinh sang Giờ Âm Lịch: Tý (23-1), Sửu (1-3), Dần (3-5), Mão (5-7), Thìn (7-9), Tỵ (9-11), Ngọ (11-13), Mùi (13-15), Thân (15-17), Dậu (17-19), Tuất (19-21), Hợi (21-23).
- Dùng CAN (Thiên Can) và CHI (Địa Chi) của năm sinh để suy luận tính cách.

CHÍNH XÁC TUỔI TÁC (CỰC KỲ QUAN TRỌNG):
- Nếu khoảng tuổi 24-28, người phải trông rõ 24-28, KHÔNG già hơn.
- Dùng ĐẶC ĐIỂM TRẺ: da mịn không nếp nhăn sâu, mắt sáng trong, đầy đặn tự nhiên, biểu cảm rạng rỡ.
- TRÁNH: nếp nhăn sâu, đổ bóng đậm làm già mặt, biểu tác mệt mỏi, cấu trúc mặt trưởng thành.
- Style bút chì graphite KHÔNG được làm cho nhân vật trông già hơn hoặc cổ xưa.
- Đặc biệt với đàn ông: tránh râu quai nón, ria mép, đường nét hằn sâu, trán cao hói, má hóp, quầng thâm mắt.
- Đặc biệt với phụ nữ: tránh má hóp, xương gò má cao lộ, nếp nhăn khóe mắt, khóe miệng, da khô, lông mày nhạt.

QUAN TRỌNG: Nhân vật là NGƯỜI TRƯỞNG THÀNH (phụ nữ/đàn ông), không dùng từ "con gái"/"trẻ con" và tránh mọi mô tả làm nhân vật trông già.

TRANG PHỤC: Đồ thường ngày gần gũi như áo thun, áo form rộng, đồ ở nhà thoải mái để tạo vẻ thân thiện, gần gũi.

LUẬN SUY CHI TIẾT:
- Dùng năm sinh người dùng + độ tuổi kết hôn điển hình để ước lượng tuổi người hôn phối tại thời điểm kết hôn có khả năng.
- Suy luận thời điểm kết hôn từ tín hiệu lá số (cung Phu Thê, chu kỳ thuận lợi, transit).
- Dùng tên, ngày sinh và văn hóa để suy luận quốc gia/khu vực dựa trên ngữ cảnh lá số và dữ liệu thực tế.
- Dùng kết quả luận eastern trước đó để suy ra tính cách, thẩm mỹ, nghề nghiệp → ảnh hưởng ngoại hình và phong cách.
- Nếu có tín hiệu hôn nhân từ lá số, chuyển thành đặc điểm ngoại hình/khí chất trung lập.

JSON schema: {
  "partnerSketch": {
    "genderPresentation": string|null,
    "ageRange": string|null,
    "style": string|null,
    "overallVibe": string|null,
    "facialFeatures": string[],
    "hair": string|null,
    "accessories": string[],
    "setting": string|null,
    "colorPalette": string|null
  },
  "compatibilityScore": number,
  "compatibilityRationaleVi": string,
  "spousePortraitDirectionVi": string,
  "confidence": number
}`
          : `You are a style reasoning expert and art director. Task: use the full user info (profile + context) and any image analysis results to derive a grounded partner-portrait sketch (non-fatalistic).

RULES:
- Output STRICT JSON only.
- EVERY feature (age, nationality, style, facial details) MUST be derived from user profile (name, DOB, time/place) and logical marriage timing inference. DO NOT invent attributes.
- Nationality/region MUST be inferred from chart context and user data: if the user lives abroad or chart indicates international context, reflect that. Do NOT default to Vietnamese/Southeast Asian without evidence.
- ABSOLUTELY NO jewelry, accessories, or decorative items in partnerSketch.
- Do not hardcode locale/style; derive from input.
- Do not include PII (name, full DOB, exact address).

COMPATIBILITY SCORE (REQUIRED):
- Must return compatibilityScore (0-100) computed from chart-based relationship signals (PHU THE palace + related palaces like tam hop / xung chieu / giap cung + relevant stars if present) and overall fit with the user's profile. Do NOT assign a gut-feel score.
- Must return a short compatibility rationale (1-3 sentences) referencing which chart signals it is based on.

PORTRAIT DIRECTION (REQUIRED):
- Must return spousePortraitDirection: 3-6 sentences describing the portrait direction grounded in chart signals.
- MUST explicitly reference which stars are in PHU THE palace (major/minor stars) and which related palaces (tam hop, xung chieu, giap cung) shape which traits. Example: "PHU THE palace contains Thien Co and Thai Am, tam hop with PHUC DUC palace containing Thai Duong...".
- Do NOT append any explicit confidence percent (e.g., "Confidence: 75%") in this field.
- Confidence must be expressed ONLY via the numeric field "confidence" (0-1) in the JSON schema, not inside free-text.

- ALL free-text strings in the output MUST be ENGLISH. ageRange MUST be like "24-28 years old" (not "tuổi").

LUNAR CALENDAR CONVERSION:
- If user provides lunar birth date, convert to solar date for age calculation.
- Convert birth time to lunar hour: Ty (23-1), Suu (1-3), Dan (3-5), Mao (5-7), Thin (7-9), Ty (9-11), Ngo (11-13), Mui (13-15), Than (15-17), Dau (17-19), Tuat (19-21), Hoi (21-23).
- Use CAN (Heavenly Stem) and CHI (Earthly Branch) of birth year for personality traits.

AGE ACCURACY (CRITICAL):
- If age range is 24-28, the person must look clearly 24-28, NOT older.
- Use YOUTHFUL features: smooth skin without heavy lines, bright clear eyes, natural facial fullness, vibrant expression.
- AVOID: deep wrinkles, heavy shading that ages the face, tired expressions, mature facial structures, hollow cheeks, under-eye bags.
- Avoid any vintage/old-photo look.
- The graphite style should NOT make the subject appear older or antique.
- For men: AVOID beard, stubble, deep facial lines, high forehead/balding, hollow cheeks, dark eye circles.
- For women: AVOID hollow cheeks, prominent cheekbones, crow's feet, smile lines, dry skin, sparse eyebrows.

IMPORTANT: Use "woman" instead of "young woman" for age-appropriate language. Do not use "girl".

WARDROBE: Casual everyday clothing like t-shirts, oversized shirts, comfortable home wear for a friendly, approachable look.

INFERENCE LOGIC:
- Use user's birth year + typical marriage age patterns to estimate spouse's age range at likely marriage time.
- Infer marriage timing from chart signals (spouse palace, favorable periods, transits).
- Use user's name, birth data, and cultural context to infer likely nationality/region based on chart context and actual data.
- Extract personality, aesthetic, and vocational cues from prior eastern analysis results to shape spouse's appearance and style.
- If chart provides spouse-related signals, translate them into neutral physical/vibe traits (not destiny).

JSON schema: { partnerSketch: { genderPresentation: string|null, ageRange: string|null, style: string|null, overallVibe: string|null, facialFeatures: string[], hair: string|null, accessories: string[] /* MUST be empty array - NO jewelry */, setting: string|null, colorPalette: string|null }, compatibilityScore: number, compatibilityRationale: string, spousePortraitDirection: string, confidence: number }`;

      const profileForReasoning = `${buildProfileContext(profile, lang)}${buildImageAnalysisProfileContext(profile, lang)}`;
      const genericContext = buildGenericContext(contextJson, lang);

      const analysisParts = buildImagenParts(
        `${genericContext}${profileForReasoning}`.trim() ||
          (lang === "vi"
            ? "Hãy phân tích dữ liệu lá số (JSON) theo schema JSON." 
            : "Analyze the chart JSON per the JSON schema."),
        null,
        null
      );

      const imageAnalysis = await callGeminiJson(GEMINI_API_KEY, analysisSystemPrompt, analysisParts);

      const sketchInput =
        lang === "vi"
          ? `INPUT MODE: ${inputMode}\n\nNgữ cảnh đầy đủ (dùng để suy luận, không đưa PII vào prompt Imagen):\n${genericContext}${profileForReasoning}\n\nDỮ LIỆU LÁ SỐ (ZIWEI JSON):\n${JSON.stringify(ziweiChartJson)}\n\nPHÂN TÍCH (JSON):\n${JSON.stringify(imageAnalysis)}\n\nYêu cầu: tạo partnerSketch + compatibilityScore theo schema. Giữ phong cách bút chì graphite trên nền giấy có vân; ánh sáng mềm; nhân vật hiện đại (không cổ trang). Mọi đặc điểm phải có căn cứ từ hồ sơ + dữ liệu lá số.`
          : `INPUT MODE: ${inputMode}\n\nFull context (for reasoning; do not put PII into Imagen prompt):\n${genericContext}${profileForReasoning}\n\nCHART DATA (ZIWEI JSON):\n${JSON.stringify(ziweiChartJson)}\n\nANALYSIS (JSON):\n${JSON.stringify(imageAnalysis)}\n\nRequirement: create partnerSketch + compatibilityScore per schema. Keep graphite pencil portrait style on paper grain background; soft lighting; modern subject (no historical costume). Every attribute must be grounded in the provided profile + chart JSON.`;

      const sketchJson = await callGeminiJson(GEMINI_API_KEY, sketchSystemPrompt, [{ text: sketchInput }]);
      const sketchObj = sketchJson as {
        partnerSketch?: unknown;
        compatibilityScore?: unknown;
        compatibilityRationaleVi?: unknown;
        compatibilityRationale?: unknown;
        spousePortraitDirectionVi?: unknown;
        spousePortraitDirection?: unknown;
      };

      const compatibilityScoreRaw = typeof sketchObj.compatibilityScore === "number" ? sketchObj.compatibilityScore : null;
      const compatibilityScore =
        typeof compatibilityScoreRaw === "number"
          ? Math.max(0, Math.min(100, Math.round(compatibilityScoreRaw)))
          : null;

      const compatibilityRationale =
        lang === "vi"
          ? typeof sketchObj.compatibilityRationaleVi === "string"
            ? sketchObj.compatibilityRationaleVi
            : null
          : typeof sketchObj.compatibilityRationale === "string"
            ? sketchObj.compatibilityRationale
            : null;

      const spousePortraitDirection =
        lang === "vi"
          ? typeof sketchObj.spousePortraitDirectionVi === "string"
            ? sketchObj.spousePortraitDirectionVi
            : null
          : typeof sketchObj.spousePortraitDirection === "string"
            ? sketchObj.spousePortraitDirection
            : null;

      const partnerSketch = coercePartnerSketch(sketchObj.partnerSketch);
      const partnerSketchForPrompt = lang === "en" ? sanitizePartnerSketchEnglish(partnerSketch) : partnerSketch;
      const partnerSketchText = sketchObj.partnerSketch ? JSON.stringify(sketchObj.partnerSketch) : "{}";

      const imagenProfileContext = buildImagenProfileContext(profile, lang);
      const preface = `${genericContext}${imagenProfileContext}`.trim();

      const fixedStyleLineEn =
        "STYLE: hand-drawn graphite pencil portrait, clean modern linework, visible pencil strokes, subtle graphite shading, monochrome graphite with a very faint sepia hint, on clean ivory sketchbook paper texture with visible grain, soft studio lighting.";
      const fixedStyleLineVi =
        "PHONG CÁCH (CỐ ĐỊNH): chân dung bút chì graphite vẽ tay, nét sạch hiện đại, thấy rõ nét bút chì, đổ bóng graphite nhẹ, đơn sắc graphite pha sepia cực nhẹ, nền giấy ngà sạch có vân như trang sổ phác thảo, ánh sáng studio mềm.";

      const locale = inferLocaleFromPlace(profile?.placeOfBirth);
      const geographyEn = locale ? `Geographic context: ${locale}.` : "Geographic context: Vietnam.";
      const geographyVi = locale ? `Bối cảnh địa lý: ${locale}.` : "Bối cảnh địa lý: Việt Nam.";

      const fullNameRaw = String(profile?.fullName ?? "");
      const placeRaw = String(profile?.placeOfBirth ?? "");
      const localeRaw = String(locale ?? "");
      const isLikelyVietnamese =
        /việt\s*nam|vietnam/i.test(placeRaw + " " + localeRaw) ||
        /thành\s*phố|tỉnh|huyện|xã|quận|phường|thị\s*trấn|tp\.?\s*/i.test(placeRaw) ||
        /[\u00C0-\u024F\u1E00-\u1EFF]/.test(fullNameRaw);

      const userGenderRaw = String(profile?.gender ?? "").toLowerCase();
      const genderTokens = userGenderRaw
        .replace(/[^a-z\u00C0-\u024F\u1E00-\u1EFF]+/gi, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const hasToken = (value: string) => genderTokens.includes(value);

      // Note: do NOT use substring checks like includes("male") because "female" contains "male".
      const isMaleUser = hasToken("nam") || hasToken("male") || hasToken("man");
      const isFemaleUser = hasToken("nữ") || hasToken("nu") || hasToken("female") || hasToken("woman");

      const spouseGenderEn = isMaleUser ? "woman" : isFemaleUser ? "man" : "adult";
      const spouseGenderVi = spouseGenderEn === "woman" ? "phụ nữ" : spouseGenderEn === "man" ? "đàn ông" : "người trưởng thành";

      const genderEnforcementEn =
        spouseGenderEn === "adult"
          ? "SUBJECT GENDER: adult."
          : `SUBJECT GENDER: MUST be a ${spouseGenderEn === "woman" ? "girl" : spouseGenderEn === "man" ? "boy" : "adult"}. Do NOT generate the opposite gender. CRITICAL: if user is female, generate a MALE subject; if user is male, generate a FEMALE subject.`;
      const genderEnforcementVi =
        spouseGenderEn === "adult"
          ? "GIỚI TÍNH NHÂN VẬT: người trưởng thành."
          : `GIỚI TÍNH NHÂN VẬT: BẮT BUỘC là ${spouseGenderVi}. TUYỆT ĐỐI KHÔNG tạo giới tính ngược lại. QUAN TRỌNG: nếu người dùng là nữ, phải tạo ĐỐNG TÁC nam; nếu người dùng là nam, phải tạo ĐỐNG TÁC nữ.`;

      const partnerDetailsEn = partnerSketchForPrompt
        ? `Partner sketch constraints (must match): ageRange=${partnerSketchForPrompt.ageRange ?? "(unknown)"}; vibe=${partnerSketchForPrompt.overallVibe ?? "(unknown)"}; style=${partnerSketchForPrompt.style ?? "(unknown)"}; hair=${partnerSketchForPrompt.hair ?? "(unknown)"}; facialFeatures=${(partnerSketchForPrompt.facialFeatures ?? []).join(", ")}.`
        : "Partner sketch constraints (must match): (not provided).";
      const partnerDetailsVi = partnerSketch
        ? `Ràng buộc từ partnerSketch (phải khớp): ageRange=${partnerSketch.ageRange ?? "(không có)"}; vibe=${partnerSketch.overallVibe ?? "(không có)"}; style=${partnerSketch.style ?? "(không có)"}; hair=${partnerSketch.hair ?? "(không có)"}; facialFeatures=${(partnerSketch.facialFeatures ?? []).join(", ")}.`
        : "Ràng buộc từ partnerSketch (phải khớp): (không có).";

      const ageEnforcementEn =
        "AGE ENFORCEMENT (CRITICAL): the face must look clearly within the stated age range (do NOT look older). Youthful markers only: smooth unlined skin, no crow's-feet, no deep nasolabial folds, no forehead lines, no marionette lines, no under-eye bags, no hollow cheeks, no sharp mature jawline, bright clear eyes, soft youthful facial fullness, relaxed youthful neck. Lighting must be soft and flattering. Avoid any vintage/old-photo look. Make the subject look fresh, energetic, and clearly young. For men: NO beard/stubble, no deep facial lines, no balding/high forehead, no hollow cheeks, no dark eye circles. For women: NO hollow cheeks, NO prominent cheekbones, NO crow's feet, NO smile lines, NO dry skin, NO sparse eyebrows.";
      const ageEnforcementVi =
        "ÉP TUỔI (BẮT BUỘC): gương mặt phải trông rõ đúng khoảng tuổi; chỉ dùng dấu hiệu trẻ (da mịn không nếp nhăn, không vết chân chim, không rãnh mũi-má sâu, mắt sáng trong, cổ/hàm trẻ); tránh mọi dấu hiệu già. Đặc biệt đàn ông: KHÔNG râu quai nón, KHÔNG ria mép, KHÔNG đường nét hằn sâu, KHÔNG trán cao/hói, KHÔNG má hóp, KHÔNG quầng thâm mắt. Đặc biệt phụ nữ: KHÔNG má hóp, KHÔNG xương gò má cao lộ, KHÔNG nếp nhăn khóe mắt/khoe miệng, KHÔNG da khô, KHÔNG lông mày nhạt.";

      const forcedSubjectEnBase = spouseGenderEn === "woman" ? "a girl" : spouseGenderEn === "man" ? "a boy" : "an adult";
      const forcedSubjectEn =
        isLikelyVietnamese && forcedSubjectEnBase !== "an adult" ? forcedSubjectEnBase.replace("a ", "a Vietnamese ") : forcedSubjectEnBase;
      const forcedSubjectVi = spouseGenderEn === "woman" ? "cô gái" : spouseGenderEn === "man" ? "cậu bé" : "người trưởng thành";

      const baseSubjectEn =
        `A graphite pencil portrait of ${forcedSubjectEn}, ${partnerSketchForPrompt?.ageRange ?? partnerSketch?.ageRange ?? "(age unknown)"}, ` +
        `with ${partnerSketchForPrompt?.overallVibe ?? partnerSketch?.overallVibe ?? "a calm and approachable vibe"}. ` +
        `Hair: ${partnerSketchForPrompt?.hair ?? partnerSketch?.hair ?? "(unspecified)"}. ` +
        `Style: ${partnerSketchForPrompt?.style ?? partnerSketch?.style ?? "casual everyday clothing like a t-shirt or oversized shirt"}. ` +
        `Facial features: ${(partnerSketchForPrompt?.facialFeatures ?? partnerSketch?.facialFeatures ?? []).join(", ") || "(unspecified)"}.`;

      const hardNegativesEn =
        "No jewelry, no watches, no accessories, no decorative items. No hanfu/kimono/ancient costume, no fantasy armor, no royal palace, no ancient setting, no traditional ceremonial outfit. No sexual content, no minors. No tired or mature expressions. No heavy shading that makes the subject look older. Avoid harsh contrast, avoid dramatic chiaroscuro, avoid film-grain, avoid sepia/vintage portrait styling. Avoid deep cheek shadows, avoid prominent nasolabial folds, avoid gaunt face, avoid adult-middle-aged look. NO beard/stubble/shadow, NO deep facial lines, NO balding/high forehead, NO hollow cheeks, NO dark eye circles, NO prominent cheekbones, NO crow's feet, NO smile lines.";

      const imagenPromptRaw = `${baseSubjectEn}\n${hardNegativesEn}`;
      const imagenPromptVi = `${fixedStyleLineVi} ${geographyVi} ${genderEnforcementVi} ${ageEnforcementVi}\n${partnerDetailsVi}\nChân dung bút chì graphite của ${forcedSubjectVi}, ${partnerSketch?.ageRange ?? "(không rõ tuổi)"}. Tuyệt đối không trang sức/phụ kiện. Giữ nét trẻ trung đúng độ tuổi. QUAN TRỌNG: Nếu người dùng là nữ, phải vẽ ĐỐNG TÁC NAM; nếu người dùng là nam, phải vẽ ĐỐNG TÁC NỮ.`;

      const promptObj = {
        aspectRatio: "1:1",
        personGeneration: "allow_adult",
      };

      const imagenPrompt = `${fixedStyleLineEn} ${geographyEn} ${genderEnforcementEn} ${ageEnforcementEn}\n${partnerDetailsEn}\n${imagenPromptRaw}. CRITICAL: if user is female, generate a MALE subject; if user is male, generate a FEMALE subject.`;
      const imagenPromptViFinal = imagenPromptVi || null;

      const imagesOut = await generateImagenImages(GEMINI_API_KEY, imagenPrompt, {
        sampleCount: 1,
        aspectRatio: typeof promptObj.aspectRatio === "string" ? (promptObj.aspectRatio as string) : undefined,
        personGeneration: typeof promptObj.personGeneration === "string" ? (promptObj.personGeneration as string) : "allow_adult",
      });

      return new Response(
        JSON.stringify({
          images: imagesOut,
          imagenPrompt,
          imagenPromptVi: imagenPromptViFinal,
          compatibilityScore,
          compatibilityRationale,
          spousePortraitDirection,
          partnerSketch: (sketchObj && typeof sketchObj === "object" ? (sketchObj.partnerSketch as unknown) : null) ?? null,
          imageAnalysis,
          creditsSpent: cost,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseSystemPrompt = getSystemPrompt(lang, resolvedModule, responseFormat);
    const systemPrompt =
      resolvedModule === "eastern_upload"
        ? `${baseSystemPrompt}${getEasternUploadSystemMarker(contextJson, lang)}`
        : baseSystemPrompt;
    const userContext = buildUserContext(context, lang);
    const genericContext = buildGenericContext(contextJson, lang);
    const profileContext = buildProfileContext(profile, lang);

    const conversationHistory = messages.map((msg) => {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: msg.content }];
      if (msg.role === "user" && image && image.data && image.mimeType) {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
      }
      return {
        role: msg.role === "user" ? "user" : "model",
        parts,
      };
    });

    const preface = `${userContext}${genericContext}${profileContext}`.trim();
    const contents = preface
      ? [{ role: "user", parts: [{ text: preface }] }, ...conversationHistory]
      : conversationHistory;

    const url = `${stream ? GEMINI_API_STREAM_URL : GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

    const generationConfig: Record<string, unknown> = {};
    if (!stream && responseFormat === "json") {
      generationConfig.responseMimeType = "application/json";
      if (resolvedModule === "eastern_upload") {
        generationConfig.responseSchema = getEasternUploadSchema();
        generationConfig.temperature = 0.2;
      } else if (resolvedModule === "eastern" || String(resolvedModule).startsWith("eastern_")) {
        generationConfig.responseSchema = getEasternResultSchema();
        generationConfig.temperature = 0.4;
      }
    }

    const payload = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (stream) {
      const encoder = new TextEncoder();
      const body = response.body;

      if (!body) {
        throw new Error("No response body for streaming");
      }

      const streamResponse = new ReadableStream({
        async start(controller) {
          const responseText = await new Response(body).text();
          const items = JSON.parse(responseText) as Array<{
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          }>;
          for (const item of items) {
            const text = item.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const words = text.split(" ");
              for (const word of words) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + " " })}\n\n`));
                await new Promise((resolve) => setTimeout(resolve, 30));
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(streamResponse, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!stream && responseFormat === "json" && resolvedModule === "eastern_upload") {
      try {
        const parsed = JSON.parse(stripJsonFences(String(generatedText))) as Record<string, unknown>;
        const normalized = normalizeEasternUploadJson(profile, parsed, contextJson);
        return new Response(
          JSON.stringify({
            response: JSON.stringify(normalized),
            disclaimer:
              lang === "vi"
                ? "Nội dung này chỉ dành cho mục đích tự hiểu bản thân và phản chiếu."
                : "This content is for self-understanding and reflection purposes only.",
            creditsSpent: cost,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (err) {
        console.error("Failed to normalize eastern_upload JSON response:", err);
      }
    }

    return new Response(
      JSON.stringify({
        response: generatedText,
        disclaimer:
          lang === "vi"
            ? "Nội dung này chỉ dành cho mục đích tự hiểu bản thân và phản chiếu."
            : "This content is for self-understanding and reflection purposes only.",
        creditsSpent: cost,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in oracle-chat function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
