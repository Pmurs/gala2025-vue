<script setup lang="ts">
// Modified phone verification functions
import { supabase } from "@/api/supabase";
import { computed, ref } from "vue";
import { VueTelInput } from "vue-tel-input";
import { send } from "vite";

const emit = defineEmits<{
  (e: "phone-verified"): void;
}>();

const phone = ref("");
const phoneObject = ref<{ number: string; country: string; valid: boolean }>(
  null
);
const isPhoneVerified = ref(false);
const isPhoneSent = ref(false);
const otp = ref("");
const isVerifying = ref(false);
const verificationError = ref("");
const sendError = ref("");

const isOtpValid = computed(() => {
  return otp.value.length === 6 && /^\d+$/.test(otp.value);
});

function onInput(formattedNumber, phone) {
  phoneObject.value = phone;
}

async function signInWithPhone() {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneObject.value.number,
  });

  if (error) {
    throw new Error(error.message);
  } else {
    isPhoneSent.value = true;
  }
}

async function verifyPhone() {
  isVerifying.value = true;
  const { error } = await supabase.auth.verifyOtp({
    phone: phoneObject.value.number,
    token: otp.value,
    type: "sms",
  });

  isVerifying.value = false;
  if (error) {
    sendError.value = error.message;
    throw new Error(error.message);
  } else {
    emit("phone-verified");
  }
}
</script>

<template>
  <div>
    <div v-if="!isPhoneSent" class="phone-form">
      <vue-tel-input
        :value="phone"
        :preferredCountries="['US', 'GB', 'NO', 'DK']"
        mode="international"
        class="rsvp-input"
        :input-options="{
          placeholder: 'phone number',
        }"
        @on-input="onInput"
      ></vue-tel-input>

      <button
        class="rsvp-button"
        id="nameBtn"
        @click="signInWithPhone"
        :disabled="!phoneObject?.valid"
      >
        verify phone
      </button>

      <p class="error-message" v-if="sendError">
        {{ sendError }}
      </p>
    </div>
    <div v-else class="phone-form">
      <p class="verification-text">
        Please enter the 6-digit code sent to your phone
      </p>

      <input
        type="text"
        v-model="otp"
        class="otp-input"
        maxlength="6"
        placeholder="000000"
        pattern="\d*"
        inputmode="numeric"
        required
      />

      <p class="error-message" v-if="verificationError">
        {{ verificationError }}
      </p>

      <div class="verification-actions">
        <button
          class="rsvp-button verify-button"
          :disabled="!isOtpValid || isVerifying"
          @click="verifyPhone"
        >
          {{ isVerifying ? "verifying..." : "verify" }}
        </button>

        <div class="footer">
          <a class="resend-code" @click="signInWithPhone"> Resend code </a>
          <a class="resend-code" @click="isPhoneSent = false"> Edit number </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
::v-deep(.vti__dropdown) {
  padding: unset;
}
::v-deep(.vti__input) {
  font-family: "Nagbuloe", serif;
}

.phone-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 0.5rem;

  .resend-code {
    font-family: "Nagbuloe", serif;
    color: white;
    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }
  }
}

p {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 1rem;
  color: #ffffff;
  line-height: 1.4;
}

.rsvp-input {
  width: 100%;
  padding: 0 1rem; /* 10% skinnier vertically (0.75 * 0.9) */
  font-family: "Nagbuloe", serif;
  font-size: 1rem;
  border: 2px solid #ffffff;
  border-radius: 25px;
  background: #ffffff;
  color: #000000;
}

@media (max-width: 767px) {
  .rsvp-input {
    padding: 0.442rem 0.65rem; /* 35% smaller */
    font-size: 16px; /* Minimum 16px to prevent auto-zoom on mobile */
    border-width: 1.3px; /* 35% smaller */
    border-radius: 16px; /* 35% smaller: 25px * 0.65 */
  }
}
</style>
