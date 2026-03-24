import { useState, useRef } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useSession } from "next-auth/react";
import { Download, Upload, Database, ShieldCheck, AlertTriangle } from "lucide-react";

export default function BackupPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <div className="p-8">Carregando painel...</div>;
  if (user.role !== "ADMIN_MASTER") return <div className="p-8">Acesso Negado. Reservado ao Administrador Master.</div>;

  const handleBackup = () => {
    setDownloading(true);
    window.location.href = "/api/backup";
    setTimeout(() => setDownloading(false), 2000);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ ATENÇÃO EXTREMA: Isso irá APAGAR todos os dados atuais e substituí-los pelo arquivo de backup. O sistema poderá ficar instável durantes alguns segundos. Tem certeza absoluta?")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch("/api/backup", {
        method: "POST",
        body: formData,
      });

      if (resp.ok) {
        alert("✅ Backup restaurado com sucesso! Recomendamos recarregar a página.");
        window.location.reload();
      } else {
        alert("❌ Erro ao restaurar o backup.");
      }
    } catch (err) {
      alert("❌ Erro na conexão.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Backup do Sistema</h1>
          <p>Área de segurança máxima para download e restauração.</p>
        </div>
      </header>

      <div className="backup-container premium-card">
        <div className="backup-icon">
          <Database size={48} color="var(--accent)" />
        </div>
        
        <h2>Importar e Exportar Dados</h2>
        <p className="backup-description">
          Baixe cópias de segurança da sua base SQLite inteira ou 
          restaure uma cópia arquivada em caso de emergência. A restauração é IRREVERSÍVEL.
        </p>

        <div className="security-alert">
          <ShieldCheck size={20} />
          <span>Acesso monitorado: Autenticado como Admin Master.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "320px" }}>
          <button 
            className="btn btn-primary btn-large" 
            onClick={handleBackup}
            disabled={downloading || uploading}
          >
            <Download size={20} />
            <span>{downloading ? "Gerando Backup..." : "Baixar Backup (dev.db)"}</span>
          </button>

          <input 
            type="file" 
            accept=".db,.sqlite" 
            ref={fileInputRef} 
            onChange={handleRestore} 
            style={{ display: "none" }} 
          />
          <button 
            className="btn btn-outline btn-large" 
            onClick={() => fileInputRef.current?.click()}
            disabled={downloading || uploading}
            style={{ borderColor: "#ef4444", color: "#ef4444" }}
          >
            <Upload size={20} />
            <span>{uploading ? "Restaurando..." : "Restaurar Backup Seguro"}</span>
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
          margin: 4rem auto;
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
          margin-bottom: 2rem;
          line-height: 1.6;
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
