"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useSession } from "next-auth/react";
import { Save, Image as ImageIcon, LayoutTemplate, Palette } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdminMaster = user?.role === "ADMIN_MASTER";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
      if (!isAdminMaster) {
        window.location.href = "/dashboard";
        return;
      }
      fetch("/api/settings").then(r => r.json()).then(data => {
        if (data) setSettings(data);
        setLoading(false);
      });
    }
  }, [user, isAdminMaster]);

  const handleBase64Upload = (e: React.ChangeEvent<HTMLInputElement>, field: "siteLogo" | "pdfLogo") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Quick validation for size < 2MB to keep DB light
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
        alert("Configurações salvas com sucesso! Recarregue a página para ver as novas cores.");
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

  if (loading) return <div className="p-8">Verificando permissões...</div>;
  if (!isAdminMaster) return null;

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Personalização da Plataforma</h1>
          <p>Ajuste as cores, logos e cabeçalho dos documentos gerados</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={20} />
          <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "2rem" }}>
        
        {/* ---- SITE BRANDING ---- */}
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
            <label>Logo do Menu Principal (Recomendado: Fundo Transparente PN/SVG, Altura 60px)</label>
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
                     <span style={{ fontSize: "0.875rem" }}>Fazer upload de imagem (Max 2MB)</span>
                     <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleBase64Upload(e, "siteLogo")} />
                   </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- PDF EXPORT BRANDING ---- */}
        <div className="premium-card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <LayoutTemplate size={20} color="var(--accent)" /> Ajustes de Formulários e PDF
          </h2>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label>Título Master do Calendário Gerado</label>
            <input className="input" value={settings.pdfTitle} onChange={e => setSettings({...settings, pdfTitle: e.target.value})} placeholder="Ex: A G E N D A" />
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label>Subtítulo do PDF (Exemplo: Nome da Igreja)</label>
            <input className="input" value={settings.pdfSubtitle} onChange={e => setSettings({...settings, pdfSubtitle: e.target.value})} />
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label>Alinhamento do Cabeçalho</label>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
              <button 
                className={`btn ${settings.pdfTitleAlign === "left" ? "btn-primary" : "btn-outline"}`} 
                onClick={() => setSettings({...settings, pdfTitleAlign: "left"})}
              >Esquerda</button>
              <button 
                className={`btn ${settings.pdfTitleAlign === "center" ? "btn-primary" : "btn-outline"}`} 
                onClick={() => setSettings({...settings, pdfTitleAlign: "center"})}
              >Centro</button>
              <button 
                className={`btn ${settings.pdfTitleAlign === "right" ? "btn-primary" : "btn-outline"}`} 
                onClick={() => setSettings({...settings, pdfTitleAlign: "right"})}
              >Direita</button>
            </div>
          </div>

          <div className="form-group">
            <label>Logotipo exclusivo do PDF (Ideal: Fundo Branco ou Transparente)</label>
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

      </div>
    </DashboardShell>
  );
}
