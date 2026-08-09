import React, { useState, useEffect } from "react";
import { Sparkles, Send, X, Mic, Paperclip, ChevronRight, ExternalLink } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const C = {
  ink: "#08090c",
  charcoal: "#14161c",
  panel: "#1a1d24",
  border: "rgba(212,175,55,0.2)",
  gold: "#D4AF37",
  goldDim: "#a9822a",
  indigo: "#1A1F4D",
  indigoBright: "#3843a8",
  terracotta: "#C65A3A",
  bone: "#F5F2EB",
  slate: "#7a7f9b",
  textPrimary: "#e8e6df",
  textSecondary: "#a8aab8",
};

const ENTITY_DATA = [
  { id: "group", name: "IJIDI Group", short: "GRP", color: C.indigo, url: "https://www.ijidigroup.com", desc: "Professional services & holding" },
  { id: "foundation", name: "IJIDI Foundation", short: "FND", color: C.terracotta, url: "https://www.ijidi.org", desc: "Philanthropic impact registry" },
  { id: "atelier", name: "IJIDI Atelier", short: "ATL", color: C.gold, url: "#", desc: "Luxury fashion house" },
  { id: "media", name: "IJIDI Media", short: "MED", color: C.slate, url: "#", desc: "AI-generated content studio" },
  { id: "personal", name: "Mandela Onwusah", short: "MO", color: C.bone, url: "https://www.mandelaonwusah.com", desc: "Root node · Founder" },
];

function Ticker({ items }) {
  return (
    <div style={{
      background: `linear-gradient(90deg, ${C.charcoal}, ${C.ink})`,
      borderBottom: `2px solid ${C.gold}`,
      overflow: "hidden",
      padding: "8px 0",
    }}>
      <div style={{
        display: "flex",
        animation: "ticker 25s linear infinite",
        whiteSpace: "nowrap",
        fontSize: "11px",
        letterSpacing: "0.08em",
        color: C.textSecondary,
      }}>
        {[...(items || []), ...(items || [])].map((item, i) => (
          <span key={i} style={{ marginRight: 40 }}>
            <span style={{ color: C.gold }}>◆</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function EntityCard({ entity, onWebsiteClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(135deg, ${C.panel}, ${C.charcoal})`,
        border: `2px solid ${entity.color}${hovered ? "44" : "22"}`,
        borderRadius: 20,
        padding: "20px 24px",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 32px ${entity.color}11` : "0 4px 12px rgba(0,0,0,0.3)",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${entity.color}11`,
          border: `1.5px solid ${entity.color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: entity.color,
        }}>
          ◆
        </div>
        {entity.url && entity.url !== "#" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(entity.url, "_blank");
            }}
            style={{
              background: "none",
              border: "none",
              color: entity.color,
              cursor: "pointer",
              padding: 4,
              display: "flex",
              opacity: hovered ? 1 : 0.6,
              transition: "opacity 0.2s",
            }}
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>

      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
        {entity.name}
      </div>
      <div style={{ fontSize: "12px", color: C.textSecondary, marginBottom: 12 }}>
        {entity.desc}
      </div>

      {entity.url && entity.url !== "#" && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "11px",
          color: entity.color,
          opacity: hovered ? 1 : 0.6,
          transition: "opacity 0.3s",
        }}>
          Visit <ChevronRight size={12} />
        </div>
      )}
    </div>
  );
}

