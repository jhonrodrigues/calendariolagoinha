"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Plus, Check, X, Clock, MapPin, Calendar, CheckCircle2, XCircle, Bookmark } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";

interface Space { id: string; name: string; }
interface User { id: string; name: string; email: string; }
interface Reservation {
  id: string;
  spaceId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  status: string;
  space: Space;
  user: User;
}

export default function ReservationsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const isAdmin = currentUser && ["ADMIN_MASTER", "ADMIN"].includes(currentUser.role);

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [filter, setFilter] = useState(isAdmin ? "pending" : "mine");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    spaceId: "", date: "", startTime: "", endTime: "", title: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = isAdmin && filter === "pending" ? "?filter=all" : isAdmin && filter === "approved" ? "?filter=approved" : "?filter=mine";
      const [resReq, spcReq] = await Promise.all([
        fetch(`/api/reservations${q}`),
        fetch("/api/spaces") // Even leaders need spaces to create reservations
      ]);
      
      if (resReq.ok) {
        let data = await resReq.json();
        if (isAdmin && filter === "pending") data = data.filter((r: any) => r.status === "PENDING");
        setReservations(data);
      }
      if (spcReq.ok) {
        setSpaces(await spcReq.json());
      }
    } catch (err) { } finally { setLoading(false); }
  };

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser, filter]);

  const handleCreate = async () => {
    if (!formData.spaceId || !formData.date || !formData.startTime || !formData.endTime || !formData.title) {
      alert("Preencha todos os campos."); return;
    }
    if (formData.endTime <= formData.startTime) {
      alert("O horário de término deve ser após o início."); return;
    }

    try {
      const resp = await fetch("/api/reservations", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (resp.ok) {
        fetchData();
        setIsModalOpen(false);
        setFormData({spaceId: "", date: "", startTime: "", endTime: "", title: ""});
        alert("Solicitação enviada com sucesso!");
      } else {
        const text = await resp.text();
        try {
          const err = JSON.parse(text);
          alert(err.error || "Erro ao solicitar espaço.");
        } catch (e) {
          alert("Erro no servidor: " + text);
        }
      }
    } catch (err: any) {
      console.error("Erro na requisição:", err);
      alert("Erro de conexão ou erro interno: " + err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const resp = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
        headers: { "Content-Type": "application/json" }
      });
      if (resp.ok) fetchData();
      else alert("Erro ao atualizar status.");
    } catch(err) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Cancelar solicitação de reserva?")) return;
    try {
      const resp = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (resp.ok) fetchData();
    } catch(err) {}
  };

  if (!currentUser) return <div className="p-8">Carregando painel...</div>;

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Reservas de Espaço</h1>
          <p>{isAdmin ? "Central de Aprovação de Solicitações da Igreja" : "Solicite e acompanhe os espaços para seus encontros"}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          <span>Nova Solicitação</span>
        </button>
      </header>

      {isAdmin && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button className={`btn ${filter === "pending" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("pending")}>
            Avaliar Pendentes
          </button>
          <button className={`btn ${filter === "approved" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("approved")}>
            Agenda Aprovados
          </button>
          <button className={`btn ${filter === "mine" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("mine")}>
            Minhas Reservas
          </button>
        </div>
      )}

      <div className="users-table-container premium-card">
        {loading ? (
          <p className="p-4">Carregando fila de reservas...</p>
        ) : reservations.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>Data e Hora</th>
                <th>Espaço e Motivo</th>
                <th>Solicitante</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{fontWeight: "bold", fontSize: "0.95rem"}}><Calendar size={14} style={{display: "inline", marginRight: "4px"}}/> {r.date.split("-").reverse().join("/")}</div>
                    <div style={{fontSize: "0.85rem", color: "#64748b", marginTop: "4px"}}><Clock size={12} style={{display: "inline", marginRight: "4px"}}/> {r.startTime} às {r.endTime}</div>
                  </td>
                  <td>
                    <div style={{fontWeight: "bold", color: "var(--primary)"}}><MapPin size={14} style={{display: "inline", marginRight: "4px"}}/> {r.space.name}</div>
                    <div style={{fontSize: "0.85rem", color: "#475569"}}>{r.title}</div>
                  </td>
                  <td>
                    <div style={{fontWeight: "500"}}>{r.user.name}</div>
                    <div style={{fontSize: "0.80rem", color: "#94a3b8"}}>{r.user.email}</div>
                  </td>
                  <td>
                    {r.status === "PENDING" && <span style={{background: "#fef3c7", color: "#d97706", padding: "4px 8px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold"}}>Pendente</span>}
                    {r.status === "APPROVED" && <span style={{background: "#dcfce7", color: "#16a34a", padding: "4px 8px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold"}}>Aprovada</span>}
                    {r.status === "REJECTED" && <span style={{background: "#fee2e2", color: "#dc2626", padding: "4px 8px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold"}}>Recusada</span>}
                  </td>
                  <td>
                    <div style={{display: "flex", gap: "8px"}}>
                      {isAdmin && filter === "pending" && (
                        <>
                          <button onClick={() => handleUpdateStatus(r.id, "APPROVED")} className="btn-icon" style={{color: "#16a34a", background: "#f0fdf4"}} title="Aprovar">
                            <CheckCircle2 size={18} />
                          </button>
                          <button onClick={() => handleUpdateStatus(r.id, "REJECTED")} className="btn-icon delete" title="Rejeitar">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {(r.userId === currentUser.id || isAdmin) && r.status !== "APPROVED" && (
                        <button onClick={() => handleDelete(r.id)} className="btn-icon delete" title="Excluir/Cancelar">
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-results p-8 text-center" style={{padding: "40px", color: "#64748b"}}>
            <Bookmark size={48} style={{opacity: 0.1, margin: "0 auto 10px"}} />
            <p>Nenhuma reserva encontrada nesta visualização.</p>
          </div>
        )}
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content">
            <Dialog.Title>Solicitar Uso de Espaço</Dialog.Title>
            
            <div className="form-group">
              <label>Área da Igreja</label>
              <select className="input" value={formData.spaceId} onChange={(e) => setFormData({...formData, spaceId: e.target.value})}>
                <option value="">-- Selecione o Local --</option>
                {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Data</label>
              <input type="date" className="input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
               <div className="form-group" style={{flex: 1}}>
                 <label>Hora de Início</label>
                 <input type="time" className="input" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
               </div>
               <div className="form-group" style={{flex: 1}}>
                 <label>Hora de Término</label>
                 <input type="time" className="input" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
               </div>
            </div>

            <div className="form-group">
              <label>Motivo ou Tema do Encontro</label>
              <input type="text" className="input" placeholder="Ex: Ensaio de Dança, Reunião da Diretoria" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="modal-actions">
              <Dialog.Close asChild>
                <button className="btn btn-outline">Cancelar</button>
              </Dialog.Close>
              <button 
                className="btn btn-primary" 
                onClick={handleCreate} 
                disabled={!formData.spaceId || !formData.date || !formData.title || !formData.startTime || !formData.endTime}
              >
                Enviar Solicitação
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </DashboardShell>
  );
}
