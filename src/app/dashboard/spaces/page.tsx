"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Plus, Trash2, Edit, MapPin } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";

interface Space {
  id: string;
  name: string;
  description: string;
}

export default function SpacesPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", description: "" });

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/spaces");
      if (resp.ok) setSpaces(await resp.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && ["ADMIN_MASTER", "ADMIN"].includes(currentUser.role)) {
      fetchSpaces();
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!formData.name) return;

    try {
      const isEditing = !!formData.id;
      const url = isEditing ? `/api/spaces/${formData.id}` : "/api/spaces";
      const method = isEditing ? "PUT" : "POST";

      const resp = await fetch(url, {
        method,
        body: JSON.stringify({ name: formData.name, description: formData.description }),
        headers: { "Content-Type": "application/json" },
      });

      if (resp.ok) {
        fetchSpaces();
        setIsModalOpen(false);
      } else {
        alert("Erro ao salvar espaço.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este espaço? As reversas atreladas poderão ser impactadas.")) return;
    try {
      const resp = await fetch(`/api/spaces/${id}`, { method: "DELETE" });
      if (resp.ok) {
        fetchSpaces();
      } else {
        alert("Erro ao excluir espaço.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setFormData({ id: "", name: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Space) => {
    setFormData({ id: s.id, name: s.name, description: s.description || "" });
    setIsModalOpen(true);
  };

  if (!currentUser) return <div className="p-8">Carregando painel...</div>;
  if (!["ADMIN_MASTER", "ADMIN"].includes(currentUser.role)) return <div className="p-8">Acesso Negado. Reservado para Administradores.</div>;

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Espaços da Igreja</h1>
          <p>Mapeie salas, quadras e auditórios disponíveis para reserva</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={20} />
          <span>Novo Espaço</span>
        </button>
      </header>

      <div className="premium-card p-6 mt-6">
        {loading ? (
          <p>Carregando espaços...</p>
        ) : spaces.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {spaces.map(space => (
              <div key={space.id} style={{ padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{display: "flex", gap: "8px", alignItems: "center", fontWeight: "bold", fontSize: "1.1rem", color: "var(--primary)"}}>
                    <MapPin size={18} />
                    {space.name}
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => openEditModal(space)} className="btn-icon" title="Editar">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(space.id)} className="btn-icon delete" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  {space.description || "Nenhuma descrição ativa."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results" style={{ padding: "3rem", textAlign: "center" }}>
            <MapPin size={48} style={{ opacity: 0.1, margin: "0 auto 1rem" }} />
            <p>Nenhum espaço físico cadastrado ainda.</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Os líderes não poderão reservar áreas até que você mapeie as salinhas e auditórios disponíveis.</p>
          </div>
        )}
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content">
            <Dialog.Title>{formData.id ? "Editar Espaço" : "Novo Espaço Físico"}</Dialog.Title>
            <div className="form-group">
              <label>Nome do Local (Ex: Sala das Crianças, Cantina)</label>
              <input
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Detalhes (Opcional)</label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Capacidade máxima 40 pessoas, possui Datashow"
              />
            </div>
            <div className="modal-actions">
              <Dialog.Close asChild>
                <button className="btn btn-outline">Cancelar</button>
              </Dialog.Close>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={!formData.name}
              >
                Salvar Local
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </DashboardShell>
  );
}
