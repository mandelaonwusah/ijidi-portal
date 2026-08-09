import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, ChevronRight, Cpu, Send, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeader, Signal, StatusBadge } from "@/components/portal-ui";
export const Route = createFileRoute("/igx-ai")({
  head: () => ({
    meta: [
      { title: "IGX AI · Intelligence Console" },
      {
        name: "description",
        content: "IGX AI intelligence console for grounded IJIDI Portal operations.",
      },
      { property: "og:title", content: "IGX AI · Intelligence Console" },
      { property: "og:description", content: "Grounded IGX AI intelligence console." },
    ],
  }),
  component: IgxAi,
});
type Message = { role: "system" | "operator"; text: string };
function IgxAi() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      text: "IGX AI console initialized. Grounding layer online. No external intelligence sources connected.",
    },
    {
      role: "system",
      text: "I can help structure decisions, inspect portal records, and identify what is not yet tracked.",
    },
  ]);
  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { role: "operator", text: trimmed },
      {
        role: "system",
        text: "Acknowledged. This local prototype is ready for a governed AI connection; no action was taken.",
      },
    ]);
    setInput("");
  };
  return (
    <div>
      <SectionHeader
        eyebrow="06 / IGX AI"
        title="Intelligence, grounded."
        detail="A terminal-style console for thinking with the portal without inventing certainty."
        action={<Signal>Local console / ready</Signal>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <section className="panel-bracket scanline overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-panel-elevated px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border border-teal/40 bg-teal/10">
                <Terminal className="h-4 w-4 text-teal" />
              </div>
              <div>
                <Eyebrow className="text-teal">IGX AI / terminal</Eyebrow>
                <div className="mt-1 font-mono text-xs text-foreground">
                  intelligence://local-session
                </div>
              </div>
            </div>
            <StatusBadge status="ready" label="READY" />
          </div>
          <div className="min-h-[390px] space-y-5 p-5 font-mono text-xs leading-6">
            <div className="flex gap-3 text-muted-foreground">
              <span className="text-teal">00:00:01</span>
              <span>session handshake complete</span>
            </div>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "operator"
                    ? "ml-4 border-l border-gold/50 pl-4 text-gold"
                    : "flex gap-3 text-foreground"
                }
              >
                {message.role === "system" && (
                  <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-teal" />
                )}
                <span>
                  {message.role === "operator" && (
                    <span className="mr-2 text-muted-foreground">operator &gt;</span>
                  )}
                  {message.text}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-teal">igx://</span>
              <span className="h-4 w-1 animate-pulse bg-gold" />
            </div>
          </div>
          <div className="flex gap-2 border-t border-border bg-panel-elevated p-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              placeholder="Ask IGX AI to inspect the current state..."
              className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button size="icon" onClick={submit} aria-label="Send prompt">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="panel-bracket p-7">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-gold" />
              <Eyebrow>Capabilities</Eyebrow>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Decision structuring",
                "Portal inspection",
                "Risk surfacing",
                "Grounded summaries",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="border border-gold/20 bg-gold/5 p-5">
            <Bot className="h-5 w-5 text-gold" />
            <Eyebrow className="mt-5 text-gold">Connection state</Eyebrow>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Local interface only. Connect a governed intelligence provider when ready.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
