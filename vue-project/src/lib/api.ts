// src/lib/api.ts
export type User = { id: number; login: string };
export type NewUser = { login: string; password: string };

type Ok<T> = { ok: true; data: T; status: number };
type Err = { ok: false; error: string; status: number };
export type ApiResponse<T> = Ok<T> | Err;

// Vite tipa import.meta.env; si no tienes VITE_API_URL, cae a localhost:
const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

// Normaliza respuestas en un tipo uniforme
async function toApiResponse<T>(res: Response, map?: (x: any) => T): Promise<ApiResponse<T>> {
  const status = res.status;
  let body: any = null;
  try { body = await res.json(); } catch { /* puede no traer body */ }

  if (res.ok) {
    const data = map ? map(body) : body;
    return { ok: true, data, status };
  }
  const msg = (body && (body.error || body.message)) || res.statusText || 'Error';
  return { ok: false, error: msg, status };
}

// GET /Usuario  (backend devuelve {id,name,pass}[])
export async function listUsers(): Promise<ApiResponse<User[]>> {
  try {
    const res = await fetch(`${BASE_URL}/Usuario`, { method: 'GET' });
    return toApiResponse<User[]>(res, (rows: any[]) =>
      Array.isArray(rows) ? rows.map(r => ({ id: r.id, login: String(r.name ?? '') })) : []
    );
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Fallo de red', status: 0 };
  }
}

// POST /Usuario  (backend espera {name,pass})
export async function createUser(payload: NewUser): Promise<ApiResponse<User>> {
  try {
    const res = await fetch(`${BASE_URL}/Usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: payload.login, pass: payload.password }),
    });
    return toApiResponse<User>(res, (r: any) => ({ id: r.id, login: String(r.name ?? '') }));
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Fallo de red', status: 0 };
  }
}

export const api = { listUsers, createUser };
