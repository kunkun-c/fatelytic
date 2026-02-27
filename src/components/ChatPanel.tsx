import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { APP_STORAGE_PREFIX } from "@/lib/brand";
import { toast } from "sonner";
import { getStoredProfile } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Json } from "@/integrations/supabase/types";

export interface ChatPanelMessage {
  role: "user" | "assistant";
  content: string;
}

type ChatPanelProps = {
  moduleKey:
    | "numerology"
    | "eastern"
    | "eastern_overview"
    | "eastern_career"
    | "eastern_finance"
    | "eastern_marriage"
    | "eastern_health"
    | "eastern_fortune"
    | "western"
    | "tarot"
    | "iching"
    | "career";
  contextJson?: unknown;
  initialPrompt?: string;
  welcomeMessage?: string;
  className?: string;
  heightClassName?: string;
  storageKeySuffix?: string;
  showQuickActions?: boolean;
  quickActions?: Array<{ label: string; prompt: string }>;
};

const defaultQuickActions: Array<{ label: string; prompt: string }> = [
  { label: "Giải thích kết quả", prompt: "Hãy giải thích chi tiết kết quả của tôi." },
  { label: "Điểm mạnh/yếu", prompt: "Hãy chỉ ra điểm mạnh/yếu chính và gợi ý cải thiện." },
  { label: "Sự nghiệp", prompt: "Hãy tư vấn định hướng sự nghiệp phù hợp." },
  { label: "Tình cảm", prompt: "Hãy phân tích tình cảm/hôn nhân và lời khuyên thực tế." },
];

const quickActionsByModule: Record<
  Exclude<ChatPanelProps["moduleKey"], "eastern" | "eastern_overview" | "eastern_career" | "eastern_finance" | "eastern_marriage" | "eastern_health" | "eastern_fortune">,
  Array<{ label: string; prompt: string }>
> = {
  numerology: [
    { label: "Giải thích kết quả", prompt: "Hãy giải thích chi tiết kết quả thần số học của tôi." },
    { label: "Điểm mạnh/yếu", prompt: "Hãy chỉ ra 3 điểm mạnh và 3 điểm cần cải thiện, kèm ví dụ cụ thể." },
    { label: "Thói quen", prompt: "Hãy gợi ý 5 thói quen thực tế để phát huy điểm mạnh và giảm điểm yếu." },
    { label: "Câu hỏi gợi mở", prompt: "Hãy đặt 5 câu hỏi phản chiếu để tôi tự hiểu mình sâu hơn." },
  ],
  western: [
    { label: "Tổng quan", prompt: "Hãy tóm tắt 7-10 ý chính từ góc nhìn chiêm tinh Tây phương (mang tính phản chiếu)." },
    { label: "Cảm xúc", prompt: "Hãy phân tích khuynh hướng cảm xúc và cách tôi tự điều chỉnh khi căng thẳng." },
    { label: "Công việc", prompt: "Hãy gợi ý hướng nghề nghiệp phù hợp và 1-2 bước thử nghiệm trong 2 tuần." },
    { label: "Điểm mù", prompt: "Hãy chỉ ra 2-3 'điểm mù' hành vi và cách khắc phục thực tế." },
  ],
  tarot: [
    { label: "Làm rõ lựa chọn", prompt: "Hãy giúp tôi làm rõ 2-3 lựa chọn hiện tại: ưu/nhược và hành động tiếp theo." },
    { label: "Trạng thái cảm xúc", prompt: "Hãy phản chiếu trạng thái cảm xúc của tôi và nhu cầu cốt lõi đang bị bỏ quên." },
    { label: "Rủi ro", prompt: "Hãy nêu rủi ro lớn nhất nếu tôi hành động vội, và cách giảm rủi ro." },
    { label: "Thông điệp", prompt: "Hãy tóm tắt thông điệp chính thành 5 gạch đầu dòng + 1 câu hỏi để tôi tự trả lời." },
  ],
  iching: [
    { label: "Diễn giải", prompt: "Hãy diễn giải quẻ theo tinh thần Kinh Dịch: bối cảnh, xu hướng, và điều nên giữ." },
    { label: "Hành động", prompt: "Hãy đề xuất 3 bước hành động nhỏ trong 7 ngày tới phù hợp với thông điệp quẻ." },
    { label: "Điều nên tránh", prompt: "Hãy nêu 3 điều nên tránh (thiên kiến/hành vi) và dấu hiệu cảnh báo sớm." },
    { label: "Câu hỏi", prompt: "Hãy đề xuất 5 câu hỏi phản chiếu để tôi tự kiểm chứng." },
  ],
  career: [
    { label: "Mục tiêu", prompt: "Hãy giúp tôi làm rõ mục tiêu nghề nghiệp 3-6 tháng tới và tiêu chí đo lường." },
    { label: "Lộ trình", prompt: "Hãy đề xuất lộ trình 4 tuần (theo tuần) với các đầu việc cụ thể." },
    { label: "CV/Portfolio", prompt: "Hãy gợi ý cách cải thiện CV/portfolio theo vai trò tôi đang nhắm tới." },
    { label: "Câu hỏi phỏng vấn", prompt: "Hãy gợi ý 10 câu hỏi phỏng vấn và cách trả lời theo STAR." },
  ],
};

