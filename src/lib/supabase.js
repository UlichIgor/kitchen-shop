// Browser-safe Supabase REST/Auth helpers. Never place a service-role key here.
export const SUPABASE_URL = "https://nikenipaqtlpvhpldgtf.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_PqoZAHi8x1uv6JwJO4tOlg_Oont9qSA";

const SESSION_KEY = "kitchen-shop-admin-session";

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function saveSession(session) {
  if (session?.access_token && session?.refresh_token) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}
async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || "Помилка запиту до Supabase.");
  return data;
}
async function refreshSession() {
  const current = readSession();
  if (!current?.refresh_token) throw new Error("Сесію завершено. Увійдіть знову.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: current.refresh_token }),
  });
  const next = await parseResponse(response);
  saveSession(next);
  return next;
}
export function getStoredSession() { return readSession(); }
export function clearAdminSession() { saveSession(null); }

export async function signUpAdmin(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponse(response);
  if (data.access_token) saveSession(data);
  return data;
}
export async function signInAdmin(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponse(response);
  saveSession(data);
  return data;
}
export async function adminRequest(path, options = {}) {
  let session = readSession();
  if (!session?.access_token) throw new Error("Спочатку увійдіть до панелі.");
  if (session.expires_at && session.expires_at * 1000 < Date.now() + 30000) session = await refreshSession();
  const send = (token) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  let response = await send(session.access_token);
  if (response.status === 401) {
    session = await refreshSession();
    response = await send(session.access_token);
  }
  return parseResponse(response);
}
export async function getAuthUser() {
  let session = readSession();
  if (!session?.access_token) return null;
  if (session.expires_at && session.expires_at * 1000 < Date.now() + 30000) session = await refreshSession();
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}` },
  });
  if (response.status === 401) {
    session = await refreshSession();
    const retry = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}` },
    });
    return parseResponse(retry);
  }
  return parseResponse(response);
}
export async function signOutAdmin() {
  const session = readSession();
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {});
  }
  clearAdminSession();
}
