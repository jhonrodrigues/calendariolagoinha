"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    if (isRegistering) {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        
        if (res.ok) {
           setSuccessMsg("Conta criada com sucesso! Conectando à plataforma...");
           setIsRegistering(false);
           // Proceeds structurally downward to Auto-SignIn without breaking flow
        } else {
           const data = await res.json();
           setError(data.error || "Erro ao criar conta.");
           setLoading(false);
           return; 
        }
      } catch (err) {
        setError("Erro de conexão com o painel.");
        setLoading(false);
        return;
      }
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(isRegistering ? "Conta criada, porém houve um erro no redirecionamento. Faça login." : "Credenciais inválidas. Verifique seu E-mail e Senha.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Serviço indisponível no momento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card premium-card">
        <div className="login-header">
          <h1>Eventos Lagoinha</h1>
          <p>{isRegistering ? "Cadastro de Novo Líder" : "Gestão de Calendário e Escalas"}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {successMsg && <div style={{background: "#ecfdf5", color: "#065f46", padding: "10px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px", textAlign: "center"}}>{successMsg}</div>}
          
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="name">Nome Completo</label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegistering}
                placeholder="Seu nome"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email de Acesso</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@gmaill.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha Forte</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder={isRegistering ? "Mínimo 6 caracteres" : "••••••••"}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Processando conexão..." : (isRegistering ? "Criar Conta de Acesso" : "Entrar na Plataforma")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button 
            type="button" 
            onClick={() => { setIsRegistering(!isRegistering); setError(""); setSuccessMsg(""); }}
            style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "14px", textDecoration: "underline", fontWeight: "500" }}
          >
            {isRegistering ? "Já tenho uma conta. Quero Fazer Login" : "Não possuo acesso. Fazer Cadastro de Líder"}
          </button>
        </div>
      </div>
    </div>
  );
}