const easternQuickActionsByOptionId: Record<string, Array<{ label: string; prompt: string }>> = {
  overview: [
    { label: "Tóm tắt", prompt: "Hãy tóm tắt 7-10 ý chính từ phần luận giải tổng quan." },
    { label: "Điểm mạnh", prompt: "Hãy nêu 3 điểm mạnh nổi bật và cách tận dụng trong đời sống." },
    { label: "Điểm cần lưu ý", prompt: "Hãy nêu 3 rủi ro/điểm cần lưu ý và cách phòng tránh thực tế." },
    { label: "Câu hỏi", prompt: "Hãy gợi ý 5 câu hỏi hay để tôi hỏi tiếp cho đúng trọng tâm." },
  ],
  career: [
    { label: "Hướng đi", prompt: "Hãy gợi ý 2-3 hướng đi nghề nghiệp phù hợp + trade-off của từng hướng." },
    { label: "Nâng kỹ năng", prompt: "Hãy đề xuất 5 kỹ năng ưu tiên và 1 kế hoạch 14 ngày để bắt đầu." },
    { label: "Ra quyết định", prompt: "Hãy cho tôi khung ra quyết định 3 bước khi chọn job/dự án." },
    { label: "Rủi ro", prompt: "Hãy nêu rủi ro lớn nhất trong sự nghiệp và cách giảm rủi ro." },
  ],
  finance: [
    { label: "Hệ thống tiền", prompt: "Hãy gợi ý 1 hệ thống quản trị tiền bạc đơn giản (ngân sách, tích lũy, giới hạn rủi ro)." },
    { label: "Thiên kiến", prompt: "Hãy chỉ ra 2-3 thiên kiến ra quyết định tiền bạc và cách khắc phục." },
    { label: "Ưu tiên", prompt: "Hãy giúp tôi đặt thứ tự ưu tiên tài chính 3-6 tháng tới." },
    { label: "Checklist", prompt: "Hãy đưa checklist 10 mục trước khi đưa ra quyết định tài chính lớn." },
  ],
  marriage: [
    { label: "Nhu cầu", prompt: "Hãy làm rõ nhu cầu quan hệ cốt lõi của tôi và điều tôi thường né tránh." },
    { label: "Xung đột", prompt: "Hãy nêu 3 điểm dễ xung đột và cách giao tiếp/đặt ranh giới." },
    { label: "Tiêu chí", prompt: "Hãy gợi ý tiêu chí lựa chọn/đồng hành phù hợp (thực tế, không định mệnh)." },
    { label: "Câu hỏi", prompt: "Hãy gợi ý 10 câu hỏi nên trao đổi với đối tác để tránh hiểu lầm." },
  ],
  health: [
    { label: "Stress", prompt: "Hãy chỉ ra dấu hiệu stress dễ gặp và 3 cách hạ nhiệt trong 10 phút." },
    { label: "Thói quen", prompt: "Hãy gợi ý 5 thói quen wellbeing (ngủ, vận động, ăn uống) dễ áp dụng." },
    { label: "Nhịp sống", prompt: "Hãy đề xuất lịch sinh hoạt mẫu 1 ngày để ổn định năng lượng." },
    { label: "Khi nào cần gặp bác sĩ", prompt: "Hãy nêu các dấu hiệu nên gặp chuyên gia y tế (không chẩn đoán)." },
  ],
  fortune: [
    { label: "Chủ đề giai đoạn", prompt: "Hãy tóm tắt chủ đề của giai đoạn hiện tại và 2-3 ưu tiên." },
    { label: "Checklist", prompt: "Hãy đưa checklist chuẩn bị cho 1-2 tháng tới theo hướng kiểm soát được." },
    { label: "Cơ hội", prompt: "Hãy nêu cơ hội nên chủ động nắm và cách hành động an toàn." },
    { label: "Rủi ro", prompt: "Hãy nêu rủi ro/áp lực có thể gặp và dấu hiệu cảnh báo sớm." },
  ],
  upload: [
    { label: "Tóm tắt", prompt: "Hãy tóm tắt lá số này trong 7-10 ý chính." },
    { label: "Sự nghiệp", prompt: "Dựa trên kết quả vừa luận giải, hãy tư vấn sự nghiệp theo hướng thực tế (không định mệnh)." },
    { label: "Tình cảm", prompt: "Dựa trên kết quả vừa luận giải, hãy phân tích tình cảm/hôn nhân và lời khuyên." },
    { label: "Hỏi theo cung", prompt: "Hãy gợi ý 5 câu hỏi hay để hỏi theo 12 cung." },
  ],
};

