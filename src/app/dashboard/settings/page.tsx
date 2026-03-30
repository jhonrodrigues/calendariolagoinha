"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useSession, signIn } from "next-auth/react";
import { Save, Image as ImageIcon, LayoutTemplate, Palette, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdminMaster = user?.role === "ADMIN_MASTER";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean, email?: string | null }>({ connected: false });
  
  const [settings, setSettings] = useState({
    siteTitle: "Calendário de Eventos",
    primaryColor: "#1e3a8a",
    accentColor: "#f59e0b",
    siteLogo: "",
    pdfTitle: "A G E N D A",
    pdfSubtitle: "Igreja Batista Lagoinha",
    pdfLogo: "",
    pdfTitleAlign: "center"
  });

  useEffect(() => {
    if (user) {
      // Fetch platform settings (only for admin view, but useful for context)
      fetch("/api/settings").then(r => r.json()).then(data => {
        if (data) setSettings(data);
      });

      // Fetch Google connection status
      fetch("/api/auth/google/status")
        .then(r => r.json())
        .then(data => setGoogleStatus(data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleBase64Upload = (e: React.ChangeEvent<HTMLInputElement>, field: "siteLogo" | "pdfLogo") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (resp.ok) {
        alert("Configurações salvas com sucesso!");
      } else {
        alert("Erro ao salvar configurações.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  const connectGoogle = () => {
    signIn("google", { callbackUrl: "/dashboard/settings" });
  };

  if (loading) return <div className="p-8">Carregando configurações...</div>;

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>Gerencie sua conta e as preferências da plataforma</p>
        </div>
        {isAdminMaster && (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={20} />
            <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
          </button>
        )}
      </header>

      <div style={{ display: "grid", gridTemplateColumns: isAdminMaster ? "1fr 1fr" : "1fr", gap: "2rem", marginTop: "2rem" }}>
        
        {/* ---- GOOGLE CALENDAR SYNC (ALL USERS) ---- */}
        <div className="premium-card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <CalendarIcon size={20} color="var(--accent)" /> Sincronização com Google Calendar
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--secondary)", marginBottom: "1.5rem" }}>
            Conecte sua agenda do Google para que os novos eventos do sistema sejam criados automaticamente no seu calendário pessoal.
          </p>

          {googleStatus.connected ? (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "1rem" }}>
              <CheckCircle2 size={24} color="#16a34a" />
              <div>
                <p style={{ fontWeight: "bold", color: "#166534", margin: 0 }}>Conectado!</p>
                <p style={{ fontSize: "0.85rem", color: "#166534", margin: 0 }}>
                  Os eventos serão sincronizados com sua conta Google.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "12px", textAlign: "center" }}>
              <button 
                className="btn btn-outline" 
                style={{ width: "100%", justifyContent: "center", gap: "0.75rem", padding: "0.75rem" }}
                onClick={connectGoogle}
              >
                <img src="https://authjs.dev/img/providers/google.svg" width={20} height={20} alt="Google" />
                <span>Conectar com Google Calendar</span>
              </button>
              <p style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: "1rem" }}>
                <AlertCircle size={12} style={{ display: "inline", marginRight: "4px" }} />
                Você precisará autorizar o acesso à sua agenda na próxima tela.
              </p>
            </div>
          )}
        </div>

        {/* ---- ADMIN BRANDING (ONLY ADMIN_MASTER) ---- */}
        {isAdminMaster && (
          <>
            <div className="premium-card">
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <Palette size={20} color="var(--accent)" /> Cores e Tema do Site
              </h2>
              
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Título Global da Plataforma</label>
                <input className="input" value={settings.siteTitle} onChange={e => setSettings({...settings, siteTitle: e.target.value})} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label>Cor Primária</label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} style={{ width: "40px", height: "40px", padding: 0, border: "none", borderRadius: "8px", cursor: "pointer", background: "transparent" }} />
                    <code style={{ fontSize: "0.85rem", background: "#f1f5f9", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>{settings.primaryColor}</code>
                  </div>
                </div>
                <div className="form-group">
                  <label>Cor de Destaque (Accent)</label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input type="color" value={settings.accentColor} onChange={e => setSettings({...settings, accentColor: e.target.value})} style={{ width: "40px", height: "40px", padding: 0, border: "none", borderRadius: "8px", cursor: "pointer", background: "transparent" }} />
                    <code style={{ fontSize: "0.85rem", background: "#f1f5f9", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>{settings.accentColor}</code>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Logo do Menu Principal</label>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem" }}>
                  {settings.siteLogo ? (
                    <div style={{ position: "relative", width: "120px", height: "auto", background: "#f1f5f9", padding: "0.5rem", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                      <img src={settings.siteLogo} alt="Logo" style={{ width: "100%", maxHeight: "60px", objectFit: "contain" }} />
                      <button onClick={() => setSettings({...settings, siteLogo: ""})} style={{ position: "absolute", top: -8, right: -8, background: "red", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", justifyContent: "center", alignItems: "center", border: "none", cursor: "pointer", fontSize: "12px" }}>X</button>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                       <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", border: "2px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc", cursor: "pointer", color: "var(--secondary)" }}>
                         <ImageIcon size={24} style={{ marginBottom: "0.5rem" }} />
                         <span style={{ fontSize: "0.875rem" }}>Upload Logo (Max 2MB)</span>
                         <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleBase64Upload(e, "siteLogo")} />
                       </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="premium-card">
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <LayoutTemplate size={20} color="var(--accent)" /> Ajustes de PDF
              </h2>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Título Master</label>
                <input className="input" value={settings.pdfTitle} onChange={e => setSettings({...settings, pdfTitle: e.target.value})} />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Subtítulo</label>
                <input className="input" value={settings.pdfSubtitle} onChange={e => setSettings({...settings, pdfSubtitle: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Logo PDF</label>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem" }}>
                  {settings.pdfLogo ? (
                    <div style={{ position: "relative", width: "120px", height: "auto", background: "white", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                      <img src={settings.pdfLogo} alt="Logo do PDF" style={{ width: "100%", maxHeight: "60px", objectFit: "contain" }} />
                      <button onClick={() => setSettings({...settings, pdfLogo: ""})} style={{ position: "absolute", top: -8, right: -8, background: "red", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", justifyContent: "center", alignItems: "center", border: "none", cursor: "pointer", fontSize: "12px" }}>X</button>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                       <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", border: "2px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc", cursor: "pointer", color: "var(--secondary)" }}>
                         <ImageIcon size={24} style={{ marginBottom: "0.5rem" }} />
                         <span style={{ fontSize: "0.875rem" }}>Logo para impressão (Max 2MB)</span>
                         <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleBase64Upload(e, "pdfLogo")} />
                       </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardShell>
  );
}
