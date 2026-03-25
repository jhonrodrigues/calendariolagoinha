"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  location?: string;
}

interface PDFExportProps {
  events: Event[];
  months: Date[];
  onComplete: () => void;
}

export default function CalendarPDFExport({ events, months, onComplete }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);
    
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    try {
        for (let i = 0; i < months.length; i++) {
        const month = months[i];
        const element = document.getElementById(`pdf-render-area-${month.getTime()}`);
        if (!element) continue;

        // Use a high scale for better quality
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        
        if (i < months.length - 1) {
            pdf.addPage();
        }
        }
        
        const filename = months.length > 1 
            ? `Agenda_Lagoinha_Multiplos_Meses.pdf` 
            : `Agenda_Lagoinha_${format(months[0], "MMMM_yyyy", { locale: ptBR })}.pdf`;
            
        pdf.save(filename);
    } catch(err) {
        console.error("PDF engine crash", err);
    }

    setIsExporting(false);
    onComplete();
  };

  useEffect(() => {
    // Adding a slight delay to ensure fonts and layout recalculations complete inside hidden viewport
    setTimeout(() => {
        generatePDF();
    }, 500);
  }, []);

  return (
    <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
      {months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: ptBR });
        const endDate = endOfWeek(monthEnd, { locale: ptBR });
        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
        const numWeeks = Math.ceil(calendarDays.length / 7);

        return (
          <div key={month.getTime()} id={`pdf-render-area-${month.getTime()}`} style={{ 
            width: "297mm", 
            padding: "20mm", 
            background: "white", 
            color: "black",
            fontFamily: "'Inter', sans-serif"
          }}>
            <div style={{ textAlign: "center", marginBottom: "10mm" }}>
              <h1 style={{ margin: 0, fontSize: "24pt" }}>A G E N D A</h1>
              <h2 style={{ margin: "2mm 0", fontSize: "18pt", textTransform: "uppercase" }}>
                {format(month, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <p style={{ color: "#666" }}>Igreja Batista Lagoinha</p>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(7, 1fr)", 
              border: "1pt solid #000",
              borderCollapse: "collapse"
            }}>
              {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map(day => (
                <div key={day} style={{ 
                  padding: "2mm", 
                  textAlign: "center", 
                  fontWeight: "bold", 
                  border: "1pt solid #000",
                  background: "#f3f4f6"
                }}>
                  {day}
                </div>
              ))}

              {calendarDays.map((date, i) => {
                const dayEvents = events.filter(e => format(parseISO(e.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));
                
                return (
                  <div key={i} style={{ 
                    height: numWeeks > 5 ? "21mm" : "25mm", 
                    border: "1pt solid #000", 
                    padding: "1mm",
                    background: isSameMonth(date, monthStart) ? "white" : "#fbfbfb",
                    color: isSameMonth(date, monthStart) ? "black" : "#999"
                  }}>
                    <div style={{ fontWeight: "bold", fontSize: "10pt", marginBottom: "1mm" }}>
                      {format(date, "d")}
                    </div>
                    {dayEvents.slice(0, 4).map(event => (
                      <div key={event.id} style={{ fontSize: "7pt", lineHeight: "1.1", marginBottom: "1mm" }}>
                        <strong>{event.startTime}</strong> {event.title.substring(0, 25)}
                        <br />
                        <em style={{ color: "#666" }}>{event.location?.substring(0, 20)}</em>
                      </div>
                    ))}
                    {dayEvents.length > 4 && <div style={{ fontSize: "6pt" }}>+ {dayEvents.length - 4} mais</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
