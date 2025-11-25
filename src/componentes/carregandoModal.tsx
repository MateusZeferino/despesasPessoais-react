// src/components/LoadingModal.tsx
import React from "react";

interface carregandoModalProps {
  open: boolean;        // se true, mostra o modal; se false, não renderiza nada
  message?: string;     // mensagem opcional, padrão "Carregando..."
}

const carregandoModal: React.FC<carregandoModalProps> = ({ open, message = "Carregando..." }) => {
  // Se não estiver "open", não renderiza nada
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",          // fixa na tela inteira
        inset: 0,                   // top, right, bottom, left = 0
        backgroundColor: "rgba(0,0,0,0.35)", // fundo escurecido
        display: "flex",            // centraliza o conteúdo
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,               // fica por cima de tudo
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "24px 32px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          minWidth: "220px",
        }}
      >
        {/* "Íconezinho" simples */}
        <div
          style={{
            fontSize: "32px",
          }}
        >
          ⏳
        </div>

        <div
          style={{
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
};

export default carregandoModal;
