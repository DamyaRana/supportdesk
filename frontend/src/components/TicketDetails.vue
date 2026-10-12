
<script setup lang="ts">
interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

defineProps<{
  ticket: Ticket;
}>();

const emit = defineEmits<{
  close: [];
  edit: [ticket: Ticket];
}>();

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
</script>

<template>
  <section class="details-panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">TICKET #{{ ticket.id }}</p>
        <h2>{{ ticket.title }}</h2>
      </div>

      <button type="button" @click="emit('close')">
        Close
      </button>
    </div>

    <p class="description">{{ ticket.description }}</p>

    <div class="details-grid">
      <div>
        <span>Category</span>
        <strong>{{ ticket.category }}</strong>
      </div>

      <div>
        <span>Priority</span>
        <strong>{{ ticket.priority }}</strong>
      </div>

      <div>
        <span>Status</span>
        <strong>{{ ticket.status.replace('_', ' ') }}</strong>
      </div>

      <div>
        <span>Created</span>
        <strong>{{ formatDate(ticket.createdAt) }}</strong>
      </div>

      <div>
        <span>Last updated</span>
        <strong>{{ formatDate(ticket.updatedAt) }}</strong>
      </div>
    </div>

    <div class="panel-actions">
      <button type="button" @click="emit('edit', ticket)">
        Edit ticket
      </button>
    </div>
  </section>
</template>

<style scoped>
.details-panel {
  padding: 24px;
  margin-bottom: 24px;
  background: white;
  border: 1px solid #e2e6ef;
  border-radius: 14px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

h2 {
  margin: 4px 0 16px;
  overflow-wrap: anywhere;
}

.eyebrow {
  margin: 0;
  color: #6258e8;
  font-size: 12px;
  font-weight: 700;
}

.description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.6;
  color: #596176;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.details-grid div {
  display: grid;
  gap: 6px;
}

.details-grid span {
  color: #7c859b;
  font-size: 12px;
}

.details-grid strong {
  overflow-wrap: anywhere;
  font-size: 14px;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

button {
  padding: 10px 14px;
  border: 1px solid #e2e6ef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

button:hover {
  background: #f5f6fa;
}
</style>
