"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import EventModal from "@/components/event-modal";
import CalendarPDFExport from "@/components/calendar-pdf-export";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { Plus, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useSession } from "next-auth/react";
import "react-day-picker/dist/style.css";

interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
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

  const handleSaveEvent = async (eventData: any) => {
    try {
      const resp = await fetch("/api/events", {
        method: "POST",
        body: JSON.stringify(eventData),
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        fetchData();
        setIsModalOpen(false);
      } else {
        alert("Erro ao salvar evento");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar evento");
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
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
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
                <div key={event.id} className="event-item premium-card">
                  <div className="event-time">
                    <span className="start">{event.startTime || "--:--"}</span>
                    {event.endTime && <span className="end">{event.endTime}</span>}
                  </div>
                  <div className="event-details">
                    <h3>{event.title}</h3>
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
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvent}
        ministries={ministries}
        initialDate={selectedDay}
      />

      <style jsx>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .calendar-layout { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; }
        .calendar-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
        .filter-card h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; margin-bottom: 1rem; }
        .calendar-card { padding: 1rem !important; display: flex; justify-content: center; }
        .events-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
        .events-header h2 { text-transform: capitalize; }
        .events-header span { color: var(--secondary); font-size: 0.875rem; }
        .events-list { display: flex; flex-direction: column; gap: 1rem; }
        .event-item { display: flex; gap: 1.5rem; padding: 1.25rem !important; transition: transform 0.2s; }
        .event-time { display: flex; flex-direction: column; min-width: 60px; font-weight: 700; color: var(--accent); }
        .event-time .end { font-size: 0.75rem; color: var(--secondary); font-weight: 400; }
        .event-details h3 { font-size: 1.125rem; margin-bottom: 0.25rem; }
        .event-details .location { font-size: 0.875rem; color: var(--secondary); margin-bottom: 0.75rem; }
        .ministry-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .ministry-tag { background: #eff6ff; color: #2563eb; padding: 0.25rem 0.625rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
        .empty-state { padding: 3rem; text-align: center; color: var(--secondary); background: var(--card); border: 2px dashed var(--border); border-radius: var(--radius); }
        
        :global(.custom-datepicker) { margin: 0; }
        :global(.rdp-day_selected) { background-color: var(--accent) !important; color: white !important; }
        
        @media (max-width: 1024px) {
          .calendar-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </DashboardShell>
  );
}
