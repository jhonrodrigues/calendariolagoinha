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

      <style jsx>{`
        .dashboard-shell {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: 100vh;
        }
        .sidebar {
          background: var(--primary);
          color: white;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .sidebar-header {
          margin-bottom: 2.5rem;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius);
          transition: background 0.2s;
          color: rgba(255, 255, 255, 0.7);
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        .sidebar-footer {
          margin-top: auto;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .user-info .user-name {
          font-weight: 600;
          font-size: 0.875rem;
        }
        .user-info .user-role {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .btn-logout {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #fca5a5;
          font-size: 0.875rem;
          padding: 0.5rem 0;
        }
        .main-content {
          padding: 2.5rem;
          background: var(--background);
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .dashboard-shell {
            grid-template-columns: 1fr;
          }
          .sidebar {
            display: none; /* TODO: Implement mobile menu */
          }
        }
      `}</style>
    </div>
  );
}
