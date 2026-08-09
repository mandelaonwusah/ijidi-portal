import React, { useState } from "react";
import { Sparkles, Send, X, ChevronRight, Mic, Paperclip } from "lucide-react";

const colors = {
  ink: "#08090c",
  charcoal: "#14161c",
  panel: "#1a1d24",
  border: "rgba(212,175,55,0.2)",
  gold: "#D4AF37",
  goldDim: "#a9822a",
  indigo: "#1A1F4D",
  terracotta: "#C65A3A",
  bone: "#F5F2EB",
  slate: "#7a7f9b",
  textPrimary: "#e8e6df",
  textSecondary: "#a8aab8",
};

export default function PortalRedesign() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Portal connection established. Ready to assist." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
  };

  const entities = [
    { name: "IJIDI Group", short: "GRP", color: colors.indigo, badge: "live" },
    { name: "IJIDI Foundation", short: "FND", color: colors.terracotta, badge: "forming" },
    { name: "IJIDI Atelier", short: "ATL", color: colors.gold, badge: "building" },
    { name: "IJIDI Media", short: "MED", color: colors.slate, badge: "open" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.ink,
        color: colors.textPrimary,
        fontFamily: "'Karla', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500&family=Karla:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {/* Ticker Bar */}
      <div
        style={{
          background: `linear-gradient(90deg, ${colors.charcoal}, ${colors.ink})`,
          borderBottom: `2px solid ${colors.gold}`,
          overflow: "hidden",
          padding: "8px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            animation: "ticker 20s linear infinite",
            whiteSpace: "nowrap",
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: colors.textSecondary,
          }}
        >
          {["SUPABASE WIRED", "Entity status live", "Decisions tracked", "Portal operational"].map((item, i) => (
            <span key={i} style={{ marginRight: 32 }}>
              <span style={{ color: colors.gold }}>◆</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 240,
            borderRight: `1px solid ${colors.border}`,
            padding: "24px 0",
            background: `linear-gradient(180deg, ${colors.charcoal}, ${colors.ink})`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "0 20px", marginBottom: 32 }}>
            <div
              style={{
                fontSize: "12px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: colors.gold,
                marginBottom: 4,
              }}
            >
              IJIDI
            </div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              Portal
            </div>
          </div>

          <div
            style={{
              padding: "16px 20px",
              marginBottom: 24,
              background: `${colors.gold}08`,
              borderLeft: `3px solid ${colors.gold}`,
              borderRadius: "0 12px 12px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: colors.panel,
                  border: `1.5px solid ${colors.gold}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Fraunces', serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.gold,
                }}
              >
                MO
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>Mandela</div>
                <div style={{ fontSize: "10px", color: colors.textSecondary }}>Root Access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: colors.gold,
                marginBottom: 8,
              }}
            >
              Operational Overview
            </div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 32,
                fontWeight: 400,
                marginBottom: 6,
              }}
            >
              Command Center
            </div>
            <div style={{ fontSize: "14px", color: colors.textSecondary }}>
              Single-governor ecosystem coordination
            </div>
          </div>

          {/* Entity Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 40,
            }}
          >
            {entities.map((entity) => (
              <div
                key={entity.name}
                style={{
                  background: `linear-gradient(135deg, ${colors.panel}, ${colors.charcoal})`,
                  border: `2px solid ${entity.color}22`,
                  borderRadius: 20,
                  padding: "20px 24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div
                    style={{
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
                    }}
                  >
                    ◆
                  </div>
                  <span
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: entity.color,
                      background: `${entity.color}11`,
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${entity.color}33`,
                    }}
                  >
                    {entity.badge}
                  </span>
                </div>

                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                  {entity.name}
                </div>
                <div style={{ fontSize: "12px", color: colors.textSecondary }}>Entity details</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {[
              { label: "System Status", value: "Operational", color: colors.indigo },
              { label: "Entities Active", value: "4/5", color: colors.terracotta },
              { label: "Supabase", value: "Connected", color: colors.gold },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: `linear-gradient(135deg, ${colors.panel}, ${colors.charcoal})`,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: 8 }}>
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 20,
                    fontWeight: 500,
                    color: stat.color,
                  }}
                >
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
            background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})`,
            border: "none",
            color: colors.ink,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 32px ${colors.gold}44`,
            transition: "all 0.3s ease",
            zIndex: 999,
          }}
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* IGX AI Panel */}
      {chatOpen && (
        <div
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            height: "100vh",
            width: 380,
            background: `linear-gradient(180deg, ${colors.charcoal}, ${colors.ink})`,
            borderLeft: `2px solid ${colors.gold}44`,
            display: "flex",
            flexDirection: "column",
            animation: "slideIn 0.3s ease",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={14} color={colors.gold} />
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 500 }}>IGX AI</div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: colors.textSecondary,
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
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
                    background: msg.role === "user" ? colors.indigo : colors.panel,
                    border: `1px solid ${msg.role === "user" ? "rgba(56,67,168,0.5)" : colors.border}`,
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Message IGX AI…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                style={{
                  flex: 1,
                  background: colors.panel,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  color: colors.textPrimary,
                  fontSize: "12px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleSend}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: colors.gold,
                  border: "none",
                  color: colors.ink,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={14} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  background: `${colors.gold}11`,
                  border: `1px solid ${colors.gold}44`,
                  borderRadius: 10,
                  padding: "8px",
                  color: colors.gold,
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Mic size={12} /> Voice
              </button>
              <button
                style={{
                  flex: 1,
                  background: `${colors.gold}11`,
                  border: `1px solid ${colors.gold}44`,
                  borderRadius: 10,
                  padding: "8px",
                  color: colors.gold,
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Paperclip size={12} /> File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
