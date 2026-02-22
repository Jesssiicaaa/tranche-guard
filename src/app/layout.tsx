"use client";
import { useState, createContext, useContext } from "react";
import "./globals.css";
import type { Role } from "@/types";

export const RoleContext = createContext<{
  role: Role;
  setRole: (r: Role) => void;
}>({ role: "Donor", setRole: () => {} });

export function useRole() {
  return useContext(RoleContext);
}

const ROLE_COLORS: Record<Role, string> = {
  Donor: "#2563eb",
  Contractor: "#16a34a",
  Auditor: "#9333ea",
};

const ROLE_ICONS: Record<Role, string> = {
  Donor: "💼",
  Contractor: "🔨",
  Auditor: "🔍",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("Donor");

  return (
    <html lang="en">
      <head>
        <title>TrancheGuard — Milestone Release Platform</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RoleContext.Provider value={{ role, setRole }}>
          <header className="app-header">
            <a href="/app" className="header-brand">
              <span className="brand-mark">▣</span>
              <span className="brand-name">TrancheGuard</span>
            </a>
            <div className="role-switcher">
              <span className="role-label">Viewing as:</span>
              {(["Donor", "Contractor", "Auditor"] as Role[]).map((r) => (
                <button
                  key={r}
                  className={`role-btn ${role === r ? "active" : ""}`}
                  style={role === r ? { background: ROLE_COLORS[r], color: "#fff", borderColor: ROLE_COLORS[r] } : {}}
                  onClick={() => setRole(r)}
                >
                  {ROLE_ICONS[r]} {r}
                </button>
              ))}
            </div>
          </header>
          <main>{children}</main>
        </RoleContext.Provider>
      </body>
    </html>
  );
}
