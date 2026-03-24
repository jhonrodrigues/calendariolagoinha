"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import EventModal from "@/components/event-modal";
import CalendarPDFExport from "@/components/calendar-pdf-export";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { Plus, Filter, ChevronLeft, ChevronRight, Download, Edit, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import "react-day-picker/dist/style.css";

interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
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

  const handleDeleteEvent = async (event: Event) => {
    let mode = "single";
    if (event.isRecurring) {
      if (confirm("Este evento faz parte de uma série. Você deseja excluir TODOS os eventos desta série? (Cancele para excluir apenas este dia)")) {
        mode = "series";
      } else {
        if (!confirm("Tem certeza que deseja excluir este único evento?")) return;
      }
    } else {
      if (!confirm("Tem certeza que deseja excluir o evento?")) return;
    }

    try {
      const resp = await fetch(`/api/events/${event.id}?mode=${mode}`, { method: "DELETE" });
      if (resp.ok) {
        fetchData();
      } else {
        alert("Erro ao excluir evento");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedDayEvents = events.filter(e => isSameDay(parseISO(e.date), selectedDay || new Date()));

  // Custom components for DayPicker to make it premium
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
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEventToEdit(null); setIsModalOpen(true); }}>
            <Plus size={20} />
            <span>Novo Evento</span>
          </button>
        )}
        <button className="btn btn-outline" onClick={() => setIsExporting(true)}>
          <Download size={20} />
          <span>Exportar PDF</span>
        </button>
      </header>

      {isExporting && (
        <CalendarPDFExport 
          events={events} 
          month={selectedDay || new Date()} 
          onComplete={() => setIsExporting(false)} 
        />
      )}

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
                      <button className="btn-icon delete" onClick={() => handleDeleteEvent(event)}><Trash2 size={18} /></button>
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
