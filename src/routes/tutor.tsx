import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useTutorChat } from "@/hooks/useTutorChat";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { MessageList } from "@/components/tutor/MessageList";
import { ChatInput } from "@/components/tutor/ChatInput";

export default function TutorPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    convs, activeId, setActiveId, messages, streaming,
    newChat: resetChat, deleteConv, renameConv, send,
  } = useTutorChat(user);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const newChat = () => { resetChat(); setSidebarOpen(false); };

  const handleSend = async (text: string) => {
    setInput("");
    await send(text);
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Chargement...</div>;

  return (
    <>
      <Helmet>
        <title>Tuteur IA — Student Helper</title>
        <meta name="description" content="Pose tes questions de maths, physique et chimie à ton coach IA." />
      </Helmet>
      <div className="min-h-screen flex bg-gradient-soft">
        <TutorSidebar
          convs={convs}
          activeId={activeId}
          search={search}
          setSearch={setSearch}
          onSelect={(id) => { setActiveId(id); setSidebarOpen(false); }}
          onDelete={deleteConv}
          onRename={renameConv}
          onNewChat={newChat}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden border-b bg-card/70 backdrop-blur sticky top-0 z-10">
            <div className="px-4 h-16 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>☰</Button>
              <Logo />
              <Button variant="ghost" size="sm" onClick={newChat}>{"+"}</Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 max-w-3xl w-full mx-auto flex flex-col">
            <MessageList ref={scrollRef} messages={messages} streaming={streaming} onSuggestion={handleSend} />
            <ChatInput value={input} onChange={setInput} onSubmit={() => handleSend(input)} disabled={streaming} />
          </main>
        </div>
      </div>
    </>
  );
}
