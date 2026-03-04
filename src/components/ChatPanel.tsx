import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Square } from "lucide-react";
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
    | "eastern_upload"
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
  { label: "chatPanel.qa.explain", prompt: "chatPanel.qp.explain" },
  { label: "chatPanel.qa.strengths", prompt: "chatPanel.qp.strengths" },
  { label: "chatPanel.qa.career", prompt: "chatPanel.qp.career" },
  { label: "chatPanel.qa.love", prompt: "chatPanel.qp.love" },
];

const quickActionsByModule: Record<
  Exclude<
    ChatPanelProps["moduleKey"],
    | "eastern"
    | "eastern_upload"
    | "eastern_overview"
    | "eastern_career"
    | "eastern_finance"
    | "eastern_marriage"
    | "eastern_health"
    | "eastern_fortune"
  >,
  Array<{ label: string; prompt: string }>
> = {
  numerology: [
    { label: "chatPanel.module.numerology.qa.explain", prompt: "chatPanel.module.numerology.qp.explain" },
    { label: "chatPanel.module.numerology.qa.strengths", prompt: "chatPanel.module.numerology.qp.strengths" },
    { label: "chatPanel.module.numerology.qa.habits", prompt: "chatPanel.module.numerology.qp.habits" },
    { label: "chatPanel.module.numerology.qa.reflect", prompt: "chatPanel.module.numerology.qp.reflect" },
  ],
  western: [
    { label: "chatPanel.module.western.qa.overview", prompt: "chatPanel.module.western.qp.overview" },
    { label: "chatPanel.module.western.qa.emotion", prompt: "chatPanel.module.western.qp.emotion" },
    { label: "chatPanel.module.western.qa.work", prompt: "chatPanel.module.western.qp.work" },
    { label: "chatPanel.module.western.qa.blindspots", prompt: "chatPanel.module.western.qp.blindspots" },
  ],
  tarot: [
    { label: "chatPanel.module.tarot.qa.clarify", prompt: "chatPanel.module.tarot.qp.clarify" },
    { label: "chatPanel.module.tarot.qa.emotion", prompt: "chatPanel.module.tarot.qp.emotion" },
    { label: "chatPanel.module.tarot.qa.risk", prompt: "chatPanel.module.tarot.qp.risk" },
    { label: "chatPanel.module.tarot.qa.message", prompt: "chatPanel.module.tarot.qp.message" },
  ],
  iching: [
    { label: "chatPanel.module.iching.qa.interpret", prompt: "chatPanel.module.iching.qp.interpret" },
    { label: "chatPanel.module.iching.qa.actions", prompt: "chatPanel.module.iching.qp.actions" },
    { label: "chatPanel.module.iching.qa.avoid", prompt: "chatPanel.module.iching.qp.avoid" },
    { label: "chatPanel.module.iching.qa.questions", prompt: "chatPanel.module.iching.qp.questions" },
  ],
  career: [
    { label: "chatPanel.module.career.qa.goals", prompt: "chatPanel.module.career.qp.goals" },
    { label: "chatPanel.module.career.qa.roadmap", prompt: "chatPanel.module.career.qp.roadmap" },
    { label: "chatPanel.module.career.qa.cv", prompt: "chatPanel.module.career.qp.cv" },
    { label: "chatPanel.module.career.qa.interview", prompt: "chatPanel.module.career.qp.interview" },
  ],
};