const ChatPanel = ({
  moduleKey,
  contextJson,
  initialPrompt,
  welcomeMessage,
  className,
  heightClassName,
  storageKeySuffix,
  showQuickActions,
  quickActions,
}: ChatPanelProps) => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const profile = getStoredProfile();

  const contextOptionId = useMemo(() => {
    const v = contextJson as { optionId?: unknown } | undefined;
    return typeof v?.optionId === "string" ? v.optionId : null;
  }, [contextJson]);

  const resolvedWelcome = useMemo(() => {
    if (typeof welcomeMessage === "string" && welcomeMessage.trim()) return welcomeMessage;

    if (moduleKey.startsWith("eastern")) {
      switch (contextOptionId) {
        case "career":
          return "Chào bạn! Mình sẽ tập trung vào Sự nghiệp & Công danh dựa trên thông tin bạn cung cấp. Bạn muốn hỏi về công việc hiện tại, hướng đi phù hợp, hay cách ra quyết định?";
        case "finance":
          return "Chào bạn! Mình sẽ tập trung vào Tài chính & Tài vận dựa trên thông tin bạn cung cấp. Bạn muốn hỏi về tích lũy, quản trị rủi ro, hay thói quen tiền bạc?";
        case "marriage":
          return "Chào bạn! Mình sẽ tập trung vào Hôn nhân & Gia đạo dựa trên thông tin bạn cung cấp. Bạn muốn hỏi về mối quan hệ hiện tại, tiêu chí phù hợp, hay cách giao tiếp/đặt ranh giới?";
        case "health":
          return "Chào bạn! Mình sẽ tập trung vào Sức khoẻ & Phúc đức theo hướng wellbeing dựa trên thông tin bạn cung cấp. Bạn muốn hỏi về thói quen, quản lý stress, hay nhịp sinh hoạt?";
        case "fortune":
          return "Chào bạn! Mình sẽ tập trung vào Thời vận (Đại vận/Tiểu vận) theo hướng tham khảo dựa trên thông tin bạn cung cấp. Bạn muốn xem giai đoạn nào hoặc một mốc thời gian cụ thể?";
        case "overview":
        case "upload":
        default:
          return contextOptionId === "upload"
            ? "Chào bạn! Mình sẽ dựa trên lá số bạn đã tải lên để trả lời. Bạn muốn làm rõ phần nào trước?"
            : "Chào bạn! Mình sẽ dựa trên thông tin bạn cung cấp để phản chiếu và gợi ý. Bạn muốn làm rõ phần nào trước?";
      }
    }

    return t("chat.welcome");
  }, [contextOptionId, moduleKey, t, welcomeMessage]);

  const resolvedShowQuickActions = useMemo(() => {
    if (typeof showQuickActions === "boolean") return showQuickActions;
    if (moduleKey.startsWith("eastern") && contextOptionId && contextOptionId !== "overview" && contextOptionId !== "upload") return false;
    return true;
  }, [contextOptionId, moduleKey, showQuickActions]);

  const [messages, setMessages] = useState<ChatPanelMessage[]>([
    { role: "assistant", content: resolvedWelcome },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const assistantIndexRef = useRef<number | null>(null);

  const hydratedRef = useRef(false);
  const initKeyRef = useRef<string | null>(null);
  const loadedSessionRef = useRef<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const assistantContentRef = useRef<string>("");

  const storageKey = `${APP_STORAGE_PREFIX}-chat:${moduleKey}${storageKeySuffix ? ":" + storageKeySuffix : ""}`;

  const contextJsonForInsert = useMemo(() => {
    return (contextJson ?? null) as unknown as Json;
  }, [contextJson]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as ChatPanelMessage[];
      if (parsed.length > 0) setMessages(parsed);
      hydratedRef.current = true;
    } catch (error) {
      console.error("Failed to parse cached chat:", error);
    }
  }, [storageKey]);

  const readingIdStr = useMemo(() => {
    const readingId = (contextJson as { readingId?: unknown } | undefined)?.readingId;
    return typeof readingId === "string" && readingId ? readingId : null;
  }, [contextJson]);

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;

      const initKey = `${user.id}:${moduleKey}:${readingIdStr ?? "no-reading"}`;
      if (initKeyRef.current === initKey) return;
      initKeyRef.current = initKey;

      const localSessionKey = `${storageKey}:sessionId`;
      const cachedSessionId = localStorage.getItem(localSessionKey);
      if (cachedSessionId && typeof cachedSessionId === "string") {
        setSessionId(cachedSessionId);
        return;
      }

      if (readingIdStr) {
        const { data: existing, error: selectError } = await supabase
          .from("chat_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("module", moduleKey)
          .eq("reading_id", readingIdStr)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!selectError && existing?.id) {
          setSessionId(existing.id as string);
          localStorage.setItem(localSessionKey, existing.id as string);
          return;
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          module: moduleKey,
          reading_id: readingIdStr,
          context_json: contextJsonForInsert,
        })
        .select("id")
        .single();

      if (!insertError && inserted?.id) {
        setSessionId(inserted.id as string);
        localStorage.setItem(localSessionKey, inserted.id as string);
      }
    };

    void init();
  }, [contextJsonForInsert, moduleKey, readingIdStr, storageKey, user?.id]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !sessionId) return;
      if (loadedSessionRef.current === sessionId) return;
      loadedSessionRef.current = sessionId;

      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load chat messages:", error);
        return;
      }

      if (!data || data.length === 0) return;
      const loaded = (data as Array<{ role: "user" | "assistant"; content: string }>).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      setMessages(loaded);
      hydratedRef.current = true;
    };

    void load();
  }, [sessionId, user?.id]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (messages.length !== 1) return;
    if (messages[0]?.role !== "assistant") return;
    setMessages([{ role: "assistant", content: resolvedWelcome }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedWelcome]);

  const appendAssistantText = useCallback((text: string) => {
    setMessages((prev) =>
      prev.map((msg, idx) => (idx === assistantIndexRef.current ? { ...msg, content: `${msg.content}${text}` } : msg))
    );
  }, []);

  const scheduleAssistantPersist = useCallback(
    (content: string) => {
      if (!user?.id || !sessionId || !assistantMessageIdRef.current) return;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(async () => {
        const id = assistantMessageIdRef.current;
        if (!id) return;
        const { error } = await supabase.from("chat_messages").update({ content }).eq("id", id);
        if (error) console.error("Failed to update assistant message:", error);
      }, 700);
    },
    [sessionId, user?.id]
  );

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || typing) return;

      const newMessages = [...messages, { role: "user" as const, content: text }];
      const nextMessages = [...newMessages, { role: "assistant" as const, content: "" }];
      assistantIndexRef.current = newMessages.length;
      setMessages(nextMessages);
      setInput("");
      setTyping(true);

      assistantMessageIdRef.current = null;
      assistantContentRef.current = "";

      if (user?.id && sessionId) {
        const { error: userInsertErr } = await supabase.from("chat_messages").insert({
          session_id: sessionId,
          role: "user",
          content: text,
        });
        if (userInsertErr) console.error("Failed to persist user message:", userInsertErr);

        const { data: assistantInserted, error: assistantInsertErr } = await supabase
          .from("chat_messages")
          .insert({
            session_id: sessionId,
            role: "assistant",
            content: "",
          })
          .select("id")
          .single();

        if (!assistantInsertErr && assistantInserted?.id) {
          assistantMessageIdRef.current = assistantInserted.id as string;
        } else if (assistantInsertErr) {
          console.error("Failed to persist assistant placeholder:", assistantInsertErr);
        }
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/oracle-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
            contextJson,
            profile,
            lang,
            module: moduleKey,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.replace("data:", "").trim();
            if (payload === "[DONE]") {
              setTyping(false);
              return;
            }
            try {
              const json = JSON.parse(payload) as { text?: string };
              if (json.text) {
                appendAssistantText(json.text);
                assistantContentRef.current += json.text;
                scheduleAssistantPersist(assistantContentRef.current);
              }
            } catch (err) {
              console.error("Stream parse error:", err);
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        toast.error(t("chat.error"));
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === assistantIndexRef.current ? { ...msg, content: t("chat.errorFallback") } : msg
          )
        );
      } finally {
        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        setTyping(false);
      }
    },
    [appendAssistantText, contextJson, input, lang, messages, moduleKey, profile, scheduleAssistantPersist, sessionId, t, typing, user?.id]
  );

  useEffect(() => {
    if (!initialPrompt) return;
    setInput(initialPrompt);
    void sendMessage(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const defaultActions = useMemo(() => {
    if (moduleKey.startsWith("eastern")) {
      const option = contextOptionId ?? "overview";
      return easternQuickActionsByOptionId[option] ?? easternQuickActionsByOptionId.overview;
    }
    return quickActionsByModule[moduleKey as keyof typeof quickActionsByModule] ?? defaultQuickActions;
  }, [contextOptionId, moduleKey]);

  const actions = quickActions && quickActions.length > 0 ? quickActions : defaultActions;

  return (
    <div className={className}>
      <div
        ref={scrollRef}
        className={`space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-3 sm:p-4 ${
          heightClassName ?? ""
        }`}
      >
        {messages.map((msg, i) => (
          <div key={`msg-${i}-${msg.role}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%] ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                typing && i === assistantIndexRef.current && !msg.content.trim() ? (
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: "0.4s" }} />
                  </span>
                ) : (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/^\d+\.\s/gm, (match) => `<br/>${match}`)
                        .replace(/\n/g, "<br/>")
                        .trim(),
                    }}
                  />
                )
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {resolvedShowQuickActions && messages.length === 1 && messages[0].role === "assistant" && !typing && (
          <div className="flex flex-wrap gap-2 px-1">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  setInput(action.prompt);
                  void sendMessage(action.prompt);
                }}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/30"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
        className="mt-3 flex gap-2 sm:mt-4"
      >
        <Input
          placeholder={t("chat.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={typing || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;
