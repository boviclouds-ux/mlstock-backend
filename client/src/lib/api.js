/**
 * api.js — Wrapper fetch centralisé
 *
 * Priorité pour la résolution de l'URL backend :
 *   1. import.meta.env.VITE_API_URL  (défini dans .env.production / variables Vite)
 *   2. http://localhost:5000          (dev local)
 *   3. ""                             (same-origin — déploiement Docker derrière Nginx)
 *
 * Pour Hostinger + Render : définir VITE_API_URL=https://mlstock-backend-2.onrender.com
 * Pour Docker On-Premise   : ne pas définir VITE_API_URL (Nginx proxie /api/ vers le backend)
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "").trim()
  || ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:5000"
      : "");

const TOKEN_KEY = "mlstock_token";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${cleanPath}`, { ...options, headers });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion réseau.");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? `Erreur ${res.status} — ${res.statusText}`);
  }

  // Réponse vide sur un appel attendant du JSON (hors 204 No Content)
  if (data === null && res.status !== 204) {
    throw new Error("La réponse du serveur est vide ou invalide.");
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