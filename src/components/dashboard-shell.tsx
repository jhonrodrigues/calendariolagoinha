import React, { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Database, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN_MASTER" || user?.role === "ADMIN";

  if (!user) return <div className="p-8">Carregando painel...</div>;

  return (
    <div className="dashboard-shell">
      {/* Mobile Header */}
      <div className="mobile-header">
        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Lagoinha</h2>
        <button className="btn-icon" onClick={() => setIsMobileOpen(!isMobileOpen)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }}>
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)} />}

      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Lagoinha</h2>
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
          {isAdmin && (
            <>
              <Link href="/dashboard/ministries" className="nav-item">
                <Users size={20} />
                <span>Ministérios</span>
              </Link>
              {user.role === "ADMIN_MASTER" && (
                <>
                  <Link href="/dashboard/users" className="nav-item">
                    <Settings size={20} />
                    <span>Usuários</span>
                  </Link>
                  <Link href="/dashboard/backup" className="nav-item">
                    <Database size={20} />
                    <span>Backup</span>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-role">{user.role}</p>
          </div>
          <button className="btn-logout" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

    </div>
  );
}
