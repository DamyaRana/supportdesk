
<script setup lang="ts">
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useRouter } from 'vue-router';
import { REGISTER } from '../graphql/auth';

const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const loading = ref(false);

const { mutate: register } = useMutation(REGISTER);

async function handleRegister() {
  errorMessage.value = '';

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }

  if (password.value.length < 8 || password.value.length > 72) {
    errorMessage.value = 'Password must be between 8 and 72 characters.';
    return;
  }

  loading.value = true;

  try {
    const result = await register({
      input: {
        name: name.value.trim(),
        email: email.value.trim().toLowerCase(),
        password: password.value,
      },
    });

    const payload = result?.data?.register;

    if (!payload?.accessToken || !payload?.user) {
      throw new Error('Registration response was incomplete.');
    }

    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('user', JSON.stringify(payload.user));

    await router.push('/');
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>Create your account</h1>
      <p>Join SupportDesk to manage your support requests.</p>

      <form @submit.prevent="handleRegister">
        <label for="name">Full name</label>
        <input
          id="name"
          v-model="name"
          type="text"
          minlength="2"
          maxlength="100"
          autocomplete="name"
          required
        />

        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          maxlength="191"
          autocomplete="email"
          required
        />

        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          minlength="8"
          maxlength="72"
          autocomplete="new-password"
          required
        />

        <label for="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          required
        />

        <p v-if="errorMessage" class="error-message" role="alert">
          {{ errorMessage }}
        </p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account?
        <RouterLink to="/login">Log in</RouterLink>
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
