import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BASE_PROMPTS, MODULE_PROMPTS } from "./prompts.ts";

type ModuleKey = Extract<keyof typeof MODULE_PROMPTS, string>;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_API_STREAM_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

interface Message {
  role: "user" | "assistant";
  content: string;
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

    if (image) {
      console.log("📸 Image upload detected:", {
        mimeType: image.mimeType,
        dataLength: image.data.length,
        module,
        lang,
        stream,
        responseFormat,
        hasProfile: !!profile,
        profileName: profile?.fullName,
      });
    }

    if (module === "speech_to_text") {
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
      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedModule = isModuleKey(module) ? module : "numerology";
    if (!isModuleKey(module)) {
      console.warn("Unknown module key received; falling back to numerology:", module);
    }

    const resolvedModule = resolveModuleKey(normalizedModule, contextJson);

    if (resolvedModule === "eastern_image") {
      const portrait = coerceInlineImage(images?.portrait);
      const chart = coerceInlineImage(images?.chart) ?? (image ? { data: image.data, mimeType: image.mimeType } : null);

      const inputMode = portrait && chart ? "BOTH_PORTRAIT_AND_CHART" : portrait ? "PORTRAIT_ONLY" : chart ? "CHART_ONLY" : "NO_IMAGES";

      const analysisSystemPrompt =
        lang === "vi"
          ?
              "Bạn là chuyên gia phân tích hình ảnh + OCR để trích xuất thuộc tính có cấu trúc. Nhiệm vụ: phân tích các ảnh được cung cấp (nếu có) để trích xuất dữ liệu phục vụ dựng chân dung minh hoạ NGƯỜI HÔN PHỐI.\n\nQUY TẮC:\n- Output CHỈ JSON, không kèm chữ ngoài JSON.\n- Không suy đoán danh tính. Không tạo PII (tên, địa chỉ, số điện thoại).\n- Nếu chữ trong ảnh khó đọc: vẫn phải trả về JSON đầy đủ, dùng null/[] và ghi notes.\n\nNếu có CHÂN DUNG (user): chỉ trích xuất thuộc tính thẩm mỹ tổng quan (không nhận dạng), ví dụ: vibe, phong cách, palette.\n\nNếu có LÁ SỐ TỬ VI: tập trung trích xuất tín hiệu liên quan CUNG PHU THÊ và các yếu tố giúp phác hoạ người hôn phối.\n- Ưu tiên: xác định ô/cung 'PHU THÊ' (hoặc chữ tương đương), các SAO nằm trong cung đó, và các chú thích liên quan.\n- Nếu có thể: ghi nhận cung xung chiếu/tam hợp với Phu Thê (chỉ nêu những gì nhìn thấy trên lá số).\n- Tuyệt đối KHÔNG kết luận định mệnh; chỉ rút ra gợi ý 'vibe/khí chất' trung tính để dựng chân dung minh hoạ.\n- BẮT BUỘC trả thêm confidence (0-1) cho các phần quan trọng, để downstream cân nhắc mức độ chắc chắn.\n\nJSON schema: {\n  \"hasPortrait\": boolean,\n  \"hasChart\": boolean,\n  \"portraitInsights\": {\n    \"genderPresentation\": string|null,\n    \"ageRange\": string|null,\n    \"overallVibe\": string|null,\n    \"hair\": string|null,\n    \"style\": string|null,\n    \"colorPalette\": string|null\n  }|null,\n  \"chartInsights\": {\n    \"chartType\": \"tu_vi\"|\"unknown\",\n    \"phuThe\": {\n      \"found\": boolean,\n      \"confidence\": number,\n      \"palaceLabel\": string|null,\n      \"palaceLabelConfidence\": number,\n      \"mainStars\": string[],\n      \"mainStarsConfidence\": number,\n      \"auxStars\": string[],\n      \"auxStarsConfidence\": number,\n      \"notes\": string|null\n    },\n    \"relatedPalaces\": {\n      \"tamHop\": string[],\n      \"xungChieu\": string[],\n      \"giapCung\": string[]\n    },\n    \"spouseTraitHints\": {\n      \"vibeKeywords\": string[],\n      \"appearanceKeywords\": string[],\n      \"styleKeywords\": string[],\n      \"personalityKeywords\": string[]\n    },\n    \"ocrSnippets\": string[],\n    \"notes\": string|null\n  }|null\n}"
          :
              "You are an image analyst with OCR extracting structured attributes. Task: analyze the provided images (if any) to produce structured insights for generating a symbolic spouse/partner portrait.\n\nRULES:\n- Output STRICT JSON only.\n- Never infer identity. Never invent PII (name, address, phone).\n- If text is unreadable, still return the full JSON using null/[] and add notes.\n\nIf PORTRAIT is provided: extract high-level aesthetic attributes only (no identity), e.g. vibe, hair, style, palette.\n\nIf TU VI CHART is provided: focus on spouse-related signals, especially the PHU THE palace. Extract what you can see (labels, stars, notes). Do NOT make destiny claims; only neutral trait hints for portrait direction.\n- MUST output confidence scores (0-1) for key extracted fields.\n\nJSON schema: {\n  hasPortrait: boolean,\n  hasChart: boolean,\n  portraitInsights: { genderPresentation: string|null, ageRange: string|null, overallVibe: string|null, hair: string|null, style: string|null, colorPalette: string|null }|null,\n  chartInsights: {\n    chartType: 'tu_vi'|'unknown',\n    phuThe: { found: boolean, confidence: number, palaceLabel: string|null, palaceLabelConfidence: number, mainStars: string[], mainStarsConfidence: number, auxStars: string[], auxStarsConfidence: number, notes: string|null },\n    relatedPalaces: { tamHop: string[], xungChieu: string[], giapCung: string[] },\n    spouseTraitHints: { vibeKeywords: string[], appearanceKeywords: string[], styleKeywords: string[], personalityKeywords: string[] },\n    ocrSnippets: string[],\n    notes: string|null\n  }|null\n}";
      // NOTE: analysisSystemPrompt includes a JSON schema; keep it inline for Gemini.

      const sketchSystemPrompt =
        lang === "vi"
          ?
              "Bạn là chuyên gia luận giải phong cách và art director. Nhiệm vụ: dựa trên TOÀN BỘ thông tin người dùng (hồ sơ + ngữ cảnh) và kết quả phân tích ảnh (nếu có) để phác hoạ chân dung người hôn phối/đối tác theo hướng thực tế, không định mệnh.\n\nQUY TẮC:\n- Output CHỈ JSON.\n- Không hardcode quốc gia/phong cách; mọi gợi ý phải đến từ input.\n- Không đưa PII (tên, ngày sinh đầy đủ, địa chỉ cụ thể) vào output.\n- Bắt buộc trả thêm \"compatibilityScore\" (0-100) + \"compatibilityRationaleVi\" giải thích ngắn gọn dựa trên input.\n- Bắt buộc trả thêm \"spousePortraitDirectionVi\": 3-6 câu mô tả hướng phát hoạ (dựa vào Cung Phu Thê / sao / tam hợp / xung chiếu nếu có), và nói rõ mức độ chắc chắn dựa trên confidence.\n\nJSON schema: {\n  \"partnerSketch\": {\n    \"genderPresentation\": string|null,\n    \"ageRange\": string|null,\n    \"style\": string|null,\n    \"overallVibe\": string|null,\n    \"facialFeatures\": string[],\n    \"hair\": string|null,\n    \"accessories\": string[],\n    \"setting\": string|null,\n    \"colorPalette\": string|null\n  },\n  \"compatibilityScore\": number,\n  \"compatibilityRationaleVi\": string,\n  \"spousePortraitDirectionVi\": string,\n  \"confidence\": number\n}"
          :
              "You are a style reasoning expert and art director. Task: use the full user info (profile + context) and any image analysis results to derive a grounded partner-portrait sketch (non-fatalistic).\n\nRULES:\n- Output STRICT JSON only.\n- Do not hardcode locale/style; derive from input.\n- Do not include PII (name, full DOB, exact address).\n- Must return compatibilityScore (0-100) + short rationale.\n- Must return spousePortraitDirection: 3-6 sentences describing the portrait direction and confidence.\n\nJSON schema: { partnerSketch: { genderPresentation: string|null, ageRange: string|null, style: string|null, overallVibe: string|null, facialFeatures: string[], hair: string|null, accessories: string[], setting: string|null, colorPalette: string|null }, compatibilityScore: number, compatibilityRationale: string, spousePortraitDirection: string }";

      const profileForReasoning = `${buildProfileContext(profile, lang)}${buildImageAnalysisProfileContext(profile, lang)}`;
      const genericContext = buildGenericContext(contextJson, lang);

      const analysisParts = buildImagenParts(
        `${genericContext}${profileForReasoning}`.trim() ||
          (lang === "vi" ? "Hãy phân tích ảnh theo schema JSON." : "Analyze the images per the JSON schema."),
        portrait,
        chart
      );

      const imageAnalysis =
        portrait || chart ? await callGeminiJson(GEMINI_API_KEY, analysisSystemPrompt, analysisParts) : null;

      const sketchInput =
        lang === "vi"
          ? `INPUT MODE: ${inputMode}\n\nNgữ cảnh đầy đủ (dùng để suy luận, không đưa PII vào prompt Imagen):\n${genericContext}${profileForReasoning}\n\nNguồn tham chiếu: Khi diễn giải sao/cung (đặc biệt cung Phu Thê), ưu tiên tra cứu theo sách "Tử Vi Đẩu Số Toàn Thư" và ghi nhận theo phong cách thận trọng (nếu không chắc, nói rõ).\n\nKết quả phân tích ảnh (nếu có):\n${imageAnalysis ? JSON.stringify(imageAnalysis) : "(không có ảnh)"}\n\nYêu cầu: tạo partnerSketch + compatibilityScore theo schema. Nhấn mạnh style minh hoạ: chân dung bút chì (graphite), nền giấy cổ điển/giấy ngà có texture, ánh sáng mềm, cảm giác trang sách/giấy vẽ cổ điển (không cổ trang).`
          : `INPUT MODE: ${inputMode}\n\nFull context (for reasoning; do not put PII into Imagen prompt):\n${genericContext}${profileForReasoning}\n\nReference: when interpreting stars/palaces (especially spouse/Phu The signals), prioritize classical Tu Vi sources (e.g. Tu Vi Dau So Toan Thu). Be cautious; if uncertain, say so.\n\nImage analysis (if any):\n${imageAnalysis ? JSON.stringify(imageAnalysis) : "(no images)"}\n\nRequirement: create partnerSketch + compatibilityScore per schema. Emphasize illustration direction: graphite pencil portrait on vintage paper background with visible paper grain; soft lighting; modern subject (no historical costume).`;

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

      const systemPrompt = getSystemPrompt(lang, resolvedModule, "json");
      const imagenProfileContext = buildImagenProfileContext(profile, lang);
      const preface = `${genericContext}${imagenProfileContext}`.trim();

      const partnerSketchText =
        sketchObj && typeof sketchObj === "object"
          ? `Partner sketch (JSON):\n${JSON.stringify(sketchObj)}`
          : "Partner sketch: (missing)";

      const promptInputText =
        preface.length > 0
          ? `${preface}\n\nINPUT MODE: ${inputMode}\n\nStyle direction (must follow): graphite pencil portrait, hand-drawn pencil strokes, monochrome/soft sepia, vintage paper background (aged ivory paper texture), subtle paper grain, clean modern Vietnamese/Southeast Asian adult look, modern wardrobe, no historical costume.\n\n${partnerSketchText}\n\nPlease produce the JSON for the Imagen prompt now.`
          : `INPUT MODE: ${inputMode}\n\nStyle direction (must follow): graphite pencil portrait, hand-drawn pencil strokes, monochrome/soft sepia, vintage paper background (aged ivory paper texture), subtle paper grain, clean modern Vietnamese/Southeast Asian adult look, modern wardrobe, no historical costume.\n\n${partnerSketchText}\n\nPlease produce the JSON for the Imagen prompt now.`;

      const promptParts = buildImagenParts(promptInputText, portrait, chart);

      const promptJson = await callGeminiJson(GEMINI_API_KEY, systemPrompt, promptParts);
      const promptObj = promptJson as {
        imagenPrompt?: unknown;
        imagenPromptVi?: unknown;
        aspectRatio?: unknown;
        personGeneration?: unknown;
      };

      const imagenPrompt = typeof promptObj.imagenPrompt === "string" ? promptObj.imagenPrompt.trim() : "";
      if (!imagenPrompt) throw new Error("Missing imagenPrompt");

      const imagenPromptVi =
        typeof promptObj.imagenPromptVi === "string" && promptObj.imagenPromptVi.trim().length > 0
          ? promptObj.imagenPromptVi.trim()
          : null;

      const imagesOut = await generateImagenImages(GEMINI_API_KEY, imagenPrompt, {
        sampleCount: 1,
        aspectRatio: typeof promptObj.aspectRatio === "string" ? (promptObj.aspectRatio as string) : undefined,
        personGeneration: typeof promptObj.personGeneration === "string" ? (promptObj.personGeneration as string) : "allow_adult",
      });

      return new Response(
        JSON.stringify({
          images: imagesOut,
          imagenPrompt,
          imagenPromptVi,
          compatibilityScore,
          compatibilityRationale,
          spousePortraitDirection,
          partnerSketch: (sketchObj && typeof sketchObj === "object" ? (sketchObj.partnerSketch as unknown) : null) ?? null,
          imageAnalysis,
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

    const systemPrompt = getSystemPrompt(lang, resolvedModule, responseFormat);
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

    console.log("Gemini request:", {
      url,
      stream,
      responseFormat,
      module: resolvedModule,
      hasImage: !!image,
      contentsCount: contents.length,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Gemini response status:", response.status);
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", response.status, errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    if (stream) {
      const encoder = new TextEncoder();
      const body = response.body;

      if (!body) {
        throw new Error("No response body for streaming");
      }

      const streamResponse = new ReadableStream({
        async start(controller) {
          const responseText = await new Response(body).text();
          console.log("Gemini stream response:", responseText);
          const items = JSON.parse(responseText) as Array<{
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          }>;
          for (const item of items) {
            const text = item.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              console.log("Extracted text:", text);
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

    return new Response(
      JSON.stringify({
        response: generatedText,
        disclaimer:
          lang === "vi"
            ? "Nội dung này chỉ dành cho mục đích tự hiểu bản thân và phản chiếu."
            : "This content is for self-understanding and reflection purposes only.",
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
