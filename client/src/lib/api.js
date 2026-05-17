/**
 * api.js — Wrapper fetch centralisé
 * Détecte automatiquement l'environnement (Local vs Production)
 */

// Détection automatique : si on est sur localhost, on utilise le port 5000, sinon le serveur Render en ligne
const BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://mlstock-backend-2.onrender.com";

const TOKEN_KEY = "mlstock_token";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  // On s'assure que le chemin commence bien par /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${BASE_URL}${cleanPath}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((data && data.message) ?? `Erreur ${res.status} — ${res.statusText}`);
  }

  return data;
}

export const api = {
  get:   (path)        => apiFetch(path),
  post:  (path, body)  => apiFetch(path, { method: "POST",   body: JSON.stringify(body) }),
  put:   (path, body)  => apiFetch(path, { method: "PUT",    body: JSON.stringify(body) }),
  patch: (path, body)  => apiFetch(path, { method: "PATCH",  body: JSON.stringify(body) }),
  del:   (path)        => apiFetch(path, { method: "DELETE" }),
};