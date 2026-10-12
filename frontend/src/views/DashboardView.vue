
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import {
  GET_TICKETS,
  CREATE_TICKET,
  UPDATE_TICKET,
  DELETE_TICKET,
} from '../graphql/tickets';
import { useRouter } from 'vue-router';
import TicketForm from '../components/TicketForm.vue';
import TicketDetails from '../components/TicketDetails.vue';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

interface CreateTicketForm {
  title: string;
  description: string;
  category: string;
}

const { resolveClient } = useApolloClient();
const client = resolveClient();

const tickets = ref<Ticket[]>([]);
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const formError = ref('');
const selectedTicket = ref<Ticket | null>(null);
const search = ref('');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');
const showCreateForm = ref(false);
const editingTicket = ref<Ticket | null>(null);
const editSaving = ref(false);
const editError = ref('');
const router = useRouter();
const otherCategory = ref('');

const currentUser = computed(() => {
  const savedUser = localStorage.getItem('user');

  try {
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
});

const isAdmin = computed(
  () => currentUser.value?.role === 'ADMIN',
);

function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');

  router.push('/login');
}
const emptyForm = (): CreateTicketForm => ({
  title: '',
  description: '',
  category: '',
});

const form = ref<CreateTicketForm>(emptyForm());
function viewTicket(ticket: Ticket) {
  selectedTicket.value = { ...ticket };
}

function closeTicketDetails() {
  selectedTicket.value = null;
}

function editSelectedTicket(ticket: Ticket) {
  selectedTicket.value = null;
  startEditing(ticket);
}
async function loadTickets() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await client.query({
      query: GET_TICKETS,
      fetchPolicy: 'network-only',
    });

    tickets.value = result.data.tickets;
  } catch (error) {
    console.error('Failed to load tickets:', error);
    errorMessage.value =
      'Unable to load tickets. Check the backend connection and try again.';
  } finally {
    loading.value = false;
  }
}


async function createTicket() {
  formError.value = '';

  const category =
    form.value.category === 'Other'
      ? otherCategory.value.trim()
      : form.value.category.trim();

  const input = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    category,
  };

  if (!input.title || !input.description || !input.category) {
    formError.value = 'Please fill in all required fields.';
    return;
  }

  if (input.title.length > 150 || input.category.length > 50) {
    formError.value =
      'Title must be at most 150 characters and category at most 50.';
    return;
  }

  submitting.value = true;

  try {
    const result = await client.mutate({
      mutation: CREATE_TICKET,
      variables: { input },
    });

    if (!result.data?.createTicket) {
      throw new Error('The server did not return the created ticket.');
    }

    form.value = emptyForm();
    otherCategory.value = '';
    showCreateForm.value = false;

    await loadTickets();
  } catch (error) {
    console.error('Failed to create ticket:', error);
    formError.value =
      'Could not create the ticket. Please check the GraphQL error in the browser console.';
  } finally {
    submitting.value = false;
  }
}


function startEditing(ticket: Ticket) {
  editingTicket.value = { ...ticket };
  editError.value = '';
}

function cancelEditing() {
  editingTicket.value = null;
  editError.value = '';
}

async function saveTicketChanges(values: {
  id: number;
  title: string;
  description: string;
  category: string;
  priority?: TicketPriority;
}) {
  editSaving.value = true;
  editError.value = '';

  try {
    const result = await client.mutate({
      mutation: UPDATE_TICKET,
      variables: {
        input: {
  id: Number(values.id),
  title: values.title,
  description: values.description,
  category: values.category,
  ...(isAdmin.value && values.priority
    ? { priority: values.priority }
    : {}),
},
      },
    });

    const updated = result.data?.updateTicket as Ticket | undefined;

    if (!updated) {
      throw new Error('The server did not return the updated ticket.');
    }

    tickets.value = tickets.value.map((ticket) =>
      ticket.id === updated.id
        ? { ...ticket, ...updated }
        : ticket,
    );

    editingTicket.value = null;
  } catch (error) {
    console.error('Failed to update ticket:', error);

    editError.value =
      error instanceof Error
        ? error.message
        : 'Unable to update the ticket. Please try again.';
  } finally {
    editSaving.value = false;
  }
}
async function deleteTicket(ticket: Ticket) {
  const confirmed = window.confirm(
    `Are you sure you want to delete ticket "${ticket.title}"?`,
  );

  if (!confirmed) return;

  try {
    await client.mutate({
      mutation: DELETE_TICKET,
      variables: {
        id: Number(ticket.id),
      },
    });

    tickets.value = tickets.value.filter(
      (item) => item.id !== ticket.id,
    );

    if (editingTicket.value?.id === ticket.id) {
      editingTicket.value = null;
    }
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    window.alert('Unable to delete this ticket. Please try again.');
  }
}

