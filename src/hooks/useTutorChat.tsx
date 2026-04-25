import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Msg, Conv } from "@/components/tutor/types";
import type { User } from "@supabase/supabase-js";
import { useGamification } from "@/hooks/useGamification";
import { XP_PER_QUESTION } from "@/lib/levels";

export function useTutorChat(user: User | null) {
  const { awardXp } = useGamification();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });
      if (error) { console.error(error); return; }
      setConvs(data ?? []);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      if (error) { console.error(error); return; }
      setMessages((data ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    })();
  }, [activeId]);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
  };

  const deleteConv = async (id: string) => {
    if (!confirm("Supprimer cette discussion ?")) return;
    await supabase.from("messages").delete().eq("conversation_id", id);
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) { toast.error("Suppression échouée"); return; }
    setConvs((p) => p.filter((c) => c.id !== id));
    if (activeId === id) newChat();
    toast.success("Supprimée");
  };

  const renameConv = async (id: string) => {
    const { data: msgs, error } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(4);
    if (error || !msgs || msgs.length === 0) {
      toast.error("Pas assez de messages pour générer un titre");
      return;
    }
    const tid = toast.loading("Génération du titre...");
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "title",
          messages: msgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!r.ok) throw new Error("title failed");
      const { title } = await r.json();
      if (!title) throw new Error("empty title");
      await supabase.from("conversations").update({ title }).eq("id", id);
      setConvs((p) => p.map((c) => (c.id === id ? { ...c, title } : c)));
      toast.success("Titre mis à jour", { id: tid });
    } catch (e) {
      console.error(e);
      toast.error("Échec du renommage", { id: tid });
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || streaming || !user) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setStreaming(true);

    let convId = activeId;
    if (!convId) {
      const title = text.slice(0, 60);
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select("id, title, created_at")
        .single();
      if (error || !data) {
        console.error(error);
        toast.error("Impossible de créer la discussion");
        setStreaming(false);
        return;
      }
      convId = data.id;
      setActiveId(convId);
      setConvs((p) => [data, ...p]);
    }

    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: text,
    });

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((p) => {
        const last = p[p.length - 1];
        if (last?.role === "assistant") return p.map((m, i) => (i === p.length - 1 ? { ...m, content: acc } : m));
        return [...p, { role: "assistant", content: acc }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (resp.status === 429) { toast.error("Trop de requêtes, réessaie dans un instant."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("Crédits IA épuisés."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Erreur réseau");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      if (acc.trim()) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: acc,
        });
        awardXp(XP_PER_QUESTION);

        if (messages.length === 0) {
          try {
            const r = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                mode: "title",
                messages: [
                  { role: "user", content: text },
                  { role: "assistant", content: acc },
                ],
              }),
            });
            if (r.ok) {
              const { title } = await r.json();
              if (title && convId) {
                await supabase.from("conversations").update({ title }).eq("id", convId);
                setConvs((p) => p.map((c) => (c.id === convId ? { ...c, title } : c)));
              }
            }
          } catch (err) {
            console.error("auto-title failed", err);
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la réponse IA");
    } finally {
      setStreaming(false);
    }
  };

  return {
    convs,
    activeId,
    setActiveId,
    messages,
    streaming,
    newChat,
    deleteConv,
    renameConv,
    send,
  };
}
