import { useEffect, useState, useCallback } from "react";
import { api, ShortUrl } from "./api";
import { CreateForm } from "./components/CreateForm";
import { UrlList } from "./components/UrlList";

export default function App() {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [source, setSource] = useState("db");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listUrls();
      setUrls(res.data);
      setSource(res.source);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>URL Shortener + Analytics</h1>
      <p style={{ color: "#666" }}>
        Portofolio: Node.js + TypeScript + Express + Prisma + PostgreSQL + Redis + React + Docker.
      </p>
      <CreateForm onCreated={refresh} />
      {loading ? <p>Memuat...</p> : <UrlList urls={urls} source={source} onChanged={refresh} />}
    </div>
  );
}
