const BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
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
  const res  = await fetch(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.message) ?? `Erreur ${res.status}`);
  return data;
}

export const api = {
  get:  (path)       => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put:  (path, body) => apiFetch(path, { method: "PUT",  body: JSON.stringify(body) }),
};
