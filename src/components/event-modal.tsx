"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Select from "react-select";
import { X, Calendar as CalendarIcon, Clock, MapPin, User as UserIcon } from "lucide-react";

interface Ministry {
  id: string;
  name: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any, editMode: string) => void;
  ministries: Ministry[];
  initialDate?: Date;
  eventToEdit?: any;
}

export default function EventModal({ isOpen, onClose, onSave, ministries, initialDate, eventToEdit }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [responsible, setResponsible] = useState("");
  const [minister, setMinister] = useState("");
  const [worship, setWorship] = useState("");
  const [selectedMinistries, setSelectedMinistries] = useState<any[]>([]);
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceCount, setRecurrenceCount] = useState(10);
  const [editMode, setEditMode] = useState("single");

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setTitle(eventToEdit.title);
        setDescription(eventToEdit.description || "");
        setDate(eventToEdit.date ? eventToEdit.date.split("T")[0] : "");
        setStartTime(eventToEdit.startTime || "");
        setEndTime(eventToEdit.endTime || "");
        setLocation(eventToEdit.location || "");
        setResponsible(eventToEdit.responsible || "");
        setMinister(eventToEdit.minister || "");
        setWorship(eventToEdit.worship || "");
        setRecurrence(eventToEdit.recurrenceRule || "none");
        
        if (eventToEdit.requirements) {
          setSelectedMinistries(eventToEdit.requirements.map((r: any) => ({
            value: r.ministry.id,
            label: r.ministry.name
          })));
        }
      } else {
        setTitle("");
        setDescription("");
        setDate(initialDate ? initialDate.toISOString().split("T")[0] : "");
        setStartTime("");
        setEndTime("");
        setLocation("");
        setResponsible("");
        setMinister("");
        setWorship("");
        setSelectedMinistries([]);
        setRecurrence("none");
      }
    }
  }, [isOpen, eventToEdit, initialDate]);

  const ministryOptions = ministries.map(m => ({ value: m.id, label: m.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: eventToEdit?.id,
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      responsible,
      minister,
      worship,
      ministryIds: selectedMinistries.map(m => m.value),
      recurrence: { type: recurrence, count: recurrenceCount },
      recurrenceRule: recurrence,
    }, editMode);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content wide">
          <div className="modal-header">
            <Dialog.Title>{eventToEdit ? "Editar Evento" : "Criar Novo Evento"}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="btn-close"><X size={20} /></button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-main">
              <div className="form-group">
                <label>Título do Evento</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Culto de Celebração" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><CalendarIcon size={14} /> Data</label>
                  <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label><Clock size={14} /> Início</label>
                  <input type="time" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label><Clock size={14} /> Fim</label>
                  <input type="time" className="input" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><MapPin size={14} /> Local</label>
                  <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Auditório Principal..." />
                </div>
                <div className="form-group">
                  <label><UserIcon size={14} /> Responsável</label>
                  <input className="input" value={responsible} onChange={e => setResponsible(e.target.value)} placeholder="Pr. João..." />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📖 Ministração</label>
                  <input className="input" value={minister} onChange={e => setMinister(e.target.value)} placeholder="Quem vai pregar?" />
                </div>
                <div className="form-group">
                  <label>🎵 Louvor</label>
                  <input className="input" value={worship} onChange={e => setWorship(e.target.value)} placeholder="Quem vai cantar?" />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              </div>
            </div>

            <div className="form-sidebar">
              {eventToEdit && eventToEdit.isRecurring && (
                <div className="form-group" style={{ background: "#fef3c7", padding: "1rem", borderRadius: "8px", border: "1px solid #f59e0b" }}>
                  <label style={{ color: "#b45309" }}>Opções de Edição (Evento Recorrente)</label>
                  <select className="input" value={editMode} onChange={e => setEditMode(e.target.value)}>
                    <option value="single">Editar apenas este dia</option>
                    <option value="series">Editar este e todos os futuros</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Ministérios Necessários</label>
                <Select
                  isMulti
                  options={ministryOptions}
                  value={selectedMinistries}
                  onChange={(val: any) => setSelectedMinistries(val)}
                  placeholder="Selecione..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {!eventToEdit && (
                <div className="form-group">
                  <label>Recorrência (Multiplicar Evento)</label>
                  <select className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                    <option value="none">Nenhuma</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              )}

              {recurrence !== "none" && !eventToEdit && (
                <div className="form-group">
                  <label>Quantidade de Repetições</label>
                  <input type="number" className="input" value={recurrenceCount} onChange={e => setRecurrenceCount(Number(e.target.value))} min={1} max={52} />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{eventToEdit ? "Salvar Alterações" : "Salvar Evento"}</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>

    </Dialog.Root>
  );
}
