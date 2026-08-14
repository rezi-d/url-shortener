import { useState, FormEvent } from "react";
import { api } from "../api";

interface Props {
  onCreated: () => void;
}

export function CreateForm({ onCreated }: Props) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createUrl(originalUrl, customCode);
      setOriginalUrl("");
      setCustomCode("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat short url");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="url"
          placeholder="https://contoh.com/artikel-panjang"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          required
          style={{ flex: 2, minWidth: 240, padding: 8 }}
        />
        <input
          type="text"
          placeholder="custom code (opsional)"
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
          style={{ flex: 1, minWidth: 160, padding: 8 }}
        />
        <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Membuat..." : "Buat Short URL"}
        </button>
      </div>
      {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
    </form>
  );
}
