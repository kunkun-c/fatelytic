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
  moduleKey: "numerology" | "eastern" | "western" | "tarot" | "iching" | "career";
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

    if (moduleKey === "eastern") {
      switch (contextOptionId) {
        case "career":
          return "Chào bạn! Mình sẽ tập trung vào Sự nghiệp & Công danh dựa trên lá số của bạn. Bạn muốn hỏi về công việc hiện tại, hướng đi phù hợp, hay thời điểm bứt phá?";
        case "finance":
          return "Chào bạn! Mình sẽ tập trung vào Tài chính & Tài vận dựa trên lá số của bạn. Bạn muốn hỏi về tích lũy, đầu tư, hay giai đoạn tài lộc?";
        case "marriage":
          return "Chào bạn! Mình sẽ tập trung vào Hôn nhân & Gia đạo dựa trên lá số của bạn. Bạn muốn hỏi về mối quan hệ hiện tại, tiêu chí phù hợp, hay thời điểm thuận lợi?";
        case "health":
          return "Chào bạn! Mình sẽ tập trung vào Sức khoẻ & Phúc đức dựa trên lá số của bạn. Bạn muốn hỏi về thói quen, điểm cần lưu ý, hay giai đoạn dễ căng thẳng?";
        case "fortune":
          return "Chào bạn! Mình sẽ tập trung vào Thời vận (Đại vận/Tiểu vận) dựa trên lá số của bạn. Bạn muốn xem giai đoạn nào hoặc một mốc thời gian cụ thể?";
        case "overview":
        case "upload":
        default:
          return "Chào bạn! Mình sẽ dựa trên toàn bộ luận giải lá số của bạn để trả lời. Bạn muốn làm rõ phần nào trước?";
      }
    }

    return t("chat.welcome");
  }, [contextOptionId, moduleKey, t, welcomeMessage]);

  const resolvedShowQuickActions = useMemo(() => {
    if (typeof showQuickActions === "boolean") return showQuickActions;
    if (moduleKey === "eastern" && contextOptionId && contextOptionId !== "overview" && contextOptionId !== "upload") return false;
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

  const [sessionId, setSessionId] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const assistantContentRef = useRef<string>("");

  const storageKey = `${APP_STORAGE_PREFIX}-chat:${moduleKey}${storageKeySuffix ? ":" + storageKeySuffix : ""}`;

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

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;

      const readingId = (contextJson as { readingId?: unknown } | undefined)?.readingId;
      const readingIdStr = typeof readingId === "string" && readingId ? readingId : null;

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
          return;
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          module: moduleKey,
          reading_id: readingIdStr,
          context_json: (contextJson ?? null) as unknown as Json,
        })
        .select("id")
        .single();

      if (!insertError && inserted?.id) {
        setSessionId(inserted.id as string);
      }
    };

    void init();
  }, [contextJson, moduleKey, user?.id]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !sessionId) return;

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
        const response = await fetch(`${supabaseUrl}/functions/v1/gemini-chat`, {
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
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("chat.errorFallback"),
          },
        ]);
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

  const actions = quickActions && quickActions.length > 0 ? quickActions : defaultQuickActions;

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

        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-secondary px-4 py-3">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: "0.4s" }} />
              </span>
            </div>
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
