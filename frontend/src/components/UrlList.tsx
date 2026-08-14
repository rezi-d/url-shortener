import { useState } from "react";
import { ShortUrl, AnalyticsDetail, api, API_BASE_URL } from "../api";

interface Props {
  urls: ShortUrl[];
  source: string;
  onChanged: () => void;
}

export function UrlList({ urls, source, onChanged }: Props) {
  const [analytics, setAnalytics] = useState<Record<string, AnalyticsDetail>>({});
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const toggleAnalytics = async (code: string) => {
    if (analytics[code]) {
      const next = { ...analytics };
      delete next[code];
      setAnalytics(next);
      return;
    }
    const detail = await api.getAnalytics(code);
    setAnalytics((prev) => ({ ...prev, [code]: detail }));
  };

  const startEdit = (url: ShortUrl) => {
    setEditingCode(url.code);
    setEditValue(url.originalUrl);
  };

  const saveEdit = async () => {
    if (!editingCode) return;
    await api.updateUrl(editingCode, editValue);
    setEditingCode(null);
    onChanged();
  };

  const remove = async (code: string) => {
    if (!confirm(`Hapus short url "${code}"?`)) return;
    await api.deleteUrl(code);
    onChanged();
  };

  if (urls.length === 0) {
    return <p>Belum ada short url. Buat satu di atas.</p>;
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: "#666" }}>
        Data dimuat dari: <strong>{source === "cache" ? "Redis cache" : "database"}</strong>
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: 8 }}>Short URL</th>
            <th style={{ padding: 8 }}>Tujuan</th>
            <th style={{ padding: 8 }}>Klik</th>
            <th style={{ padding: 8 }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url) => (
            <>
              <tr key={url.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>
                  <a href={`${API_BASE_URL}/${url.code}`} target="_blank" rel="noreferrer">
                    /{url.code}
                  </a>
                </td>
                <td style={{ padding: 8, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {editingCode === url.code ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ width: "100%", padding: 4 }}
                    />
                  ) : (
                    url.originalUrl
                  )}
                </td>
                <td style={{ padding: 8 }}>{url._count?.clicks ?? 0}</td>
                <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                  {editingCode === url.code ? (
                    <>
                      <button onClick={saveEdit}>Simpan</button>{" "}
                      <button onClick={() => setEditingCode(null)}>Batal</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => toggleAnalytics(url.code)}>Analytics</button>{" "}
                      <button onClick={() => startEdit(url)}>Edit</button>{" "}
                      <button onClick={() => remove(url.code)}>Hapus</button>
                    </>
                  )}
                </td>
              </tr>
              {analytics[url.code] && (
                <tr key={`${url.id}-analytics`}>
                  <td colSpan={4} style={{ padding: 8, background: "#fafafa", fontSize: 13 }}>
                    Total klik: {analytics[url.code].totalClicks} — 50 klik terakhir:
                    <ul>
                      {analytics[url.code].recentClicks.map((c) => (
                        <li key={c.id}>
                          {new Date(c.clickedAt).toLocaleString("id-ID")} — {c.ipAddress || "unknown"}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
