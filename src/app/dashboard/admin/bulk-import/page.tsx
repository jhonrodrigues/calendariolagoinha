"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Upload, Database, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { useSession } from "next-auth/react";

export default function BulkImportPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [importType, setImportType] = useState("ministry");
  const [rawData, setRawData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    if (!rawData.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // Simple CSV Parser logic
      const lines = rawData.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const dataRows = lines.slice(1);

      const items = dataRows.map(row => {
        const values = row.split(",").map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });

      const resp = await fetch("/api/admin/bulk-import", {
        method: "POST",
        body: JSON.stringify({ type: importType, items }),
        headers: { "Content-Type": "application/json" }
      });

      if (resp.ok) {
        const res = await resp.json();
        setResult({ success: true, count: res.count });
        setRawData("");
      } else {
        const err = await resp.json();
        setResult({ success: false, error: err.error });
      }
    } catch (err: any) {
      setResult({ success: false, error: "Falha ao processar CSV: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== "ADMIN_MASTER") {
    return <div className="p-8">Acesso Negado. Apenas Admin Master.</div>;
  }

  return (
    <DashboardShell>
      <header className="page-header">
        <div>
          <h1>Importação em Massa</h1>
          <p>Cadastre centenas de itens de uma só vez via CSV</p>
        </div>
      </header>

      <div className="grid gap-6 mt-6">
        <div className="premium-card p-6">
          <div className="form-group">
            <label>O que você deseja importar?</label>
            <select 
              className="input" 
              value={importType} 
              onChange={(e) => setImportType(e.target.value)}
            >
              <option value="ministry">Ministérios (Coluna: name)</option>
              <option value="space">Espaços Físicos (Colunas: name, description)</option>
              <option value="event">Eventos (Colunas: title, date, startTime, endTime, responsible...)</option>
            </select>
          </div>

          <div className="form-group mt-4">
            <label>Cole aqui os dados em formato CSV (Primeira linha deve ser o cabeçalho)</label>
            <textarea
              className="input font-mono text-sm"
              rows={12}
              placeholder={
                importType === "ministry" ? "name\nLouvor\nKids\nMissões" :
                importType === "space" ? "name,description\nAuditório,Capacidade 500\nSala 01,Com ar condicionado" :
                "title,date,startTime,endTime,responsible\nCulto Ágape,2024-04-01,19:00,21:00,Pr. João"
              }
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-primary mt-6 w-full" 
            onClick={handleImport}
            disabled={loading || !rawData.trim()}
          >
            {loading ? "Processando..." : (
              <>
                <Upload size={20} />
                <span>Iniciar Importação</span>
              </>
            )}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${result.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {result.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <div>
                <p className="font-bold">{result.success ? "Sucesso!" : "Erro na Importação"}</p>
                <p className="text-sm">{result.success ? `${result.count} itens importados com sucesso.` : result.error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="premium-card p-6 bg-blue-50 border-blue-100">
          <h3 className="flex items-center gap-2 text-blue-800 mb-3">
            <FileText size={20} />
            Dicas Importantes
          </h3>
          <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
            <li>Sempre inclua o cabeçalho na primeira linha (nome das colunas).</li>
            <li>Datas devem seguir o formato internacional: **AAAA-MM-DD** (Ex: 2024-12-31).</li>
            <li>Horários devem ser no formato **HH:MM** (Ex: 19:30).</li>
            <li>Se importar Ministérios, o sistema evitará duplicados automaticamente.</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
