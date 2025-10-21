<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';

// ⚙️ URL base del backend (Vite): define VITE_API_URL en el .env del frontend.
// Si no existe, usa http://localhost:3000 por defecto.
const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://zero2-backend-fdsq.onrender.com';

// Tipos que usa tu UI
type Msg = { type: 'ok' | 'error'; text: string };
type User = { id: number; login: string };             // lo que renderiza la tabla
type NewUser = { login: string; password: string };    // lo que captura tu form

const loadingList = ref(false);
const loadingCreate = ref(false);
const users = ref<User[]>([]);
const msg = ref<Msg | null>(null);

const form = reactive<NewUser>({ login: '', password: '' });

const canSubmit = computed(
  () => form.login.trim().length > 0 && form.password.trim().length >= 4
);

// GET /Usuario -> backend devuelve [{id,name,pass}], lo mapeamos a [{id,login}]
async function fetchUsers() {
  loadingList.value = true;
  msg.value = null;
  try {
    const res = await fetch(`${BASE_URL}/Usuario`, { method: 'GET' });
    const body = await res.json().catch(() => []);
    if (!res.ok) throw new Error((body?.error || res.statusText || 'Error al listar usuarios'));

    const mapped: User[] = Array.isArray(body)
      ? body.map((r: any) => ({ id: r.id, login: String(r.name ?? '') }))
      : [];

    users.value = mapped;
  } catch (e: any) {
    msg.value = { type: 'error', text: e?.message || 'No se pudieron cargar los usuarios.' };
  } finally {
    loadingList.value = false;
  }
}

// POST /Usuario -> backend espera {name, pass}. Tu form usa {login, password}.
async function onSubmit(e: Event) {
  e.preventDefault();
  if (!canSubmit.value) {
    msg.value = { type: 'error', text: 'Completa el login y una contraseña (mín. 4 caracteres).' };
    return;
  }
  loadingCreate.value = true;
  msg.value = null;

  try {
    const res = await fetch(`${BASE_URL}/Usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Adaptador: login/password -> name/pass
      body: JSON.stringify({ name: form.login.trim(), pass: form.password })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const extra =
        res.status === 409 ? ' (login existente)' :
        res.status === 422 ? ' (datos inválidos)' : '';
      throw new Error((body?.error || 'Error registrando usuario.') + extra);
    }

    msg.value = { type: 'ok', text: 'Usuario registrado correctamente.' };
    form.login = '';
    form.password = '';
    await fetchUsers();
  } catch (e: any) {
    msg.value = { type: 'error', text: e?.message || 'Error registrando usuario.' };
  } finally {
    loadingCreate.value = false;
  }
}

onMounted(fetchUsers);
</script>

<template>
  <main class="page">
    <section class="card">
      <h2>Registrar usuario</h2>
      <form @submit="onSubmit" class="form">
        <div class="row">
          <label for="login">Login</label>
          <input id="login" v-model.trim="form.login" placeholder="ej. SHIARA" autocomplete="username" required />
        </div>

        <div class="row">
          <label for="password">Password</label>
          <input id="password" v-model="form.password" type="password" minlength="4"
                 placeholder="mín. 4 caracteres" autocomplete="new-password" required />
        </div>

        <button :disabled="!canSubmit || loadingCreate" type="submit">
          {{ loadingCreate ? 'Guardando...' : 'Registrar' }}
        </button>

        <p v-if="msg" :class="msg.type === 'ok' ? 'ok' : 'error'">{{ msg.text }}</p>
      </form>
    </section>

    <section class="card">
      <div class="header">
        <h2>Usuarios registrados</h2>
        <button class="ghost" @click="fetchUsers" :disabled="loadingList">
          {{ loadingList ? 'Actualizando...' : 'Refrescar' }}
        </button>
      </div>

      <div v-if="loadingList" class="muted">Cargando lista...</div>
      <div v-else-if="users.length === 0" class="muted">No hay usuarios.</div>
      <table v-else class="table">
        <thead>
          <tr><th style="width:1%">#</th><th>Login</th></tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in users" :key="u.id ?? u.login">
            <td>{{ i + 1 }}</td>
            <td>{{ u.login }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
.page { min-height: 100svh; background: #f6f7fb; display: grid; gap: 24px; padding: 24px 16px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; max-width: 900px; margin: 0 auto; box-shadow: 0 6px 18px rgba(0,0,0,.06); }
h2 { margin: 0 0 12px; }
.form { display: grid; gap: 12px; max-width: 520px; }
.row { display: grid; gap: 6px; }
label { font-weight: 600; }
input { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; outline: none; }
input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.15); }
button { background: #4f46e5; color: #fff; border: none; border-radius: 10px; padding: 10px 14px; cursor: pointer; font-weight: 600; width: max-content; }
button:disabled { opacity: .6; cursor: not-allowed; }
button.ghost { background: transparent; color: #4f46e5; border: 1px solid #cbd5e1; }
.header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th, td { text-align: left; border-bottom: 1px solid #e5e7eb; padding: 10px 8px; }
.muted { color: #6b7280; font-style: italic; }
.ok { color: #0f766e; }
.error { color: #dc2626; }
</style>
