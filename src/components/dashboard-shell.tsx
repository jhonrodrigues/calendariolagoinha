import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Database, Menu, X, Palette, Key, Bookmark, MapPin, FileUp } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN_MASTER" || user?.role === "ADMIN";

  const [platformSettings, setPlatformSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => setPlatformSettings(data)).catch(() => {});
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus("As senhas não coincidem!");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setPasswordStatus("Salvando...");
    try {
      const resp = await fetch("/api/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword })
      });
      if (resp.ok) {
        setPasswordStatus("Senha alterada com sucesso!");
        setTimeout(() => setIsPasswordModalOpen(false), 1500);
      } else {
        const errorData = await resp.json();
        setPasswordStatus(errorData.error || "Erro ao atualizar a senha.");
      }
    } catch {
      setPasswordStatus("Erro de conexão.");
    }
  };

  if (!user) return <div className="p-8">Carregando painel...</div>;

  return (
    <div className="dashboard-shell">
      {/* Mobile Header */}
      <div className="mobile-header">
        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>
          {platformSettings?.siteTitle || "Lagoinha"}
        </h2>
        <button className="btn-icon" onClick={() => setIsMobileOpen(!isMobileOpen)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }}>
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)} />}

      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {platformSettings?.siteLogo ? (
            <img src={platformSettings.siteLogo} alt="Logo" style={{ maxHeight: "40px", width: "auto" }} />
          ) : (
            <h2>{platformSettings?.siteTitle || "Lagoinha"}</h2>
          )}
        </div>

        
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-item">
            <LayoutDashboard size={20} />
            <span>Resumo</span>
          </Link>
          <Link href="/dashboard/calendar" className="nav-item">
            <Calendar size={20} />
            <span>Calendário</span>
          </Link>
          <Link href="/dashboard/reservations" className="nav-item">
            <Bookmark size={20} />
            <span>Reservas de Espaço</span>
          </Link>
          <Link href="/dashboard/settings" className="nav-item">
            <Settings size={20} />
            <span>Configurações</span>
          </Link>
          {isAdmin && (
            <>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "0.5rem 0" }} />
              <Link href="/dashboard/ministries" className="nav-item">
                <Users size={20} />
                <span>Ministérios</span>
              </Link>
              <Link href="/dashboard/spaces" className="nav-item">
                <MapPin size={20} />
                <span>Espaços Físicos</span>
              </Link>
              {user.role === "ADMIN_MASTER" && (
                <>
                  <Link href="/dashboard/users" className="nav-item">
                    <Users size={20} />
                    <span>Equipe / Sistema</span>
                  </Link>
                  <Link href="/dashboard/backup" className="nav-item">
                    <Database size={20} />
                    <span>Backup</span>
                  </Link>
                  <Link href="/dashboard/admin/bulk-import" className="nav-item">
                    <FileUp size={20} />
                    <span>Importar Dados</span>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name" style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{user.name}</p>
            <p className="user-role">{user.role}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button className="btn-outline" style={{ flex: 1, padding: "0.5rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", cursor: "pointer", background: "white" }} onClick={() => setIsPasswordModalOpen(true)}>
              <Key size={16} /> <span style={{fontSize: "0.75rem", fontWeight: "bold", color: "#333"}}>Senha</span>
            </button>
            <button className="btn-logout" style={{ flex: 1, padding: "0.5rem", marginTop: 0 }} onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}>
              <LogOut size={16} /> <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <Dialog.Root open={isPasswordModalOpen} onOpenChange={(val) => {
          setIsPasswordModalOpen(val);
          if (!val) {
             setNewPassword("");
             setConfirmPassword("");
             setPasswordStatus("");
          }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" style={{ zIndex: 9999 }} />
          <Dialog.Content className="modal-content" style={{ maxWidth: "400px", zIndex: 10000 }}>
            <div className="modal-header">
              <Dialog.Title style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Key size={20} color="var(--accent)" /> Trocar Senha</Dialog.Title>
              <Dialog.Close asChild>
                <button className="btn-close" style={{ border: "none", background: "transparent", cursor: "pointer" }}><X size={20} /></button>
              </Dialog.Close>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Nova Senha</label>
                <input type="password" required className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Confirmar Nova Senha</label>
                <input type="password" required className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} />
              </div>
              {passwordStatus && (
                <p style={{ fontSize: "0.875rem", color: passwordStatus.includes("sucesso") ? "green" : "red", marginBottom: "1rem" }}>{passwordStatus}</p>
              )}
              <div className="modal-actions" style={{ borderTop: "none", paddingTop: 0, marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-outline" style={{ width: "100%" }} onClick={() => setIsPasswordModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Salvar Nova Senha</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="main-content">
        {children}
      </main>

    </div>
  );
}
