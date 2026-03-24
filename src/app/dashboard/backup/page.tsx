"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useSession } from "next-auth/react";
import { Download, Database, ShieldCheck, AlertCircle } from "lucide-react";

export default function BackupPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [downloading, setDownloading] = useState(false);

  if (!user) return <div className="p-8">Carregando painel...</div>;
  if (user.role !== "ADMIN_MASTER") return <div className="p-8">Acesso Negado. Reservado ao Administrador Master.</div>;

  const handleBackup = () => {
    setDownloading(true);
    // Trigger the unauthenticated-looking API route (it checks the session cookie automatically)
    window.location.href = "/api/backup";
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Backup do Sistema</h1>
          <p>Área de segurança máxima. Faça o download do banco de dados completo.</p>
        </div>
      </header>

      <div className="backup-container premium-card">
        <div className="backup-icon">
          <Database size={48} color="var(--accent)" />
        </div>
        
        <h2>Download do Banco de Dados</h2>
        <p className="backup-description">
          Esta ação irá baixar uma cópia exata do banco de dados SQLite contendo 
          todos os usuários, ministérios e eventos do sistema. Mantenha este arquivo 
          em local seguro e não o compartilhe.
        </p>

        <div className="security-alert">
          <ShieldCheck size={20} />
          <span>Acesso monitorado: Autenticado como Admin Master.</span>
        </div>

        <button 
          className="btn btn-primary btn-large" 
          onClick={handleBackup}
          disabled={downloading}
        >
          <Download size={20} />
          <span>{downloading ? "Gerando Backup..." : "Baixar Backup Agora (dev.db)"}</span>
        </button>
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
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.125rem;
          width: 100%;
          max-width: 320px;
        }
      `}</style>
    </DashboardShell>
  );
}
