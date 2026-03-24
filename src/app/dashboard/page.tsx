"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { ArrowRight, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const resp = await fetch("/api/events");
        const data = await resp.json();
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const future = data
          .filter((e: any) => parseISO(e.date) >= today)
          .sort((a: any, b: any) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
          .slice(0, 15);
          
        setUpcomingEvents(future);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Visão Geral</h1>
          <p>Seus próximos eventos em sequência</p>
        </div>
        <Link href="/dashboard/calendar" className="btn btn-outline">
          <CalendarIcon size={18} /> Acessar Calendário Completo
        </Link>
      </header>

      <div className="upcoming-feed premium-card">
        <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={20} color="var(--accent)" /> Próximas Escalas
        </h2>
        
        {loading ? (
          <p>Carregando feed...</p>
        ) : upcomingEvents.length > 0 ? (
          <div className="feed-list">
            {upcomingEvents.map(event => (
              <div key={event.id} className="feed-item">
                <div className="feed-date-badge">
                  <span className="month">{format(parseISO(event.date), "MMM", { locale: ptBR })}</span>
                  <span className="day">{format(parseISO(event.date), "dd")}</span>
                </div>
                
                <div className="feed-content">
                  <h3 className="feed-title">{event.title}</h3>
                  <div className="feed-meta">
                    <span className="meta-item"><Clock size={14} /> {event.startTime || "--:--"} {event.endTime ? `às ${event.endTime}` : ""}</span>
                    {event.location && <span className="meta-item"><MapPin size={14} /> {event.location}</span>}
                  </div>
                  
                  {(event.minister || event.worship) && (
                    <div className="feed-ministers">
                      {event.minister && <span>📖 {event.minister}</span>}
                      {event.worship && <span>🎵 {event.worship}</span>}
                    </div>
                  )}

                  <div className="ministry-tags" style={{ marginTop: "0.5rem" }}>
                    {event.requirements?.map((req: any) => (
                      <span key={req.ministry.id} className="ministry-tag">{req.ministry.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Não há eventos futuros programados.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .upcoming-feed {
          max-width: 800px;
        }
        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .feed-item {
          display: flex;
          gap: 1.5rem;
          padding: 1rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          transition: background 0.2s;
        }
        .feed-item:hover {
          background: #f8fafc;
        }
        .feed-date-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: var(--accent);
          min-width: 60px;
          height: 60px;
          border-radius: var(--radius);
          text-transform: uppercase;
        }
        .feed-date-badge .month {
          font-size: 0.7rem;
          font-weight: 700;
        }
        .feed-date-badge .day {
          font-size: 1.25rem;
          font-weight: 800;
          line-height: 1;
        }
        .feed-content {
          flex: 1;
        }
        .feed-title {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
          color: var(--primary);
        }
        .feed-meta {
          display: flex;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: var(--secondary);
          margin-bottom: 0.5rem;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .feed-ministers {
          display: flex;
          gap: 1.5rem;
          font-size: 0.8rem;
          color: var(--primary);
          background: #f1f5f9;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          display: inline-flex;
        }
      `}</style>
    </DashboardShell>
  );
}
