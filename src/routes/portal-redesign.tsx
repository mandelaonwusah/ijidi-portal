import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Send, X, ChevronRight, Mic, Paperclip, Plus, Settings as SettingsIcon, 
  Building2, Map, Command, Shield, Lock, FileText, Home, Menu, ChevronDown,
} from "lucide-react";

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

const ENTITIES = [
  { id: "group", name: "IJIDI Group", short: "GRP", desc: "Corporate & holding", color: C.indigo, icon: "◆", badge: "live" },
  { id: "foundation", name: "IJIDI Foundation", short: "FND", desc: "Philanthropic arm", color: C.terracotta, icon: "◇", badge: "forming" },
  { id: "atelier", name: "IJIDI Atelier", short: "ATL", desc: "Luxury fashion", color: C.gold, icon: "▲", badge: "building" },
  { id: "media", name: "IJIDI Media", short: "MED", desc: "Content studio", color: C.slate, icon: "▶", badge: "open" },
];

function Ticker({ items = [] }) {
  const tickerItems = [
    "SUPABASE WIRED ·",
    "Entity status live ·",
    "Decisions tracked ·",
    "Activity logged ·",
    "Portal operational ·",
  ];
  
  const displayItems = items.length > 0 ? items : tickerItems;

  return (
    <div style={{
      background: `linear-gradient(90deg, ${C.charcoal}, ${C.ink})`,
      borderBottom: `2px solid ${C.gold}`,
      overflow: "hidden",
      padding: "8px 0",
    }}>
      <div style={{
        display: "flex",
        animation: "ticker 20s linear infinite",
        whiteSpace: "nowrap",
        fontSize: "11px",
        letterSpacing: "0.08em",
        color: C.textSecondary,
      }}>
        {[...displayItems, ...displayItems].map((item, i) => (
          <span key={i} style={{ marginRight: 32, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: C.gold, fontSize: "8px" }}>◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function EntityCard({ entity, onClick }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      onClick={onClick}
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
          {entity.icon}
        </div>
        <span style={{
          fontSize: "9px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: entity.color,
          background: `${entity.color}11`,
          padding: "4px 10px",
          borderRadius: 6,
          border: `1px solid ${entity.color}33`,
        }}>
          {entity.badge}
        </span>
      </div>
      
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
        {entity.name}
      </div>
      <div style={{ fontSize: "12px", color: C.textSecondary, marginBottom: 12 }}>
        {entity.desc}
      </div>
      
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "11px",
        color: entity.color,
        opacity: hovered ? 1 : 0.6,
        transition: "opacity 0.3s",
      }}>
        View details <ChevronRight size={12} />
      </div>
    </div>
  );
}

function IGXAIPanel({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Portal connection established. Ready to assist." },
  ]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { role: "user", text: input }]);
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${C.gold}44`,
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
            display: "flex",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px 0",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: "0 12px",
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "10px 12px",
                borderRadius: 12,
                background: msg.role === "user" ? C.indigo : C.panel,
                border: `1px solid ${msg.role === "user" ? C.indigoBright : C.border}`,
                fontSize: "12px",
                lineHeight: 1.5,
                color: C.textPrimary,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      {/* Input area */}
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
          <button style={{
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
          }} onClick={handleSend}>
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

export default function PortalRedesign() {
  const [chatOpen, setChatOpen] = useState(false);
  const [expandedEntity, setExpandedEntity] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.ink,
      color: C.textPrimary,
      fontFamily: "'Karla', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Karla:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.gold}33; border-radius: 4px; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Ticker */}
      <Ticker />

      <div style={{ display: "flex", minHeight: "calc(100vh - 50px)" }}>
        {/* Sidebar */}
        <div style={{
          width: 240,
          borderRight: `1px solid ${C.border}`,
          padding: "24px 0",
          background: `linear-gradient(180deg, ${C.charcoal}, ${C.ink})`,
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Branding */}
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
              lineHeight: 1.2,
            }}>
              Portal
            </div>
          </div>

          {/* Profile Section */}
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
              marginBottom: 8,
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
                <div style={{ fontSize: "10px", color: C.textSecondary }}>Root Access</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ padding: "0 12px", flex: 1 }}>
            {[
              { label: "Command", icon: Command },
              { label: "Ecosystem", icon: Building2 },
              { label: "IGX AI", icon: Sparkles },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                  marginBottom: 6,
                  color: C.textSecondary,
                  fontSize: "12px",
                  transition: "all 0.2s",
                }}
              >
                {React.createElement(item.icon, { size: 14 })}
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 32, animation: "fadeIn 0.4s ease" }}>
            <div style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.gold,
              marginBottom: 8,
            }}>
              Operational Overview
            </div>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 32,
              fontWeight: 400,
              marginBottom: 6,
            }}>
              Command Center
            </div>
            <div style={{ fontSize: "14px", color: C.textSecondary }}>
              Single-governor ecosystem coordination
            </div>
          </div>

          {/* Entity Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}>
            {ENTITIES.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onClick={() => setExpandedEntity(expandedEntity === entity.id ? null : entity.id)}
              />
            ))}
          </div>

          {/* Stats Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}>
            {[
              { label: "System Status", value: "Operational", color: C.indigo },
              { label: "Entities Active", value: "4/5", color: C.terracotta },
              { label: "Supabase", value: "Connected", color: C.gold },
            ].map((stat, i) => (
              <div
                key={i}
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
            borderRadius: 28,
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
          onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* IGX AI Panel */}
      <IGXAIPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