const easternQuickActionsByOptionId: Record<string, Array<{ label: string; prompt: string }>> = {
  overview: [
    { label: "chatPanel.eastern.qa.summary", prompt: "chatPanel.eastern.qp.overview.summary" },
    { label: "chatPanel.eastern.qa.strengths", prompt: "chatPanel.eastern.qp.overview.strengths" },
    { label: "chatPanel.eastern.qa.watchouts", prompt: "chatPanel.eastern.qp.overview.watchouts" },
    { label: "chatPanel.eastern.qa.followups", prompt: "chatPanel.eastern.qp.overview.followups" },
  ],
  career: [
    { label: "chatPanel.eastern.career.qa.direction", prompt: "chatPanel.eastern.career.qp.direction" },
    { label: "chatPanel.eastern.career.qa.skills", prompt: "chatPanel.eastern.career.qp.skills" },
    { label: "chatPanel.eastern.career.qa.decisions", prompt: "chatPanel.eastern.career.qp.decisions" },
    { label: "chatPanel.eastern.career.qa.risk", prompt: "chatPanel.eastern.career.qp.risk" },
  ],
  finance: [
    { label: "chatPanel.eastern.finance.qa.system", prompt: "chatPanel.eastern.finance.qp.system" },
    { label: "chatPanel.eastern.finance.qa.bias", prompt: "chatPanel.eastern.finance.qp.bias" },
    { label: "chatPanel.eastern.finance.qa.priority", prompt: "chatPanel.eastern.finance.qp.priority" },
    { label: "chatPanel.eastern.finance.qa.checklist", prompt: "chatPanel.eastern.finance.qp.checklist" },
  ],
  marriage: [
    { label: "chatPanel.eastern.marriage.qa.needs", prompt: "chatPanel.eastern.marriage.qp.needs" },
    { label: "chatPanel.eastern.marriage.qa.conflict", prompt: "chatPanel.eastern.marriage.qp.conflict" },
    { label: "chatPanel.eastern.marriage.qa.criteria", prompt: "chatPanel.eastern.marriage.qp.criteria" },
    { label: "chatPanel.eastern.marriage.qa.questions", prompt: "chatPanel.eastern.marriage.qp.questions" },
  ],
  health: [
    { label: "chatPanel.eastern.health.qa.stress", prompt: "chatPanel.eastern.health.qp.stress" },
    { label: "chatPanel.eastern.health.qa.habits", prompt: "chatPanel.eastern.health.qp.habits" },
    { label: "chatPanel.eastern.health.qa.rhythm", prompt: "chatPanel.eastern.health.qp.rhythm" },
    { label: "chatPanel.eastern.health.qa.doctor", prompt: "chatPanel.eastern.health.qp.doctor" },
  ],
  fortune: [
    { label: "chatPanel.eastern.fortune.qa.theme", prompt: "chatPanel.eastern.fortune.qp.theme" },
    { label: "chatPanel.eastern.fortune.qa.checklist", prompt: "chatPanel.eastern.fortune.qp.checklist" },
    { label: "chatPanel.eastern.fortune.qa.opportunity", prompt: "chatPanel.eastern.fortune.qp.opportunity" },
    { label: "chatPanel.eastern.fortune.qa.risk", prompt: "chatPanel.eastern.fortune.qp.risk" },
  ],
  upload: [
    { label: "chatPanel.eastern.upload.qa.summary", prompt: "chatPanel.eastern.upload.qp.summary" },
    { label: "chatPanel.eastern.upload.qa.career", prompt: "chatPanel.eastern.upload.qp.career" },
    { label: "chatPanel.eastern.upload.qa.love", prompt: "chatPanel.eastern.upload.qp.love" },
    { label: "chatPanel.eastern.upload.qa.palaces", prompt: "chatPanel.eastern.upload.qp.palaces" },
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
          return t("chatPanel.eastern.welcome.career");
        case "finance":
          return t("chatPanel.eastern.welcome.finance");
        case "marriage":
          return t("chatPanel.eastern.welcome.marriage");
        case "health":
          return t("chatPanel.eastern.welcome.health");
        case "fortune":
          return t("chatPanel.eastern.welcome.fortune");
        case "overview":
        case "upload":
        default:
          return contextOptionId === "upload"
            ? t("chatPanel.eastern.welcome.upload")
            : t("chatPanel.eastern.welcome.default");
      }
    }

    return t("chat.welcome");
  }, [contextOptionId, moduleKey, t, welcomeMessage]);

  const resolvedShowQuickActions = useMemo(() => {
    if (typeof showQuickActions === "boolean") return showQuickActions;
    if (moduleKey.startsWith("eastern") && contextOptionId && contextOptionId !== "overview" && contextOptionId !== "upload") return false;
    return true;
  }, [contextOptionId, moduleKey, showQuickActions]);

  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const assistantIndexRef = useRef<number | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);

  const hydratedRef = useRef(false);
  const initKeyRef = useRef<string | null>(null);
  const loadedSessionRef = useRef<string | null>(null);
  const initialPromptSentRef = useRef<string | null>(null);
  const welcomeInitializedRef = useRef(false);

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
    if (messages.length !== 0) return;
    if (welcomeInitializedRef.current) return;
    welcomeInitializedRef.current = true;
    setMessages([{ role: "assistant", content: resolvedWelcome }]);
  }, [resolvedWelcome, messages.length]);

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
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token ?? null;
        const response = await fetch(`${supabaseUrl}/functions/v1/oracle-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
          if (response.status === 402) {
            toast.error(lang === "vi" ? "Bạn đã hết credit. Vui lòng nạp tiền để tiếp tục." : "You are out of credits. Please top up to continue.");
            throw new Error("Insufficient credits");
          }
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

  const transcribeAndSend = useCallback(async () => {
    if (typing || transcribing) return;
    if (!user?.id) {
      toast.error(t("chat.error"));
      return;
    }

    try {
      setTranscribing(true);
      const chunks = recordChunksRef.current;
      if (!chunks || chunks.length === 0) return;

      const blob = new Blob(chunks, { type: "audio/webm" });
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result ?? "");
          const idx = res.indexOf(",");
          resolve(idx >= 0 ? res.slice(idx + 1) : res);
        };
        reader.onerror = () => reject(new Error("Failed to read audio"));
        reader.readAsDataURL(blob);
      });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/oracle-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "speech_to_text",
          lang,
          profile,
          contextJson,
          audio: { data: base64, mimeType: "audio/webm" },
          stream: false,
        }),
      });

      if (!response.ok) throw new Error("STT failed");
      const data = (await response.json()) as { text?: unknown };
      const text = typeof data.text === "string" ? data.text.trim() : "";
      if (!text) {
        toast.error(t("chat.error"));
        return;
      }

      void sendMessage(text);
    } catch (err) {
      console.error("Voice STT error:", err);
      toast.error(t("chat.error"));
    } finally {
      setTranscribing(false);
      recordChunksRef.current = [];
    }
  }, [contextJson, lang, profile, sendMessage, t, transcribing, typing, user?.id]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    
    try {
      recorder.stop();
    } catch (err) {
      console.error("Error stopping recorder:", err);
    }
    
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (recording || transcribing) return;
    try {
      // Clean up any existing recorder
      if (recorderRef.current) {
        if (recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
        recorderRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      // Check for supported MIME types
      let mimeType = "audio/webm";
      const types = ["audio/webm", "audio/ogg", "audio/mp4", "audio/wav"];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      recordChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        try {
          // Stop all tracks to release the microphone
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (err) {
              console.warn("Failed to stop track:", err);
            }
          });
        } catch (err) {
          console.warn("Failed to stop tracks:", err);
        }
        
        // Only transcribe if we actually have audio data
        if (recordChunksRef.current.length > 0) {
          void transcribeAndSend();
        } else {
          setRecording(false);
          toast.error(t("chat.noAudio"));
        }
      };
      
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setRecording(false);
        toast.error(t("chat.error"));
        // Clean up stream on error
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (err) {
            console.warn("Failed to stop track on error:", err);
          }
        });
      };

      recorderRef.current = recorder;
      recorder.start(100); // Collect data every 100ms
      setRecording(true);
      
      // Add a timeout to prevent infinite recording
      setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === "recording") {
          console.warn("Recording timeout - stopping automatically");
          stopRecording();
        }
      }, 30000); // 30 second max recording
      
    } catch (err) {
      console.error("Mic permission error:", err);
      setRecording(false);
      if (err instanceof Error && err.name === "NotAllowedError") {
        toast.error(t("chat.micPermission"));
      } else if (err instanceof Error && err.name === "NotFoundError") {
        toast.error(t("chat.micNotFound"));
      } else {
        toast.error(t("chat.error"));
      }
    }
  }, [recording, t, transcribeAndSend, transcribing, stopRecording]);

  useEffect(() => {
    if (!initialPrompt) return;
    if (initialPromptSentRef.current === initialPrompt) return;
    initialPromptSentRef.current = initialPrompt;
    setInput(initialPrompt);
    void sendMessage(initialPrompt);
  }, [initialPrompt, sendMessage]);

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
                  <span className="flex justify-center gap-2 py-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></span>
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
                  const prompt = t(action.prompt);
                  setInput(prompt);
                  void sendMessage(prompt);
                }}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/30"
              >
                {t(action.label)}
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
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={typing || transcribing}
          onClick={() => {
            try {
              if (recording) {
                stopRecording();
              } else {
                void startRecording();
              }
            } catch (err) {
              console.error("Voice button click error:", err);
            }
          }}
          title={recording ? "Stop" : "Voice"}
        >
          {recording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        <Button type="submit" size="icon" disabled={typing || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;
