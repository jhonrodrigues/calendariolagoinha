"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";

interface Ministry {
  id: string;
  name: string;
}

export default function MinistriesPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMinistry, setCurrentMinistry] = useState<Ministry | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/ministries");
      const data = await resp.json();
      setMinistries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMinistries();
  }, [user]);

  const handleSave = async () => {
    if (!newName) return;
    const method = currentMinistry ? "PUT" : "POST";
    const url = currentMinistry ? `/api/ministries/${currentMinistry.id}` : "/api/ministries";

    try {
      const resp = await fetch(url, {
        method,
        body: JSON.stringify({ name: newName }),
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        fetchMinistries();
        setIsModalOpen(false);
        setNewName("");
        setCurrentMinistry(null);
      } else {
        alert("Erro ao salvar ministério. Sem permissão.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ministério?")) return;
    try {
      const resp = await fetch(`/api/ministries/${id}`, { method: "DELETE" });
      if (resp.ok) {
        fetchMinistries();
      } else {
        alert("Erro ao excluir.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMinistries = ministries.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return <div className="p-8">Carregando painel...</div>;
  if (user.role === "LEADER") return <div className="p-8">Acesso Negado</div>;

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Gestão de Ministérios</h1>
          <p>Cadastre e gerencie os departamentos da igreja</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setCurrentMinistry(null);
          setNewName("");
          setIsModalOpen(true);
        }}>
          <Plus size={20} />
          <span>Novo Ministério</span>
        </button>
      </header>

      <section className="controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <div className="ministries-grid">
        {loading ? (
          <p>Carregando...</p>
        ) : filteredMinistries.length > 0 ? (
          filteredMinistries.map((m) => (
            <div key={m.id} className="ministry-card premium-card">
              <div className="ministry-info">
                <h3>{m.name}</h3>
              </div>
              <div className="ministry-actions">
                <button onClick={() => {
                  setCurrentMinistry(m);
                  setNewName(m.name);
                  setIsModalOpen(true);
                }} className="btn-icon edit">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(m.id)} className="btn-icon delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">Nenhum ministério encontrado.</p>
        )}
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content">
            <Dialog.Title>{currentMinistry ? "Editar" : "Novo"} Ministério</Dialog.Title>
            <div className="form-group">
              <label htmlFor="name">Nome do Ministério</label>
              <input
                id="name"
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Mídia, Louvor, Kids..."
              />
            </div>
            <div className="modal-actions">
              <Dialog.Close asChild>
                <button className="btn btn-outline">Cancelar</button>
              </Dialog.Close>
              <button className="btn btn-primary" onClick={handleSave}>
                Salvar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </DashboardShell>
  );
}
