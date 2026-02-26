import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BASE_PROMPTS, MODULE_PROMPTS } from "./prompts.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_API_STREAM_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function buildProfileContext(profile?: ProfileContext, lang: "en" | "vi" = "en"): string {
  if (!profile) return "";
  if (lang === "vi") {
    return `\nHồ sơ người dùng:\n- Họ và tên: ${profile.fullName}\n- Ngày sinh dương lịch: ${profile.dateOfBirth}\n- Ngày sinh âm lịch: ${profile.lunarDateOfBirth ?? "(chưa có)"}\n- Giờ sinh: ${profile.timeOfBirth ?? "(không cung cấp)"}\n- Nơi sinh: ${profile.placeOfBirth ?? "(không cung cấp)"}\n- Giới tính: ${profile.gender ?? "(không cung cấp)"}\n`;
  }

  return `\nUser Profile:\n- Full name: ${profile.fullName}\n- Solar DOB: ${profile.dateOfBirth}\n- Lunar DOB: ${profile.lunarDateOfBirth ?? "(not provided)"}\n- Time of birth: ${profile.timeOfBirth ?? "(not provided)"}\n- Place of birth: ${profile.placeOfBirth ?? "(not provided)"}\n- Gender: ${profile.gender ?? "(not provided)"}\n`;
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
  image?: {
    data: string;
    mimeType: string;
  };
  lang?: "en" | "vi";
  module?: "numerology" | "eastern" | "eastern_upload" | "western" | "tarot" | "iching" | "career";
  stream?: boolean;
  responseFormat?: "json" | "text";
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
  moduleKey: keyof typeof MODULE_PROMPTS,
  responseFormat?: "json" | "text"
) {
  const formatLine =
    responseFormat === "json"
      ? lang === "vi"
        ? "\n\nTrả về JSON hợp lệ và không thêm văn bản ngoài JSON."
        : "\n\nReturn valid JSON only and do not add any text outside JSON."
      : "";
  return `${BASE_PROMPTS[lang]}\n\n${MODULE_PROMPTS[moduleKey][lang]}${formatLine}`;
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
    const maxLen = 12000;
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
  // CORS headers
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
      image,
      lang = "en",
      module = "numerology",
      stream = false,
      responseFormat = "text",
    } = (await req.json()) as RequestBody;

    // Debug logging for image uploads
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

    const resolvedModule = module;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = getSystemPrompt(lang, resolvedModule as keyof typeof MODULE_PROMPTS, responseFormat);
    const userContext = buildUserContext(context, lang);
    const genericContext = buildGenericContext(contextJson, lang);
    const profileContext = buildProfileContext(profile, lang);

    // Build conversation history
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

    // Add context as first user message if available
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
      } else if (resolvedModule === "eastern") {
        generationConfig.responseSchema = getEasternResultSchema();
        generationConfig.temperature = 0.4;
      }
    }

    // Build minimal payload like Google example
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
      const decoder = new TextDecoder();
      const body = response.body;

      if (!body) {
        throw new Error("No response body for streaming");
      }

      const streamResponse = new ReadableStream({
        async start(controller) {
          const responseText = await new Response(body).text();
          console.log("Gemini stream response:", responseText);
          // Gemini returns JSON array for streamGenerateContent
          const items = JSON.parse(responseText) as Array<{
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          }>;
          for (const item of items) {
            const text = item.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              console.log("Extracted text:", text);
              // Split into words for smoother streaming
              const words = text.split(' ');
              for (const word of words) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`));
                await new Promise(resolve => setTimeout(resolve, 30));
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
    console.error("Error in gemini-chat function:", error);
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
