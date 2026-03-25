"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Plus, Trash2, Edit, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";

interface Ministry {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  ministryId?: string;
  ministry?: Ministry;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [users, setUsers] = useState<User[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [createData, setCreateData] = useState({
    name: "",
    email: "",
    password: "",
    role: "LEADER",
    ministryId: ""
  });

  const [editData, setEditData] = useState({
    id: "",
    role: "LEADER",
    ministryId: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, mRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/ministries")
      ]);
      
      if (uRes.ok) setUsers(await uRes.json());
      if (mRes.ok) setMinistries(await mRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && ["ADMIN_MASTER", "ADMIN"].includes(currentUser.role)) {
      fetchData();
    }
  }, [currentUser]);

  const handleCreate = async () => {
    if (!createData.name || !createData.email || !createData.password) return;

    try {
      const payload = { ...createData };
      if (!payload.ministryId) delete (payload as any).ministryId;

      const resp = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        fetchData();
        setIsCreateModalOpen(false);
        setCreateData({ name: "", email: "", password: "", role: "LEADER", ministryId: "" });
      } else {
        alert("Erro ao criar usuário. " + (await resp.text()));
      }
    } catch (err) {
      alert("Erro ao criar usuário");
    }
  };

  const handleEdit = async () => {
    try {
      const resp = await fetch(`/api/users/${editData.id}`, {
        method: "PUT",
        body: JSON.stringify({
          role: editData.role,
          ministryId: editData.ministryId
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        fetchData();
        setIsEditModalOpen(false);
      } else {
        alert("Erro ao editar usuário.");
      }
    } catch (err) {
      alert("Erro ao editar usuário");
    }
  };

  const handleDelete = async (id: string, role: string) => {
    if (role === "ADMIN_MASTER") {
      alert("Não é possível excluir um Administrador Master.");
      return;
    }
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      const resp = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (resp.ok) {
        fetchData();
      } else {
        alert("Erro ao excluir usuário.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (user: User) => {
    // Admins cannot edit Master
    if (currentUser.role !== "ADMIN_MASTER" && user.role === "ADMIN_MASTER") {
      alert("Privilégios insuficientes para editar um Master.");
      return;
    }
    setEditData({
      id: user.id,
      role: user.role,
      ministryId: user.ministryId || ""
    });
    setIsEditModalOpen(true);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) return <div className="p-8">Carregando painel...</div>;
  if (!["ADMIN_MASTER", "ADMIN"].includes(currentUser.role)) return <div className="p-8">Acesso Negado.</div>;

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Gestão de Usuários</h1>
          <p>Cadastre e gerencie membros. Vincule Líderes a Ministérios.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
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
          <p className="p-4">Carregando equipe...</p>
        ) : filteredUsers.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Permissão</th>
                <th>Ministério</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-semibold">{u.name}</div>
                    <div style={{fontSize: "0.8rem", color: "#666"}}>{u.email}</div>
                  </td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role === "ADMIN_MASTER" ? "Master" : 
                       u.role === "ADMIN" ? "Administrador" : "Líder"}
                    </span>
                  </td>
                  <td>
                    {u.ministry ? (
                      <span style={{background: "#f3f4f6", padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem"}}>
                        {u.ministry.name}
                      </span>
                    ) : <span style={{color: "#aaa"}}>-</span>}
                  </td>
                  <td>
                    <div style={{display: "flex", gap: "8px"}}>
                      <button onClick={() => openEditModal(u)} className="btn-icon" title="Editar">
                        <Edit size={18} />
                      </button>
                      {u.role !== "ADMIN_MASTER" && (
                        <button onClick={() => handleDelete(u.id, u.role)} className="btn-icon delete" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-results p-4">Nenhum usuário encontrado.</p>
        )}
      </div>

      {/* CREATE USER MODAL */}
      <Dialog.Root open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content">
            <Dialog.Title>Novo Membro de Acesso</Dialog.Title>
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                className="input"
                value={createData.name}
                onChange={(e) => setCreateData({...createData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>E-mail (Login)</label>
              <input
                type="email"
                className="input"
                value={createData.email}
                onChange={(e) => setCreateData({...createData, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Senha Provisória</label>
              <input
                type="password"
                className="input"
                value={createData.password}
                onChange={(e) => setCreateData({...createData, password: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Permissão Base</label>
              <select 
                className="input"
                value={createData.role}
                onChange={(e) => setCreateData({...createData, role: e.target.value})}
              >
                <option value="LEADER">Líder Temático (Apenas Gestão)</option>
                <option value="ADMIN">Administrador (Master de Lógica)</option>
                {currentUser?.role === "ADMIN_MASTER" && <option value="ADMIN_MASTER">Master do Sistema</option>}
              </select>
            </div>
            <div className="form-group">
              <label>Vincular a um Ministério (Opcional)</label>
              <select 
                className="input"
                value={createData.ministryId}
                onChange={(e) => setCreateData({...createData, ministryId: e.target.value})}
              >
                <option value="">-- Nenhum --</option>
                {ministries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <Dialog.Close asChild>
                <button className="btn btn-outline">Cancelar</button>
              </Dialog.Close>
              <button 
                className="btn btn-primary" 
                onClick={handleCreate}
                disabled={!createData.name || !createData.email || !createData.password}
              >
                Cadastrar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* EDIT USER MODAL */}
      <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content">
            <Dialog.Title>Modificar Configurações do Usuário</Dialog.Title>
            
            <div className="form-group">
              <label>Cargo & Privilégios</label>
              <select 
                className="input"
                value={editData.role}
                onChange={(e) => setEditData({...editData, role: e.target.value})}
              >
                <option value="LEADER">Líder Temático</option>
                <option value="ADMIN">Administrador</option>
                {currentUser?.role === "ADMIN_MASTER" && <option value="ADMIN_MASTER">Master Total</option>}
              </select>
            </div>
            
            <div className="form-group">
              <label>Vínculo Ministerial Oficial</label>
              <select 
                className="input"
                value={editData.ministryId}
                onChange={(e) => setEditData({...editData, ministryId: e.target.value})}
              >
                <option value="">-- Desvinculado --</option>
                {ministries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="modal-actions">
              <Dialog.Close asChild>
                <button className="btn btn-outline">Cancelar</button>
              </Dialog.Close>
              <button className="btn btn-primary" onClick={handleEdit}>
                Salvar Configurações
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </DashboardShell>
  );
}
