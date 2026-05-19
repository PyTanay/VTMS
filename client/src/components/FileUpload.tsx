import React, { useState } from "react";
import api from "../api";

interface Props {
  applicationId?: number | string;
  onUploaded?: (item: any) => void;
}

const FileUpload: React.FC<Props> = ({ applicationId, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/uploads/file", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const { url, filename } = res.data;

      // If applicationId present, create a document verification record
      let created = null;
      if (applicationId) {
        const dv = await api.post("/document-verification", {
          applicationId: Number(applicationId),
          file_path: url,
          doc_type: file.name,
        });
        created = dv.data.data;
      }

      if (onUploaded) onUploaded(created || { url, filename });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      // reset input
      (e.target as HTMLInputElement).value = "";
    }
  };

  return (
    <div>
      <label style={{ display: "inline-block", marginBottom: 8 }}>
        <input type="file" onChange={handleFile} disabled={uploading} />
      </label>
      {uploading && <div>Uploading…</div>}
      {error && <div style={{ color: "#f87171" }}>{error}</div>}
    </div>
  );
};

export default FileUpload;
