
<script setup lang="ts">
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useRouter } from 'vue-router';
import { LOGIN } from '../graphql/auth';

const router = useRouter();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

const { mutate: login } = useMutation(LOGIN);

async function handleLogin() {
  errorMessage.value = '';
  loading.value = true;

  try {
    const result = await login({
      input: {
        email: email.value.trim(),
        password: password.value,
      },
    });

    const payload = result?.data?.login;

    if (!payload?.accessToken || !payload?.user) {
      throw new Error('Login response was incomplete.');
    }

    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('user', JSON.stringify(payload.user));

    await router.push('/');
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>Welcome back</h1>
      <p>Log in to your SupportDesk account.</p>

      <form @submit.prevent="handleLogin">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
        />

        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />

        <p v-if="errorMessage" class="error-message" role="alert">
          {{ errorMessage }}
        </p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <p class="auth-footer">
        Need an account?
        <RouterLink to="/register">Create one</RouterLink>
      </p>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f4f6fb;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgb(0 0 0 / 6%);
}

h1 {
  margin: 0 0 8px;
  color: #111827;
}

.auth-card > p {
  color: #6b7280;
}

form {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}

label {
  font-weight: 600;
  color: #374151;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font: inherit;
}

button {
  margin-top: 12px;
  padding: 12px;
  border: 0;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #b91c1c;
  overflow-wrap: anywhere;
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
}

a {
  color: #2563eb;
}
</style>
