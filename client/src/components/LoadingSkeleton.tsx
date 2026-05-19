import React from "react";

interface Props {
  lines?: number;
  type?: "table" | "card" | "text";
}

const LoadingSkeleton: React.FC<Props> = ({ lines = 3, type = "text" }) => {
  const shimmer = {
    background: "linear-gradient(90deg, var(--border-color) 25%, #f1f5f9 50%, var(--border-color) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s ease-in-out infinite",
    borderRadius: "6px",
  };

  if (type === "card") {
    return (
      <div className="panel">
        <div className="panel-body">
          <div style={{ ...shimmer, height: "20px", width: "60%", marginBottom: "12px" }} />
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} style={{ ...shimmer, height: "14px", width: `${70 + Math.random() * 30}%`, marginBottom: "8px" }} />
          ))}
        </div>
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="panel">
        <div className="panel-body">
          <div style={{ ...shimmer, height: "16px", width: "100%", marginBottom: "12px" }} />
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
              <div style={{ ...shimmer, height: "12px", width: "15%", flexShrink: 0 }} />
              <div style={{ ...shimmer, height: "12px", width: "25%" }} />
              <div style={{ ...shimmer, height: "12px", width: "20%" }} />
              <div style={{ ...shimmer, height: "12px", width: "25%" }} />
              <div style={{ ...shimmer, height: "12px", width: "15%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ ...shimmer, height: "14px", width: `${50 + Math.random() * 50}%`, marginBottom: "8px" }} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
