/**
 * api.js — Wrapper fetch centralisé
 * Injecte automatiquement le token JWT depuis le localStorage
 * et normalise les erreurs HTTP en exceptions JavaScript.
 *
 * Utilisation :
 * import { api } from '../lib/api';
 * const articles = await api.get('/api/articles');
 * const created  = await api.post('/api/articles', { code, designation, … });
 */

const BASE_URL = "https://mlstock-backend-3.onrender.com";
const TOKEN_KEY = "mlstock_token";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res  = await fetch(`${BASE_URL}${path}`, { ...options, headers });
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