const updatingTicketId = ref<number | null>(null);
const updateError = ref('');


async function updateTicketStatus(ticket: Ticket, newStatus: TicketStatus) {
  if (!isAdmin.value) return;
  if (ticket.status === newStatus) return;

  const previousStatus = ticket.status;
  updatingTicketId.value = ticket.id;
  updateError.value = '';

  try {
    console.log('Updating ticket:', ticket.id, newStatus);

    const result = await client.mutate({
      mutation: UPDATE_TICKET,
      variables: {
        input: {
           id: Number(ticket.id),
          status: newStatus,
        },
      },
    });

    const updated = result.data?.updateTicket;

    if (!updated) {
      throw new Error('The server did not return the updated ticket.');
    }

    // Replace the ticket object instead of mutating Apollo's cached object.
    tickets.value = tickets.value.map((item) =>
      item.id === ticket.id
        ? { ...item, status: updated.status }
        : item,
    );

    console.log('Ticket status updated:', updated);
  } catch (error: unknown) {
    console.error('Status update failed:', error);

    const apolloError = error as {
      graphQLErrors?: Array<{ message: string }>;
      message?: string;
    };

    updateError.value =
      apolloError.graphQLErrors?.map((e) => e.message).join(', ') ||
      apolloError.message ||
      'Could not update ticket status.';
  } finally {
    updatingTicketId.value = null;
  }
}


const filteredTickets = computed(() =>
  tickets.value.filter((ticket) => {
    const term = search.value.trim().toLowerCase();

    const matchesSearch =
      ticket.title.toLowerCase().includes(term) ||
      ticket.category.toLowerCase().includes(term) ||
      String(ticket.id).includes(term);

    const matchesStatus =
      statusFilter.value === 'ALL' ||
      ticket.status === statusFilter.value;

    const matchesPriority =
      priorityFilter.value === 'ALL' ||
      ticket.priority === priorityFilter.value;

    return matchesSearch && matchesStatus && matchesPriority;
  }),
);

const openCount = computed(
  () => tickets.value.filter((t) => t.status === 'OPEN').length,
);

const inProgressCount = computed(
  () => tickets.value.filter((t) => t.status === 'IN_PROGRESS').length,
);

const resolvedCount = computed(
  () => tickets.value.filter((t) => t.status === 'RESOLVED').length,
);

const closedCount = computed(
  () => tickets.value.filter((t) => t.status === 'CLOSED').length,
);

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function statusLabel(status: TicketStatus) {
  return status.replace('_', ' ');
}

function openNewTicketForm() {
  formError.value = '';
  showCreateForm.value = true;
}

onMounted(() => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    loadTickets();
  }
});
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-icon">S</span>
        <span>SupportDesk</span>
      </div>

      <p class="nav-label">WORKSPACE</p>

      <a class="nav-item active" href="#" @click.prevent>
        <span>▦</span> Tickets
      </a>

      <div class="sidebar-note">
        <span class="status-dot"></span>
        Support system
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div>
          <p class="eyebrow">WORKSPACE / TICKETS</p>
          <h1>Ticket Dashboard</h1>
          <p class="subtitle">Manage and track support requests.</p>
        </div>

        <div class="header-actions">
          <button
            class="secondary-button"
            type="button"
            @click="loadTickets"
            :disabled="loading"
          >
            {{ loading ? 'Refreshing...' : '↻ Refresh' }}
          </button>

          <button
            class="primary-button"
            type="button"
            @click="openNewTicketForm"
          >
            + Create ticket
          </button>
          <button
  class="secondary-button"
  type="button"
  @click="logout"
>
  Log out
</button>
        </div>
      </header>

      <TicketDetails
  v-if="selectedTicket"
  :ticket="selectedTicket"
  @close="closeTicketDetails"
  @edit="editSelectedTicket"
