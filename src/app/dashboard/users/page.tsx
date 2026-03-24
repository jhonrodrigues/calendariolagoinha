"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Plus, Trash2, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "LEADER"
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/users");
      if (resp.ok) {
        const data = await resp.json();
        setUsers(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "ADMIN_MASTER") {
      fetchUsers();
    }
  }, [currentUser]);

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) return;

    try {
      const resp = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        fetchUsers();
        setIsModalOpen(false);
        setFormData({ name: "", email: "", password: "", role: "LEADER" });
      } else {
        alert("Erro ao criar usuário. " + (await resp.text()));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar usuário");
    }
  };

  const handleDelete = async (id: string, role: string) => {
    if (role === "ADMIN_MASTER") {
      alert("Não é possível excluir o Admin Master principal.");
      return;
    }
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      const resp = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (resp.ok) {
        fetchUsers();
      } else {
        alert("Erro ao excluir usuário.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) return <div className="p-8">Carregando painel...</div>;
  if (currentUser.role !== "ADMIN_MASTER") return <div className="p-8">Acesso Negado. Apenas Admin Master.</div>;

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Gestão de Usuários</h1>
          <p>Cadastre líderes e administradores para acessar o painel</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          <span>Novo Usuário</span>
        </button>
      </header>

      <section className="controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <div className="users-table-container premium-card">
        {loading ? (
          <p className="p-4">Carregando usuários...</p>
        ) : filteredUsers.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Permissão</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role === "ADMIN_MASTER" ? "Administrador Master" : 
                       u.role === "ADMIN" ? "Administrador" : "Líder"}
                    </span>
                  </td>
                  <td>
                    {u.role !== "ADMIN_MASTER" && (
                      <button onClick={() => handleDelete(u.id, u.role)} className="btn-icon delete">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-results p-4">Nenhum usuário encontrado.</p>
        )}
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content">
            <Dialog.Title>Novo Usuário</Dialog.Title>
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="form-group">
              <label>E-mail (Login)</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Ex: joao@lagoinha.com"
              />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="form-group">
              <label>Permissão</label>
              <select 
                className="input"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="LEADER">Líder (Pode apenas ver eventos)</option>
                <option value="ADMIN">Administrador (Pode criar eventos e ministérios)</option>
              </select>
            </div>
            <div className="modal-actions">
              <Dialog.Close asChild>
                <button className="btn btn-outline">Cancelar</button>
              </Dialog.Close>
              <button 
                className="btn btn-primary" 
                onClick={handleCreate}
                disabled={!formData.name || !formData.email || !formData.password}
              >
                Salvar Usuário
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style jsx>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .page-header p { color: var(--secondary); }
        .controls { margin-bottom: 2rem; }
        .search-bar { display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius); max-width: 400px; }
        .search-bar input { border: none; outline: none; width: 100%; font: inherit; }
        
        .users-table-container { overflow-x: auto; padding: 0 !important; }
        .users-table { width: 100%; border-collapse: collapse; text-align: left; }
        .users-table th { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); background: #f8fafc; color: var(--secondary); font-weight: 600; font-size: 0.875rem; }
        .users-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
        .users-table tr:last-child td { border-bottom: none; }
        
        .role-badge { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
        .role-admin_master { background: #fee2e2; color: #b91c1c; }
        .role-admin { background: #fef3c7; color: #b45309; }
        .role-leader { background: #eff6ff; color: #1d4ed8; }
        
        .btn-icon { padding: 0.5rem; border-radius: 6px; transition: background 0.2s; }
        .btn-icon.delete:hover { background: #fef2f2; color: #ef4444; }
        
        .modal-overlay { background: rgba(0,0,0,0.5); position: fixed; inset: 0; animation: fadeIn 0.2s; }
        .modal-content { background: white; border-radius: var(--radius); position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90vw; max-width: 450px; padding: 2rem; animation: scaleIn 0.2s; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; }
        .modal-actions { margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: translate(-50%, -50%) scale(0.9); } to { transform: translate(-50%, -50%) scale(1); } }
      `}</style>
    </DashboardShell>
  );
}
