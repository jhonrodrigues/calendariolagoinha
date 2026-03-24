"use client";

import { useState, useRef } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useSession } from "next-auth/react";
import { Download, Upload, Database, ShieldCheck, CheckSquare, Square } from "lucide-react";

export default function BackupPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [exportEvents, setExportEvents] = useState(true);
  const [exportMinistries, setExportMinistries] = useState(true);
  const [exportUsers, setExportUsers] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <div className="p-8">Carregando painel...</div>;
  if (user.role !== "ADMIN_MASTER") return <div className="p-8">Acesso Negado. Reservado ao Administrador Master.</div>;

  const handleExport = async () => {
    if (!exportEvents && !exportMinistries && !exportUsers) {
        alert("Selecione pelo menos um módulo para exportar.");
        return;
    }
    setDownloading(true);
    try {
      const resp = await fetch(`/api/backup/selective?events=${exportEvents}&ministries=${exportMinistries}&users=${exportUsers}`);
      if (!resp.ok) throw new Error("Falha na exportação");
      const data = await resp.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lagoinha_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erro ao exportar backup.");
    } finally {
      setDownloading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ Você está prestes a fundir estes dados ao sistema. Registros com o mesmo ID serão atualizados e novos serão criados. Deseja prosseguir?")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const resp = await fetch("/api/backup/selective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        alert("✅ Backup JSON importado com sucesso!");
        window.location.reload();
      } else {
        alert("❌ Erro ao importar os dados do backup.");
      }
    } catch (err) {
      alert("❌ Arquivo JSON inválido ou erro na conexão.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const ToggleBox = ({ label, state, setter }: { label: string, state: boolean, setter: (v: boolean) => void }) => (
    <div 
      className={`toggle-box ${state ? 'active' : ''}`} 
      onClick={() => setter(!state)}
    >
      {state ? <CheckSquare size={18} color="var(--accent)" /> : <Square size={18} color="var(--secondary)" />}
      <span>{label}</span>
    </div>
  );

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Backup Seletivo do Sistema</h1>
          <p>Exporte e Importe módulos específicos em formato aberto (JSON).</p>
        </div>
      </header>

      <div className="backup-container premium-card">
        <div className="backup-icon">
          <Database size={48} color="var(--accent)" />
        </div>
        
        <h2>Importação e Exportação Inteligente</h2>
        <p className="backup-description">
          Selecione abaixo quais informações deseja exportar. Ao importar um arquivo, o sistema fundirá 
          as informações sem destruir o banco atual.
        </p>

        <div className="security-alert">
          <ShieldCheck size={20} />
          <span>Acesso monitorado: Autenticado como Admin Master.</span>
        </div>

        <div className="boxes-grid">
          <ToggleBox label="Escalas e Calendário" state={exportEvents} setter={setExportEvents} />
          <ToggleBox label="Lista de Ministérios" state={exportMinistries} setter={setExportMinistries} />
          <ToggleBox label="Usuários (Exceto Master)" state={exportUsers} setter={setExportUsers} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "320px", marginTop: "2rem" }}>
          <button 
            className="btn btn-primary btn-large" 
            onClick={handleExport}
            disabled={downloading || uploading}
          >
            <Download size={20} />
            <span>{downloading ? "Gerando..." : "Exportar JSON"}</span>
          </button>

          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            style={{ display: "none" }} 
          />
          <button 
            className="btn btn-outline btn-large" 
            onClick={() => fileInputRef.current?.click()}
            disabled={downloading || uploading}
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            <Upload size={20} />
            <span>{uploading ? "Importando..." : "Importar JSON"}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .page-header p { color: var(--secondary); margin-top: 0.25rem; font-size: 0.875rem; }
        
        .backup-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 600px;
          margin: 2rem auto;
          padding: 3rem;
        }

        .backup-icon {
          background: #eff6ff;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        h2 {
          margin-bottom: 1rem;
        }

        .backup-description {
          color: var(--secondary);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        
        .boxes-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          width: 100%;
        }

        .toggle-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          background: var(--background);
          transition: all 0.2s;
          user-select: none;
          min-width: 180px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .toggle-box:hover {
          border-color: var(--accent);
        }
        .toggle-box.active {
          border-color: var(--accent);
          background: #eff6ff;
        }

        .security-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #fef2f2;
          color: #b91c1c;
          padding: 1rem;
          border-radius: var(--radius);
          margin-bottom: 2rem;
          font-weight: 500;
          font-size: 0.875rem;
          text-align: left;
        }

        .btn-large {
          padding: 1rem;
          font-size: 1rem;
          width: 100%;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </DashboardShell>
  );
}
