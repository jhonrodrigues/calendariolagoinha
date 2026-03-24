import React from "react";
import Link from "next/link";
import { LayoutDashboard, Calendar, Users, Settings, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN_MASTER" || user?.role === "ADMIN";

  if (!user) return <div className="p-8">Carregando painel...</div>;

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
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
                <Link href="/dashboard/users" className="nav-item">
                  <Settings size={20} />
                  <span>Usuários</span>
                </Link>
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
