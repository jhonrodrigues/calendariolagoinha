"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import EventModal from "@/components/event-modal";
import CalendarPDFExport from "@/components/calendar-pdf-export";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { Plus, Filter, ChevronLeft, ChevronRight, Download, Edit, Trash2, X, AlertOctagon } from "lucide-react";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import "react-day-picker/dist/style.css";

interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  minister?: string;
  worship?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  requirements: { ministry: { id: string, name: string } }[];
}

interface Ministry {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  
  const [events, setEvents] = useState<Event[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportYear, setExportYear] = useState<string>(new Date().getFullYear().toString());
  const [exportMonths, setExportMonths] = useState<number[]>([new Date().getMonth()]);
  const [exportingDates, setExportingDates] = useState<Date[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role !== "LEADER";

  const fetchData = async () => {
    setLoading(true);
    try {
      const ministriesResp = await fetch("/api/ministries");
      const ministriesData = await ministriesResp.json();
      setMinistries(ministriesData || []);

      const eventsUrl = selectedMinistry ? `/api/events?ministryId=${selectedMinistry}` : "/api/events";
      const eventsResp = await fetch(eventsUrl);
      const eventsData = await eventsResp.json();
      setEvents(eventsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [selectedMinistry, user]);

  const handleSaveEvent = async (eventData: any, editMode: string) => {
    try {
      const isEdit = !!eventData.id;
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `/api/events/${eventData.id}` : "/api/events";
      
      const payload = isEdit ? { ...eventData, editMode } : eventData;

      const resp = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        fetchData();
        setIsModalOpen(false);
        setEventToEdit(null);
      } else {
        alert("Erro ao salvar evento");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar evento");
    }
  };

  const executeDelete = async (mode: string) => {
    if (!eventToDelete) return;
    try {
      const resp = await fetch(`/api/events/${eventToDelete.id}?mode=${mode}`, { method: "DELETE" });
      if (resp.ok) {
        fetchData();
        setEventToDelete(null);
      } else {
        alert("Erro ao excluir evento");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportSubmit = () => {
    if (exportMonths.length === 0) {
      alert("Selecione pelo menos um mês antes de exportar.");
      return;
    }
    
    // Sort chronologically
    const sorted = [...exportMonths].sort((a,b) => a - b);
    const dates = sorted.map(m => new Date(Date.UTC(parseInt(exportYear), m, 1, 12, 0, 0)));
    
    setExportingDates(dates);
    setIsExportModalOpen(false);
    setIsExporting(true);
  };

  const selectedDayEvents = events.filter(e => isSameDay(parseISO(e.date), selectedDay || new Date()));

  const modifiers = {
    hasEvent: events.map(e => parseISO(e.date))
  };

  const modifiersStyles = {
    hasEvent: {
      fontWeight: 'bold',
      color: 'var(--accent)',
      position: 'relative' as const
    }
  };

  if (!user) return <div className="p-8">Carregando painel...</div>;

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Calendário de Eventos</h1>
          <p>Visualize e gerencie as escalas da igreja</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setEventToEdit(null); setIsModalOpen(true); }}>
              <Plus size={20} />
              <span>Novo Evento</span>
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setIsExportModalOpen(true)}>
            <Download size={20} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </header>

      {/* ----------------- EXPORT PDF MODAL ----------------- */}
      <Dialog.Root open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content" style={{maxWidth: "450px"}}>
            <div className="modal-header">
              <Dialog.Title>Exportar Grade do Calendário</Dialog.Title>
              <Dialog.Close asChild>
                <button className="btn-close"><X size={20} /></button>
              </Dialog.Close>
            </div>
            
            <div className="form-group" style={{marginBottom: "1.5rem"}}>
              <label>Ano-Base:</label>
              <input 
                type="number" 
                className="input" 
                value={exportYear} 
                onChange={(e) => setExportYear(e.target.value)} 
                min={2020} max={2030}
              />
            </div>

            <div className="form-group" style={{marginBottom: "2rem"}}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <label>Meses Desejados:</label>
                <button type="button" onClick={() => setExportMonths([0,1,2,3,4,5,6,7,8,9,10,11])} style={{fontSize: "0.75rem", color: "var(--accent)"}}>Selecionar Ano Inteiro</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                {Array.from({length: 12}).map((_, i) => (
                  <label key={i} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    padding: "0.5rem", borderRadius: "8px", cursor: "pointer", 
                    fontSize: "0.85rem", fontWeight: 600,
                    background: exportMonths.includes(i) ? "#eff6ff" : "#f1f5f9", 
                    border: `1px solid ${exportMonths.includes(i) ? "var(--accent)" : "transparent"}`,
                    color: exportMonths.includes(i) ? "var(--accent)" : "var(--secondary)"
                  }}>
                     <input type="checkbox" checked={exportMonths.includes(i)} onChange={(e) => {
                       if (e.target.checked) setExportMonths([...exportMonths, i]);
                       else setExportMonths(exportMonths.filter(m => m !== i));
                     }} style={{display: "none"}} />
                     {format(new Date(2024, i, 1), "MMM", {locale: ptBR}).toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setIsExportModalOpen(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleExportSubmit}>Gerar Documento PDF</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ----------------- DELETE EVENT MODAL ----------------- */}
      <Dialog.Root open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content" style={{maxWidth: "400px"}}>
            <div className="modal-header">
              <Dialog.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertOctagon color="#ef4444" />
                Aviso de Exclusão
              </Dialog.Title>
            </div>
            
            <p style={{marginBottom: "1.5rem", color: "var(--secondary)"}}>
              Você selecionou o evento <strong>{eventToDelete?.title}</strong>. Que tipo de deleção você deseja aplicar?
            </p>

            {eventToDelete?.isRecurring ? (
               <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                 <div style={{ padding: "0.75rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 500 }}>
                   Este agendamento é parte de uma Recorrência em Série.
                 </div>
                 <button className="btn btn-outline" style={{borderColor: "#ef4444", color: "#ef4444"}} onClick={() => executeDelete("single")}>Excluir Apenas Esta Data</button>
                 <button className="btn btn-primary" style={{background: "#ef4444", color: "white"}} onClick={() => executeDelete("series")}>Excluir Toda a Série (Este e Futuros)</button>
               </div>
            ) : (
               <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                 <button className="btn btn-primary" style={{background: "#ef4444", color: "white"}} onClick={() => executeDelete("single")}>Confirmar Exclusão</button>
               </div>
            )}
            
            <div style={{marginTop: "1.5rem"}}>
              <button type="button" className="btn btn-outline" style={{width: "100%"}} onClick={() => setEventToDelete(null)}>Cancelar e Voltar</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ----------------- PDF EXPORT INVISIBLE WORKER ----------------- */}
      {isExporting && (
        <CalendarPDFExport 
          events={events} 
          months={exportingDates} 
          onComplete={() => setIsExporting(false)} 
        />
      )}

      {/* ----------------- MAIN VIEW ----------------- */}
      <div className="calendar-layout">
        <aside className="calendar-sidebar">
          <div className="filter-card premium-card">
            <h3><Filter size={18} /> Filtrar por Ministério</h3>
            <select 
              className="input" 
              value={selectedMinistry} 
              onChange={(e) => setSelectedMinistry(e.target.value)}
            >
              <option value="">Todos os Eventos</option>
              {ministries.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="calendar-card premium-card">
            <DayPicker
              mode="single"
              selected={selectedDay}
              onSelect={setSelectedDay}
              locale={ptBR}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="custom-datepicker"
            />
          </div>
        </aside>

        <main className="events-main">
          <div className="events-header">
            <h2>{selectedDay ? format(selectedDay, "eeee, dd 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}</h2>
            <span>{selectedDayEvents.length} eventos programados</span>
          </div>

          <div className="events-list">
            {loading ? (
              <p>Carregando eventos...</p>
            ) : selectedDayEvents.length > 0 ? (
              selectedDayEvents.map(event => (
                <div key={event.id} className="event-item premium-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "1.5rem", flex: 1 }}>
                    <div className="event-time">
                      <span className="start">{event.startTime || "--:--"}</span>
                      {event.endTime && <span className="end">{event.endTime}</span>}
                    </div>
                    <div className="event-details" style={{ flex: 1 }}>
                      <h3>{event.title} {event.isRecurring && <span style={{fontSize: "0.7rem", color: "#f59e0b", background: "#fef3c7", padding: "2px 6px", borderRadius: "8px", marginLeft: "4px"}}>SÉRIE</span>}</h3>
                      <p className="location">{event.location}</p>
                      
                      {(event.minister || event.worship) && (
                        <div style={{ fontSize: "0.875rem", color: "var(--secondary)", margin: "0.5rem 0", display: "flex", gap: "1.5rem" }}>
                          {event.minister && <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>📖 Palavra: <strong>{event.minister}</strong></span>}
                          {event.worship && <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>🎵 Louvor: <strong>{event.worship}</strong></span>}
                        </div>
                      )}

                      <div className="ministry-tags">
                        {event.requirements.map(req => (
                          <span key={req.ministry.id} className="ministry-tag">
                            {req.ministry.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="event-actions" style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn-icon edit" onClick={() => { setEventToEdit(event); setIsModalOpen(true); }}><Edit size={18} /></button>
                      <button className="btn-icon delete" onClick={() => setEventToDelete(event)}><Trash2 size={18} /></button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Nenhum evento para este dia.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEventToEdit(null); }} 
        onSave={handleSaveEvent}
        ministries={ministries}
        initialDate={selectedDay}
        eventToEdit={eventToEdit}
      />
    </DashboardShell>
  );
}