/>

      <TicketForm
  v-if="editingTicket"
  :ticket="editingTicket"
  :saving="editSaving"
  :error-message="editError"
  :is-admin="isAdmin"
  @submit="saveTicketChanges"
  @cancel="cancelEditing"
/>

      <section v-if="showCreateForm" class="ticket-panel create-panel">
        <div class="panel-heading">
          <div>
            <h2>Create a ticket</h2>
            <p>Describe the issue that needs support.</p>
          </div>


          <button
            class="secondary-button"
            type="button"
            @click="showCreateForm = false"
            :disabled="submitting"
          >
            Cancel
          </button>
        </div>

        <form class="create-form" @submit.prevent="createTicket">
          <label>
            Ticket title *
            <input
              v-model="form.title"
              maxlength="150"
              required
              placeholder="e.g. Unable to log in"
            />
          </label>

          
            
<label>
  Category *
  <select v-model="form.category" required>
    <option disabled value="">Select a category</option>
    <option value="Technical Issue">Technical Issue</option>
    <option value="Account & Login">Account & Login</option>
    <option value="Billing & Payment">Billing & Payment</option>
    <option value="Feature Request">Feature Request</option>
    <option value="General Inquiry">General Inquiry</option>
    <option value="Other">Other</option>
  </select>
</label>

<label v-if="form.category === 'Other'">
  Specify category *
  <input
    v-model="otherCategory"
    maxlength="50"
    required
    placeholder="Enter your category"
  />
</label>


          <label>
            Description *
            <textarea
              v-model="form.description"
              required
              rows="4"
              placeholder="Explain the issue..."
            ></textarea>
          </label>

          

          <p v-if="formError" class="form-error" role="alert">
            {{ formError }}
          </p>

          <div class="form-actions">
            <button
              class="secondary-button"
              type="button"
              @click="showCreateForm = false"
              :disabled="submitting"
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
              :disabled="submitting"
            >
              {{ submitting ? 'Creating...' : 'Create ticket' }}
            </button>
          </div>
        </form>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <p>Total tickets</p>
          <h2>{{ tickets.length }}</h2>
          <span>All support requests</span>
        </article>

        <article class="stat-card">
          <p>Open</p>
          <h2>{{ openCount }}</h2>
          <span>Awaiting action</span>
        </article>

        <article class="stat-card">
          <p>In progress</p>
          <h2>{{ inProgressCount }}</h2>
          <span>Being handled</span>
        </article>

        <article class="stat-card">
          <p>Resolved</p>
          <h2>{{ resolvedCount }}</h2>
          <span>Successfully resolved</span>
        </article>
      </section>

      <section class="ticket-panel">
        <div class="panel-heading">
          <div>
            <h2>All tickets</h2>
            <p>Search and filter support requests.</p>
          </div>

          <span class="ticket-count">
            {{ filteredTickets.length }} tickets
          </span>
        </div>

        <div class="filters">
          <input
            v-model="search"
            type="search"
            placeholder="Search title, category or ID..."
            aria-label="Search tickets"
          />

          <select v-model="statusFilter" aria-label="Filter by status">
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select v-model="priorityFilter" aria-label="Filter by priority">
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <p v-if="updateError" class="form-error" role="alert">
  {{ updateError }}
</p>

        <div v-if="loading && tickets.length === 0" class="message">
          Loading tickets...
        </div>

        <div v-else-if="errorMessage" class="message error" role="alert">
          {{ errorMessage }}
          <button class="secondary-button" @click="loadTickets">
            Retry
          </button>
        </div>

        <div v-else-if="filteredTickets.length === 0" class="empty-state">
          <div class="empty-icon">▤</div>
          <h3>No tickets found</h3>
          <p>
            {{
              tickets.length === 0
                ? 'Create your first support ticket to get started.'
                : 'Try changing your search or filters.'
            }}
          </p>

          <button
            v-if="tickets.length === 0"
            class="primary-button"
            @click="openNewTicketForm"
          >
            + Create your first ticket
          </button>
        </div>

        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="ticket in filteredTickets" :key="ticket.id">
                <td>
                  <strong>{{ ticket.title }}</strong>
                  <small>#{{ ticket.id }}</small>
                </td>

                <td>{{ ticket.category }}</td>

                <td>
                  <span
                    class="badge"
                    :class="'priority-' + ticket.priority.toLowerCase()"
                  >
                    {{ ticket.priority }}
                  </span>
                </td>

                <td>
                  <span
                    class="badge"
                    :class="'status-' + ticket.status.toLowerCase()"
                  >
                    {{ statusLabel(ticket.status) }}
                  </span>
                  <button
                  
  type="button"
  class="edit-button"
  @click="startEditing(ticket)"
