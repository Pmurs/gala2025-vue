<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Guest } from "@/types/LibraryRecordInterfaces";

const props = defineProps<{
  guest: Guest;
  error: string;
}>();

const emit = defineEmits<{
  (e: "update-rsvp", guest: Guest): void;
}>();

const name = ref("");
const guestCount = ref(1);

onMounted(() => {
  name.value = props.guest.name;
  guestCount.value = props.guest.guest_count;
});

function updateRSVP() {
  const updatedGuest: Guest = {
    ...props.guest,
    name: name.value,
    guest_count: guestCount.value,
  };

  emit("update-rsvp", updatedGuest);
}
</script>

<template>
  <div class="edit-form">
    <input
      type="text"
      v-model="name"
      placeholder="your name"
      required
    />

    <div
      style="display: flex; gap: 0.5rem"
    >
      <button
        class="rsvp-split-button"
        :class="{ selected: guestCount === 1 }"
        @click="guestCount = 1"
      >
        just me
      </button>
      <button
        class="rsvp-split-button"
        :class="{ selected: guestCount === 2 }"
        @click="guestCount = 2"
      >
        plus one
      </button>
    </div>

    <button
      id="nameBtn"
      @click="updateRSVP"
      :disabled="!name.length"
    >
      Update RSVP
    </button>
    <div v-if="error">{{ error }}</div>
  </div>
</template>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