function IGXAIPanel({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Portal connection established. Ready to assist with ecosystem coordination." },
  ]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", text: input }]);
    setInput("");
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: 0,
      height: "100vh",
      width: 380,
      background: `linear-gradient(180deg, ${C.charcoal}, ${C.ink})`,
      borderLeft: `2px solid ${C.gold}44`,
      display: "flex",
      flexDirection: "column",
      animation: "slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      zIndex: 1000,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${C.gold}22`,
            border: `1px solid ${C.gold}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Sparkles size={14} color={C.gold} />
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 500 }}>IGX AI</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: C.textSecondary,
            cursor: "pointer",
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "10px 12px",
                borderRadius: 12,
                background: msg.role === "user" ? C.indigoBright : C.panel,
                border: `1px solid ${msg.role === "user" ? "rgba(56,67,168,0.5)" : C.border}`,
                fontSize: "12px",
                lineHeight: 1.5,
                color: C.textPrimary,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {selectedFile && (
          <div style={{
            fontSize: "11px",
            color: C.textSecondary,
            background: C.panel,
            padding: "8px 10px",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            📎 {selectedFile}
            <X size={12} style={{ cursor: "pointer" }} onClick={() => setSelectedFile(null)} />
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Message IGX AI…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            style={{
              flex: 1,
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "10px 12px",
              color: C.textPrimary,
              fontSize: "12px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
          <button
            onClick={handleSend}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: C.gold,
              border: "none",
              color: C.ink,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <Send size={14} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            flex: 1,
            background: `${C.gold}11`,
            border: `1px solid ${C.gold}44`,
            borderRadius: 10,
            padding: "8px",
            color: C.gold,
            fontSize: "11px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.2s",
          }}>
            <Mic size={12} /> Voice
          </button>
          <button
            onClick={() => setSelectedFile("document.pdf")}
            style={{
              flex: 1,
              background: `${C.gold}11`,
              border: `1px solid ${C.gold}44`,
              borderRadius: 10,
              padding: "8px",
              color: C.gold,
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            <Paperclip size={12} /> File
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortalComplete() {
  const [chatOpen, setChatOpen] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const [entities, setEntities] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [decisionsRes, entitiesRes, activityRes] = await Promise.all([
          supabase.from("decisions").select("*").order("date", { ascending: false }).limit(5),
          supabase.from("entity_status").select("*"),
          supabase.from("activity_log").select("*").order("timestamp", { ascending: false }).limit(10),
        ]);

        setDecisions(decisionsRes.data || []);
        setEntities(entitiesRes.data || []);
        setActivity(activityRes.data || []);
      } catch (error) {
        console.error("Data fetch error:", error);
      }
    };

    fetchData();
  }, []);

  const tickerItems = activity.length > 0
    ? activity.slice(0, 5).map((a) => `${a.actor} · ${a.action}`)
    : ["PORTAL LIVE", "SUPABASE CONNECTED", "REAL DATA FLOWING", "IGX AI READY"];

  return (
    <div style={{
      minHeight: "100vh",
      background: C.ink,
      color: C.textPrimary,
      fontFamily: "'Karla', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500&family=Karla:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {/* Ticker */}
      <Ticker items={tickerItems} />

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: 240,
          borderRight: `1px solid ${C.border}`,
          padding: "24px 0",
          background: `linear-gradient(180deg, ${C.charcoal}, ${C.ink})`,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "0 20px", marginBottom: 32 }}>
            <div style={{
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.gold,
              marginBottom: 4,
            }}>
              IJIDI
            </div>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 18,
              fontWeight: 500,
            }}>
              Portal
            </div>
          </div>

          <div style={{
            padding: "16px 20px",
            marginBottom: 24,
            background: `${C.gold}08`,
            borderLeft: `3px solid ${C.gold}`,
            borderRadius: "0 12px 12px 0",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.panel,
                border: `1.5px solid ${C.gold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Fraunces', serif",
                fontSize: 12,
                fontWeight: 600,
                color: C.gold,
              }}>
                MO
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>Mandela</div>
                <div style={{ fontSize: "10px", color: C.textSecondary }}>@mandelaonwusah1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.gold,
              marginBottom: 8,
            }}>
              Ecosystem Command
            </div>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 32,
              fontWeight: 400,
              marginBottom: 6,
            }}>
              IJIDI Portal
            </div>
            <div style={{ fontSize: "14px", color: C.textSecondary }}>
              Real-time governance · Single-governor model
            </div>
          </div>

          {/* Entity Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}>
            {ENTITY_DATA.map((entity) => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}>
            {[
              { label: "Decisions", value: decisions.length || "—", color: C.gold },
              { label: "Activity Log", value: activity.length || "—", color: C.indigo },
              { label: "System Status", value: "Operational", color: C.terracotta },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: `linear-gradient(135deg, ${C.panel}, ${C.charcoal})`,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "11px", color: C.textSecondary, marginBottom: 8 }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 20,
                  fontWeight: 500,
                  color: stat.color,
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IGX AI Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
            border: "none",
            color: C.ink,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 32px ${C.gold}44`,
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            zIndex: 999,
          }}
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* IGX AI Panel */}
      <IGXAIPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