>
  Edit
</button>
<button

  type="button"
  class="delete-button"
  @click="deleteTicket(ticket)"
>
  Delete
</button>
<button
  type="button"
  class="view-button"
  @click="viewTicket(ticket)"
>
  View
</button>
                </td>

                <td>{{ formatDate(ticket.createdAt) }}</td>
                
<td>
  <select
    v-if="isAdmin"
    :value="ticket.status"
    :disabled="updatingTicketId === ticket.id"
    :aria-label="`Update status for ticket ${ticket.id}`"
    @change="updateTicketStatus(
      ticket,
      ($event.target as HTMLSelectElement).value as TicketStatus
    )"
  >
    <option value="OPEN">Open</option>
    <option value="IN_PROGRESS">In progress</option>
    <option value="RESOLVED">Resolved</option>
    <option value="CLOSED">Closed</option>
  </select>

  <small v-if="updatingTicketId === ticket.id">Saving...</small>
</td>

              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="tickets.length > 0" class="ticket-summary">
          {{ closedCount }} closed ticket{{ closedCount === 1 ? '' : 's' }}
        </div>
      </section>

      <footer>SupportDesk · Support ticket management</footer>
    </main>
  </div>
</template>

<style>
:root {
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #20283b;
  background: #f5f7fb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 240px;
  padding: 28px 18px;
  color: white;
  background: #171c31;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 4px 52px;
  font-size: 19px;
  font-weight: 750;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #7167f9;
}

.nav-label,
.eyebrow {
  color: #929ab2;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.nav-label {
  margin: 0 12px 12px;
}

.nav-item {
  padding: 13px 14px;
  border-radius: 9px;
  color: #dfe3f3;
  text-decoration: none;
}

.nav-item.active {
  color: white;
  background: #303653;
}

.nav-item span {
  margin-right: 10px;
}

.sidebar-note {
  margin-top: auto;
  padding: 12px 4px;
  color: #aeb6cb;
  font-size: 12px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 50%;
  background: #38c992;
}

.main-content {
  flex: 1;
  min-width: 0;
  padding: 36px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 10px;
}

h1 {
  margin: 0;
  font-size: 30px;
  letter-spacing: -0.8px;
}

.subtitle,
.panel-heading p,
.stat-card > span {
  color: #8991a5;
  font-size: 13px;
}

.subtitle {
  margin-bottom: 0;
}

.header-actions,
.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary-button,
.secondary-button {
  border-radius: 9px;
  padding: 11px 15px;
  font-weight: 650;
}

.primary-button {
  border: 0;
  color: white;
  background: #6258e8;
}

.primary-button:hover:not(:disabled) {
  background: #5147d3;
}

.secondary-button {
  border: 1px solid #e2e6ef;
  color: #414b60;
  background: white;
}

.secondary-button:hover:not(:disabled) {
  background: #f7f8fc;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 26px;
}

.stat-card,
.ticket-panel {
  border: 1px solid #e9ecf3;
  border-radius: 14px;
  background: white;
}

.stat-card {
  padding: 22px;
}

.stat-card p {
  margin: 0;
  color: #7c859b;
  font-size: 13px;
  font-weight: 600;
}

.stat-card h2 {
  margin: 15px 0 6px;
  font-size: 30px;
}

.stat-card > span {
  font-size: 12px;
}

.ticket-panel {
  overflow: hidden;
}

.create-panel {
  margin-bottom: 26px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 18px;
}

.panel-heading h2 {
  margin: 0;
  font-size: 18px;
}

.panel-heading p {
  margin-bottom: 0;
}

.ticket-count {
  padding: 8px 11px;
  border-radius: 8px;
  color: #6258e8;
  background: #f0efff;
  font-size: 12px;
  font-weight: 700;
}

