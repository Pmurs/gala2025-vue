<script setup lang="ts">
import "vue-tel-input/vue-tel-input.css";
import { computed, onMounted, ref } from "vue";
import { Guest } from "@/types/LibraryRecordInterfaces";

const emit = defineEmits<{
  (e: "submit-rsvp", guest: Guest): void;
}>();
const currentStep = ref(1);

const name = ref("");
const email = ref("");
const guestCount = ref(1);
const hasPaid = ref(false);

// Validation states
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

// Step validation
const isStep1Valid = computed(
  () => name.value.trim() !== "" && isValidEmail.value && guestCount.value > 0
);

function submitRsvp() {
  emit("submit-rsvp", {
    name: name.value,
    phone: null,
    email: email.value,
    verified: true,
    guest_count: guestCount.value,
    paid: hasPaid.value,
  });
}

onMounted(() => {
  name.value = "";
  email.value = "";
  guestCount.value = 1;
  hasPaid.value = false;
});
</script>

<template>
  <div class="rsvp-form-container" id="rsvpFormContainer">
    <div class="rsvp-content" id="rsvpContent">
      <!-- Step 1: Enter Name, Phone, and Choose Guest Count -->
      <div class="rsvp-step" id="step1" v-show="currentStep === 1">
        <input
          type="text"
          v-model="name"
          id="nameInput"
          placeholder="your name"
          required
        />
        <input
          type="email"
          v-model="email"
          id="emailInput"
          placeholder="your email"
          required
          style="margin-top: 1rem"
        />
        <!-- Guest count buttons -->
        <div
          style="
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            margin-top: 1rem;
          "
        >
          <button
            class="rsvp-split-button"
            :class="{ selected: guestCount === 1 }"
            id="justMeBtn"
            @click="guestCount = 1"
          >
            just me
          </button>
          <button
            class="rsvp-split-button"
            :class="{ selected: guestCount === 2 }"
            id="plusOneBtn"
            @click="guestCount = 2"
          >
            plus one
          </button>
        </div>

        <button
          class="rsvp-button"
          id="nameBtn"
          :disabled="!isStep1Valid"
          @click="currentStep = 2"
        >
          Continue
        </button>
      </div>

      <div class="rsvp-step" id="step3" v-show="currentStep === 2">
        <p
          style="
            color: #ffffff;
            font-size: 1.1rem;
            margin-bottom: 1rem;
            text-align: center;
            line-height: 1.5;
          "
        >
          have you paid for your ticket yet?
        </p>
        <p
          style="
            color: #ffffff;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
            text-align: center;
          "
        >
          if not, send
          <strong id="ticketPrice">{{
            guestCount === 2 ? "$250" : "$125"
          }}</strong>
          via Venmo:
        </p>
        <a
          :href="`https://account.venmo.com/payment-link?amount=${
            guestCount === 2 ? '250' : '125'
          }&note=for%20the%20gala!&recipients=maxheald&txn=pay`"
          target="_blank"
          class="venmo-button"
          id="venmoPaymentLink"
          style="display: block; text-align: center; margin-bottom: 1rem"
        >
          venmo max
        </a>
        <button class="rsvp-button" id="paidBtn" @click="submitRsvp">
          i've paid
        </button>
        <div class="footer">
          <a @click="currentStep = 1" class="back">Back</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add to your existing styles */
.rsvp-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer {
  display: flex;
  flex-direction: row;
  justify-content: end;
  margin-top: 0.5rem;

  .back {
    font-family: "Nagbuloe", serif;
    color: white;
    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }
  }
}

/* RSVP form container */
.rsvp-form-container {
  font-family: "Nagbuloe", serif;
  color: #ffffff;
  opacity: 1;
  transition: opacity 0.5s ease;
}

@media (max-width: 767px) {
  .rsvp-form-container {
    max-height: calc(100vh - 13rem); /* 35% smaller adjustment */
  }
}

.rsvp-content {
  font-family: "Nagbuloe", serif;
  font-size: 1rem;
  color: #ffffff;
  line-height: 1.6;
}

@media (max-width: 767px) {
  .rsvp-content {
    font-size: 0.65rem; /* 35% smaller: 1rem * 0.65 */
    line-height: 1.4; /* Slightly tighter */
  }
}

/* RSVP form styles */
.rsvp-form {
  margin-bottom: 2rem;
}

/* Venmo payment button - matches rsvp-button style */
.venmo-button {
  width: 100%;
  padding: 0.68rem 1rem; /* Same as rsvp-button */
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 1rem;
  border: 2px solid #ffffff;
  border-radius: 25px;
  background: #3d95ce; /* Venmo blue instead of white */
  color: #ffffff;
  cursor: pointer;
  text-decoration: none;
  display: block;
  text-align: center;
  transition: opacity 0.2s ease;
}

@media (max-width: 767px) {
  .venmo-button {
    padding: 0.442rem 0.65rem; /* 35% smaller */
    font-size: 0.65rem; /* 35% smaller: 1rem * 0.65 */
    border-width: 1.3px; /* 35% smaller */
    border-radius: 16px; /* 35% smaller: 25px * 0.65 */
  }
}

.venmo-button:hover {
  opacity: 0.8;
}
</style>
