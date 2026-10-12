
<script setup lang="ts">
import { ref, watch } from 'vue';

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface EditableTicket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
}

const props = defineProps<{
  ticket: EditableTicket;
  saving?: boolean;
  errorMessage?: string;
  isAdmin?: boolean;
}>();

const emit = defineEmits<{
  submit: [values: {
    id: number;
    title: string;
    description: string;
    category: string;
    priority?: TicketPriority;
  }];
  cancel: [];
}>();

const otherCategory = ref('');

const predefinedCategories = [
  'Technical Issue',
  'Account & Login',
  'Billing & Payment',
  'Feature Request',
  'General Inquiry',
];

const form = ref({
  title: '',
  description: '',
  category: '',
  priority: 'MEDIUM' as TicketPriority,
});

watch(
  () => props.ticket,
  (ticket) => {
    const isPredefined = predefinedCategories.includes(ticket.category);

    form.value = {
      title: ticket.title,
      description: ticket.description,
      category: isPredefined ? ticket.category : 'Other',
      priority: ticket.priority,
    };

    otherCategory.value = isPredefined ? '' : ticket.category;
  },
  { immediate: true },
);

function submitForm() {
  const title = form.value.title.trim();
  const description = form.value.description.trim();

  const category =
    form.value.category === 'Other'
      ? otherCategory.value.trim()
      : form.value.category.trim();

  if (!title || !description || !category) return;

  emit('submit', {
    id: props.ticket.id,
    title,
    description,
    category,
    ...(props.isAdmin ? { priority: form.value.priority } : {}),
  });
}
</script>

<template>
  <form class="ticket-form" @submit.prevent="submitForm">
    <div class="form-group">
      <label for="edit-title">Title</label>
      <input
        id="edit-title"
        v-model="form.title"
        type="text"
        maxlength="150"
        required
        placeholder="Enter ticket title"
      />
    </div>

    <div class="form-group">
      <label for="edit-description">Description</label>
      <textarea
        id="edit-description"
        v-model="form.description"
        rows="4"
        required
        placeholder="Describe the issue"
      />
    </div>

    <div class="form-group">
      <label for="edit-category">Category</label>
      <select id="edit-category" v-model="form.category" required>
        <option disabled value="">Select a category</option>
        <option
          v-for="category in predefinedCategories"
          :key="category"
          :value="category"
        >
          {{ category }}
        </option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div v-if="form.category === 'Other'" class="form-group">
      <label for="other-category">Specify category</label>
      <input
        id="other-category"
        v-model="otherCategory"
        type="text"
        maxlength="50"
        required
        placeholder="Enter your category"
      />
    </div>

    <div v-if="isAdmin" class="form-group">
  <label for="edit-priority">Priority</label>
  <select id="edit-priority" v-model="form.priority" required>
    <option value="LOW">Low</option>
    <option value="MEDIUM">Medium</option>
    <option value="HIGH">High</option>
    <option value="URGENT">Urgent</option>
  </select>
</div>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <div class="form-actions">
      <button type="submit" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
      <button type="button" :disabled="saving" @click="emit('cancel')">
        Cancel
      </button>
    </div>
  </form>
</template>
