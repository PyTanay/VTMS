import React from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  width?: string;
}

const Modal: React.FC<ModalProps> = ({ open, title, children, onClose, actions, width }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
        }}
      />
      {/* Dialog */}
      <div
        style={{
          position: "relative",
          background: "var(--secondary-bg)",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          width: width || "420px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "20px",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, color: "var(--text-primary)" }}>{children}</div>
        {actions && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
              padding: "12px 20px",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