.filters {
  display: flex;
  gap: 12px;
  padding: 0 24px 20px;
}

.filters input,
.filters select,
.create-form input,
.create-form textarea,
.create-form select {
  min-width: 0;
  border: 1px solid #e2e6ef;
  border-radius: 8px;
  padding: 11px 12px;
  color: #414b60;
  background: white;
  outline: none;
}

.filters input {
  flex: 1;
}

.filters input:focus,
.filters select:focus,
.create-form input:focus,
.create-form textarea:focus,
.create-form select:focus {
  border-color: #8178f4;
}

.create-form {
  display: grid;
  gap: 18px;
  padding: 0 24px 24px;
}

.create-form label {
  display: grid;
  gap: 8px;
  color: #414b60;
  font-size: 13px;
  font-weight: 650;
}

.create-form textarea {
  width: 100%;
  resize: vertical;
}

.create-form input,
.create-form select {
  width: 100%;
}

.form-actions {
  justify-content: flex-end;
}

.form-error {
  margin: 0;
  color: #b42335;
  font-size: 13px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  padding: 13px 24px;
  color: #8991a5;
  background: #fafbfe;
  font-size: 10px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

td {
  padding: 17px 24px;
  border-top: 1px solid #eff1f6;
  color: #687187;
  font-size: 13px;
  white-space: nowrap;
}

td strong,
td small {
  display: block;
}

td strong {
  color: #30384d;
  font-weight: 650;
}

td small {
  margin-top: 4px;
  color: #a0a7b7;
  font-size: 11px;
}

.badge {
  display: inline-block;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 750;
}

.priority-low {
  color: #637084;
  background: #eef2f7;
}

.priority-medium {
  color: #946b11;
  background: #fff4d9;
}

.priority-high {
  color: #b45b2c;
  background: #ffe9dc;
}

.priority-urgent {
  color: #bd3449;
  background: #ffe5e8;
}

.status-open {
  color: #3869bc;
  background: #e8f1ff;
}

.status-in_progress {
  color: #9a7219;
  background: #fff2d8;
}

.status-resolved {
  color: #237c51;
  background: #e0f7eb;
}

.status-closed {
  color: #687187;
  background: #eef0f4;
}

.message,
.empty-state {
  padding: 48px 24px;
  color: #7c859b;
  text-align: center;
}

.error {
  color: #b42335;
}

.error .secondary-button {
  display: block;
  margin: 14px auto 0;
}

.empty-icon {
  color: #9c96f7;
  font-size: 30px;
}

.empty-state h3 {
  margin-bottom: 6px;
  color: #333b50;
}

.empty-state p {
  margin-bottom: 18px;
  font-size: 13px;
}

.ticket-summary {
  padding: 14px 24px;
  border-top: 1px solid #eff1f6;
  color: #8991a5;
  font-size: 12px;
}

footer {
  padding: 24px 0 0;
  color: #a0a7b7;
  font-size: 11px;
}

@media (max-width: 1000px) {
  .main-content {
    padding: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .sidebar {
    width: 64px;
    padding: 20px 8px;
  }

  .brand {
    margin: 0 auto 45px;
  }

  .brand > span:last-child,
  .nav-label,
  .sidebar-note {
    display: none;
  }

  .nav-item.active {
    font-size: 0;
    text-align: center;
  }

  .nav-item.active span {
    margin: 0;
    font-size: 18px;
  }

  .main-content {
    padding: 20px 14px;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  h1 {
    font-size: 25px;
  }

  .stats-grid {
    gap: 10px;
  }

  .stat-card {
    padding: 15px;
  }

  .stat-card h2 {
    font-size: 24px;
  }

  .filters {
    flex-direction: column;
  }

  .edit-button {
  padding: 8px 12px;
  border: 1px solid #d8d5ff;
  border-radius: 8px;
  background: #f3f1ff;
  color: #5146d8;
  font-weight: 600;
  cursor: pointer;
}

.edit-button:hover {
  background: #e8e5ff;
}

.edit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-button {
  padding: 8px 12px;
  border: 1px solid #f2c6cc;
  border-radius: 8px;
  background: #fff1f2;
  color: #b42335;
  font-weight: 600;
  cursor: pointer;
}

.delete-button:hover {
  background: #ffe4e7;
}
}
</style>
