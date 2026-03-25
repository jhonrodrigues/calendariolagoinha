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
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  const generatePDF = async (settings: any) => {
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

        // Use scale: 1.5 and JPEG compression to massively reduce PDF Weight (from 30MB+ to <1MB)
        const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
        const imgData = canvas.toDataURL("image/jpeg", 0.7);
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        
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

    onComplete();
  };

  useEffect(() => {
    // Fetch user formatting data, then wait 500ms for DOM layout flush before snapshotting
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setPlatformSettings(data);
        setTimeout(() => generatePDF(data), 500);
      })
      .catch(() => {
        setTimeout(() => generatePDF(null), 500);
      });
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

        const align = platformSettings?.pdfTitleAlign || "center";
        const flexAlign = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

        return (
          <div key={month.getTime()} id={`pdf-render-area-${month.getTime()}`} style={{ 
            width: "297mm", 
            padding: "20mm", 
            background: "white", 
            color: "black",
            fontFamily: "'Inter', sans-serif"
          }}>
            <div style={{ textAlign: align, marginBottom: "10mm", display: "flex", flexDirection: "column", alignItems: flexAlign }}>
              {platformSettings?.pdfLogo && (
                  <img src={platformSettings.pdfLogo} style={{ maxHeight: "25mm", marginBottom: "3mm", objectFit: "contain" }} alt="Logo" />
              )}
              <h1 style={{ margin: 0, fontSize: "24pt" }}>{platformSettings?.pdfTitle || "A G E N D A"}</h1>
              <h2 style={{ margin: "2mm 0", fontSize: "18pt", textTransform: "uppercase" }}>
                {format(month, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <p style={{ color: "#666" }}>{platformSettings?.pdfSubtitle || "Igreja Batista Lagoinha"}</p>
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
