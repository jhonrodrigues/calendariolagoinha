"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface Ministry {
  id: string;
  name: string;
}

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMinistry, setCurrentMinistry] = useState<Ministry | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  // Mock user for now - will be replaced by actual session
  const user = { name: "Admin Master", role: "ADMIN_MASTER" as const };

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/ministries");
      const data = await resp.json();
      setMinistries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinistries();
  }, []);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ministério?")) return;
    try {
      await fetch(`/api/ministries/${id}`, { method: "DELETE" });
      fetchMinistries();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMinistries = ministries.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell user={user}>
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

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .page-header p {
          color: var(--secondary);
        }
        .controls {
          margin-bottom: 2rem;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          max-width: 400px;
        }
        .search-bar input {
          border: none;
          outline: none;
          width: 100%;
          font: inherit;
        }
        .ministries-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .ministry-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ministry-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn-icon {
          padding: 0.5rem;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .btn-icon.edit:hover { background: #eff6ff; color: #2563eb; }
        .btn-icon.delete:hover { background: #fef2f2; color: #ef4444; }
        
        .modal-overlay {
          background: rgba(0,0,0,0.5);
          position: fixed;
          inset: 0;
          animation: fadeIn 0.2s;
        }
        .modal-content {
          background: white;
          border-radius: var(--radius);
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90vw;
          max-width: 450px;
          padding: 2rem;
          animation: scaleIn 0.2s;
        }
        .modal-actions {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: translate(-50%, -50%) scale(0.9); } to { transform: translate(-50%, -50%) scale(1); } }
      `}</style>
    </DashboardShell>
  );
}
