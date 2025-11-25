<script setup lang="ts">
import { supabase } from "@/api/supabase.js";
import { onMounted, ref } from "vue";
import type { Guest } from "@/types/LibraryRecordInterfaces.js";
import EditRSVP from "@/components/EditRSVP.vue";
import PhoneSignIn from "@/components/PhoneSignIn.vue";
import CreateRSVP from "@/components/CreateRSVP.vue";

const guests = ref<Guest[]>([]);
const updateError = ref("");

const showSignIn = ref(false);
const showCreateRSVP = ref(false);
const showEditRSVP = ref(false);

const myRsvp = ref<Guest>(null);

// If one of the RSVP forms is open, closes it
// If no forms are open, opens the appropriate form
async function openRsvpForm() {
  if (showSignIn.value || showCreateRSVP.value || showEditRSVP.value) {
    showSignIn.value = false;
    showCreateRSVP.value = false;
    showEditRSVP.value = false;
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If not signed in, opens sign in form
  if (!session) {
    showSignIn.value = true;
  }
  // If signed in, opens the edit form if they have an RSVP, else opens RSVP form
  else if (myRsvp.value) {
    showEditRSVP.value = true;
  } else showCreateRSVP.value = true;
}

// Loads guests from the database and populates guests array
// Checks if the user is signed in
// If so, populates myRsvp with their RSVP if it exists
async function loadGuests() {
  await supabase
    .from("guests")
    .select("*")
    .order("name")
    .then(({ data }) => {
      guests.value = data;
    });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    const phone = session.user.phone;
    myRsvp.value = guests.value.find((guest) => guest.phone === phone);
  }
}

async function onSignIn() {
  await loadGuests();
  showSignIn.value = false;
  if (myRsvp.value) {
    showEditRSVP.value = true;
  } else {
    showCreateRSVP.value = true;
  }
}

async function submitRsvp(guest: Guest) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("guests")
    .insert([{ ...guest, phone: session.user.phone }]);
  if (error) {
    console.error(error);
  } else {
    console.log("Guest added:", data);
    await loadGuests();
    showCreateRSVP.value = false;
  }
}

async function updateRsvp(guest: Guest) {
  console.log("Updating guest:", guest);
  const { data, error } = await supabase
    .from("guests")
    .update(guest)
    .eq("phone", guest.phone);
  if (error) {
    console.error(error);
    updateError.value = error.message;
  }
  await loadGuests();
  showEditRSVP.value = false;
}

onMounted(async () => {
  await loadGuests();

  resetScroll();
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("beforeunload", resetScroll);
  window.addEventListener("load", resetScroll);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resetScroll);
  } else {
    resetScroll();
  }
});

const resetScroll = () => {
  window.scrollTo(0, 0);
  const whiteSection = document.querySelector(".white-section");
  if (whiteSection) {
    whiteSection.style.transform = "translateY(0)";
  }
};

const handleScroll = () => {
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;

  // Prevent scrolling past the top
  if (scrollY < 0) {
    window.scrollTo(0, 0);
    return;
  }

  // Move white section up (peeling effect)
  const whiteSection = document.querySelector(".white-section");
  if (whiteSection) {
    if (scrollY === 0) {
      whiteSection.style.transform = "translateY(0)";
    } else {
      const translateY = Math.max(-viewportHeight, -scrollY);
      whiteSection.style.transform = `translateY(${translateY}px)`;
    }
  }

  // Color changes when entering orange section
  const elements = {
    jukeboxContainer: document.getElementById("jukeboxContainer"),
    playButton: document.getElementById("playButton"),
    smallText: document.getElementById("smallText"),
    mainTitle: document.getElementById("mainTitle"),
    orangeBlurb: document.querySelector(".orange-blurb"),
  };

  const toggleOrangeClass = (shouldAdd) => {
    Object.values(elements).forEach((element) => {
      if (element) {
        element.classList[shouldAdd ? "add" : "remove"]("on-orange");
      }
    });
  };

  toggleOrangeClass(scrollY >= viewportHeight);

  // Third section slide-up effect
  const thirdSection = document.getElementById("thirdSection");
  const thirdPageRSVP = document.getElementById("thirdPageRSVP");

  if (thirdSection) {
    const orangeSectionEnd = viewportHeight * 2;

    if (scrollY >= orangeSectionEnd) {
      const thirdSectionStart = orangeSectionEnd;
      const scrollDistance = scrollY - thirdSectionStart;
      const thirdSectionProgress = Math.min(1, scrollDistance / viewportHeight);
      const translateValue = 100 - thirdSectionProgress * 100;

      thirdSection.style.transform = `translateY(${translateValue}%)`;
      thirdSection.style.display = "flex";

      if (translateValue <= 0) {
        thirdSection.classList.add("scrollable");
      } else {
        thirdSection.classList.remove("scrollable");
      }

      if (
        thirdPageRSVP &&
        thirdSectionProgress >= 0.5 &&
        !thirdPageRSVP.dataset.fadedIn
      ) {
        setTimeout(() => {
          thirdPageRSVP.classList.add("visible");
        }, 1000);
        thirdPageRSVP.dataset.fadedIn = "true";
      }
    } else {
      thirdSection.style.transform = "translateY(100%)";
      thirdSection.classList.remove("scrollable");
    }
  }
};
</script>

<template>
  <main>
    <!-- Fixed hero text -->
    <div class="hero">
      <div class="small-text" id="smallText">The fourth annual edition of</div>
      <h1 class="main-title" id="mainTitle">
        <span class="word"><span>t</span><span>h</span><span>e</span></span
        ><span class="space"> </span
        ><span class="word"
          ><span>g</span><span>a</span><span>l</span><span>a</span></span
        >
      </h1>
    </div>

    <!-- White section - scrolls up to reveal orange -->
    <div class="white-section"></div>

    <!-- Orange section - fixed underneath -->
    <div class="orange-section">
      <div class="orange-blurb">
        From the windows, to the walls: it's time to drop the ball. We're
        gearing up for a fourth annual New Year's Gala, and would love to have
        you there
      </div>
    </div>

    <!-- Scroll spacer to allow continued scrolling -->
    <div class="scroll-spacer"></div>

    <!-- Third orange section -->
    <div class="third-section" id="thirdSection">
      <!-- Left column: Details -->
      <div class="third-section-left">
        <h2 class="party-details-header">Details</h2>

        <!-- Icons section -->
        <div class="details-icons">
          <div class="detail-item">
            <span class="detail-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  fill="white"
                />
              </svg>
            </span>
            <a
              href="https://www.greenpointloft.com"
              target="_blank"
              class="detail-link"
              >The Greenpoint Loft</a
            >
          </div>

          <div class="detail-item">
            <span class="detail-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="5" y="7" width="14" height="10" rx="1" fill="white" />
                <path
                  d="M9 9h6M9 11h6M9 13h6M9 15h6"
                  stroke="#ff6b35"
                  stroke-width="1"
                  stroke-linecap="round"
                />
                <circle cx="5" cy="9.5" r="0.6" fill="#ff6b35" />
                <circle cx="5" cy="12" r="0.6" fill="#ff6b35" />
                <circle cx="5" cy="14.5" r="0.6" fill="#ff6b35" />
                <circle cx="19" cy="9.5" r="0.6" fill="#ff6b35" />
                <circle cx="19" cy="12" r="0.6" fill="#ff6b35" />
                <circle cx="19" cy="14.5" r="0.6" fill="#ff6b35" />
              </svg>
            </span>
            <span class="detail-text">early birds! $125 before Dec. 10th</span>
          </div>

          <div class="detail-item">
            <span class="detail-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="6.5" cy="9" r="2" fill="white" />
                <path
                  d="M2 19c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5"
                  stroke="white"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  fill="none"
                />
                <circle cx="17.5" cy="9" r="2" fill="white" />
                <path
                  d="M13 19c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5"
                  stroke="white"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  fill="none"
                />
                <path
                  d="M6.5 11l2.5-1.5M17.5 11l-2.5-1.5"
                  stroke="white"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
                <path
                  d="M5 7l1 2M19 7l-1 2"
                  stroke="white"
                  stroke-width="1"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="detail-text" id="spotsLeft">
              (
              <span id="rsvpCount">{{ 200 - guests.length }}</span>
              <span style="font-family: sans-serif">/</span>
              200) spots left
            </span>
          </div>
        </div>

        <!-- Paragraph text -->
        <div class="details-paragraph">
          <p>
            From the windows, to the walls: it's time to drop the ball. We're
            gearing up for a third annual New Year's Gala, and would love to
            have you there.
          </p>
          <p>
            What can you expect? The same high quality food and cocktails (open
            bar all night), two sets of live music from talented friends, a
            bigger venue (with a roof deck over the east river!), and a chance
            to meet new people. Yes, it's still black tie.
          </p>
          <p>
            As a reminder, nobody makes money on this--everything goes to offset
            the venue, drinks, small plates, and music. We hope ticket price
            won't be a barrier for you, but if it is, please reach out at
            603-494-0576! We want to see you there.
          </p>
          <p>
            Lastly, as always, invite your friends! The whole point of this is
            to combine crowds, and it's more fun with them there.
          </p>
          <p>See you NYE.</p>
          <p>
            If you want to check out the venue, link here:
            <a
              href="https://www.instagram.com/greenpoint_loft/"
              target="_blank"
              style="color: #ffffff; text-decoration: underline"
              >https://www.instagram.com/greenpoint_loft/</a
            >
          </p>
        </div>
      </div>

      <!-- Right column: RSVP form -->
      <div class="third-section-right">
        <button
          class="third-page-rsvp"
          id="thirdPageRSVP"
          @click="openRsvpForm"
        >
          {{ showSignIn || showCreateRSVP || showEditRSVP ? "CLOSE" : "RSVP" }}
        </button>
        <div v-if="showEditRSVP || showSignIn || showCreateRSVP">
          <PhoneSignIn v-if="showSignIn" @phone-verified="onSignIn" />
          <CreateRSVP v-if="showCreateRSVP" @submit-rsvp="submitRsvp" />
          <EditRSVP
            v-if="showEditRSVP"
            :guest="myRsvp"
            :error="updateError"
            @update-rsvp="updateRsvp"
          />
        </div>
        <div v-else>
          <div class="guest-list-container" id="guestListContainer">
            <h3 class="guest-list-header">
              Guests <span v-if="guests.length">({{ guests.length }})</span>
            </h3>
            <ul class="guest-list-items" id="guestList">
              <li v-for="guest in guests">
                <span
                  >{{ guest.name }}
                  <span v-if="guest.guest_count === 2">+1</span></span
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  background: #ffffff;
  scroll-behavior: auto;
  overscroll-behavior-y: none;
  position: relative;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  overflow-x: hidden;
  background: #ffffff;
  overscroll-behavior-y: none;
  position: relative;
}

/* White section at top - scrolls up like peeling layer */
.white-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  background: #ffffff;
  z-index: 20;
  transform: translateY(0);
}

/* Orange section below - fixed underneath */
.orange-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  background: #ff6b35;
  z-index: 1;
}

/* Spacer to allow scrolling through orange section and third section slide-up */
.scroll-spacer {
  position: relative;
  height: 400vh; /* Creates enough scroll space: 100vh orange + 200vh for third section slide-up */
  z-index: 0;
}

/* Third orange section that slides up */
.third-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100vh;
  background: #ff6b35;
  z-index: 150; /* Higher than hero container (100) to cover it */
  transform: translateY(100%); /* Start hidden below */
  /* No transition - will be controlled directly by scroll */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start; /* Mobile: start from top so Details header is visible */
  padding: 1.5rem 1rem; /* Mobile: reduced padding */
  gap: 1.5rem;
  overflow-y: hidden; /* Disabled until section is fully visible */
  padding-top: 2rem; /* Ensure header is visible at top */
  touch-action: none; /* Prevent touch scrolling when not fully visible */
  pointer-events: auto; /* Allow clicks but not scrolling */
}

.third-section.scrollable {
  overflow-y: auto; /* Enable scrolling only when fully visible */
  touch-action: pan-y; /* Allow vertical scrolling when fully visible */
}

@media (min-width: 768px) {
  .third-section {
    flex-direction: row;
    align-items: center;
    justify-content: center; /* Desktop: center content */
    padding: 2rem;
    gap: 2rem;
  }
}

/* Left column: Details */
.third-section-left {
  width: 100%;
  padding: 0; /* Mobile: remove padding, will add to inner elements */
  border: none;
  font-family: "Nagbuloe", serif;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Mobile: start from top */
  gap: 1rem; /* Reduced from 1.5rem for tighter spacing */
  text-align: left;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .third-section-left {
    width: 50%;
    padding: 2rem;
    justify-content: center; /* Desktop: center content */
  }
}

.party-details-header {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 1.5rem; /* A bit bigger as it's a header */
  color: #ffffff;
  margin: 0;
  padding: 0 0.5rem; /* Mobile: add horizontal padding */
}

@media (min-width: 768px) {
  .party-details-header {
    font-size: 2rem;
    padding: 0; /* Desktop: remove padding */
  }
}

.party-details-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.party-details-list li {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 0.94rem;
  color: #ffffff;
  line-height: 1.5;
  position: relative;
  padding-left: 1.5rem;
}

.party-details-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  font-size: 1.2rem;
}

@media (min-width: 768px) {
  .party-details-list li {
    font-size: 1.2rem;
  }
}

/* Details icons and text */
.details-icons {
  display: flex;
  flex-direction: column;
  gap: 0.735rem; /* Mobile: 30% smaller (1.05rem * 0.7) */
  margin-bottom: 0.7rem; /* Mobile: 30% smaller (1rem * 0.7) */
  text-align: left;
  width: 100%;
  padding: 0 0.5rem; /* Mobile: add horizontal padding */
}

@media (min-width: 768px) {
  .details-icons {
    padding: 0; /* Desktop: remove padding */
    gap: 1.05rem; /* Keep reduced gap on desktop too */
    margin-bottom: 1rem; /* Keep reduced margin on desktop */
  }
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.525rem; /* Mobile: 30% smaller (0.75rem * 0.7) */
  text-align: left;
}

.detail-icon {
  font-size: 1.05rem; /* Mobile: 30% smaller (1.5rem * 0.7) */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.05rem; /* Mobile: 30% smaller */
  height: 1.05rem; /* Mobile: 30% smaller */
  text-align: center;
  flex-shrink: 0;
}

.detail-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

@media (min-width: 768px) {
  .detail-icon {
    font-size: 2rem;
    width: 2rem;
    height: 2rem;
  }

  .detail-item {
    gap: 0.75rem; /* Desktop: original gap */
  }
}

.detail-link {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 16px; /* Match input font size for consistency */
  color: #ffffff;
  text-decoration: underline;
  transition: opacity 0.2s ease;
}

.detail-link:hover {
  opacity: 0.8;
}

@media (min-width: 768px) {
  .detail-link {
    font-size: 1.2rem;
  }
}

.detail-text {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 16px; /* Match input font size for consistency */
  color: #ffffff;
}

@media (min-width: 768px) {
  .detail-text {
    font-size: 1.2rem;
  }
}

.details-paragraph {
  text-align: left;
  width: 100%;
  padding: 0 0.5rem; /* Mobile: add small horizontal padding */
}

.details-paragraph p {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 0.672rem; /* Mobile: 20% bigger (0.56rem * 1.2) */
  color: #ffffff;
  line-height: 1.4; /* Mobile: tighter line height */
  margin: 0 0 0.56rem 0; /* Mobile: reduced margin */
}

.details-paragraph p:last-child {
  margin-bottom: 0;
}

.details-paragraph a {
  color: #ffffff;
  text-decoration: underline;
  transition: opacity 0.2s ease;
}

.details-paragraph a:hover {
  opacity: 0.8;
}

@media (min-width: 768px) {
  .details-paragraph {
    padding: 0; /* Desktop: remove padding */
  }

  .details-paragraph p {
    font-size: 1.2rem; /* Desktop: larger text */
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }
}

/* Right column: RSVP form */
.third-section-right {
  width: 95%; /* Mobile: wider, close to edges */
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Mobile: start from top */
  gap: 1.5rem;
  padding: 1.5rem; /* Mobile: reduced padding */
  border: 10px solid #ffffff;
  min-height: 300px;
  max-height: none; /* Mobile: remove max-height restriction */
  overflow-y: visible; /* Mobile: remove scroll */
  margin: 0 auto; /* Mobile: center the container */
}

@media (min-width: 768px) {
  .third-section-right {
    width: 40%;
    padding: 2rem;
    border-width: 7px; /* 35% smaller: 10px * 0.65 */
    min-height: 420px;
    max-height: calc((100vh - 4rem) * 0.8);
    overflow-y: auto;
    overflow-x: visible; /* Allow picker to show horizontally */
    margin-right: 6rem; /* Ensure space for play button (2rem + 60px + 2rem buffer) */
    gap: 1rem
  }
}

.third-page-rsvp {
  padding: 0.5rem 1.2rem; /* Increased padding to accommodate larger text */
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 1.5rem; /* Match party-details-header mobile size */
  color: #ffffff;
  background: #ff6b35;
  border: 2px solid #ffffff; /* White border on orange background */
  border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
  cursor: pointer;
  user-select: none;
  text-transform: uppercase;
  opacity: 0; /* Start invisible */
  transition: opacity 1s ease; /* Fade in over 1 second */
  pointer-events: auto !important; /* Ensure button is always clickable */
  position: relative;
  z-index: 1000; /* High z-index to ensure it's on top */
  align-self: flex-start; /* Align to top of right column */
  width: min-content;

  &:disabled {
    pointer-events: none;
    cursor: default;
  }
}

@media (max-width: 767px) {
  .third-page-rsvp {
    padding: 0.325rem 0.78rem; /* 35% smaller */
    font-size: 1.17rem; /* 20% bigger (0.975rem * 1.2) */
    border-width: 1.3px; /* 35% smaller */
  }
}

.third-page-rsvp.visible {
  opacity: 1;
}

.third-page-rsvp:hover {
  opacity: 0.8;
}

@media (min-width: 768px) {
  .third-page-rsvp {
    padding: 0.8rem 2rem; /* Increased padding for desktop */
    font-size: 2rem; /* Match party-details-header desktop size */
  }
}

/* Guest list container - always visible */
.guest-list-container {
  font-family: "Nagbuloe", serif;
  color: #ffffff;
  width: 100%; /* Mobile: full width */
  overflow: visible; /* Allow picker to show above */
}

@media (min-width: 768px) {
  .guest-list-container {
    width: auto; /* Desktop: auto width */
    overflow: visible; /* Allow picker to show above */
  }
}

.guest-list-header {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 1.2rem;
  color: #ffffff;
  margin: 0 0 1rem 0;
}

@media (max-width: 767px) {
  .guest-list-header {
    font-size: 1.5rem; /* A bit bigger as it's a header */
    margin: 0 0 0.65rem 0; /* 35% smaller */
  }
}

@media (min-width: 768px) {
  .guest-list-header {
    font-size: 1.5rem;
  }
}

/* Animated guest name in list */
@keyframes nameFlicker {
  0%,
  10%,
  20%,
  30%,
  40%,
  50%,
  60%,
  70%,
  80%,
  90%,
  100% {
    font-family: "Nagbuloe", serif;
    font-weight: bold;
  }
  5%,
  15%,
  25%,
  35%,
  45%,
  55%,
  65%,
  75%,
  85%,
  95% {
    font-family: "Nagbuloe Outline", serif;
    font-weight: normal;
  }
}

.guest-name-animated {
  animation: nameFlicker 2s ease-in-out;
}

.guest-list {
  margin-top: 1.5rem;
}

.guest-list-title {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 1.5rem;
  color: #ffffff;
  margin-bottom: 1rem;
  text-align: center; /* Center to match the buttons */
}

@media (max-width: 767px) {
  .guest-list-title {
    font-size: 0.975rem; /* 35% smaller: 1.5rem * 0.65 */
    margin-bottom: 0.65rem; /* 35% smaller */
  }
}

.guest-list-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guest-list-items li {
  padding: 0.75rem 0; /* Increased padding to accommodate larger badges (2em circle) */
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  white-space: nowrap; /* Prevent name from wrapping to two rows */
  overflow-x: hidden; /* Hide overflow emojis horizontally */
  overflow-y: visible; /* Allow picker to show above */
  font-size: 1.2rem; /* Match guest-list-header size */
  min-width: 0; /* Allow flex items to shrink */

  &:last-child {
    border-bottom: none;
  }
}

/* Ensure name and reactions stay on one line */
.guest-list-items li > span:first-child,
.guest-list-items li > .guest-reactions {
  flex-shrink: 0; /* Don't shrink name or reactions */
}

.guest-list-items li > .guest-reactions {
  min-width: 0; /* Allow reactions to be cut off */
}

@media (max-width: 767px) {
  .guest-list-items li {
    padding: 0.49rem 0; /* Increased to accommodate larger badges (0.75rem * 0.65) */
    font-size: 16px; /* Match input font size for consistency */
  }
}

@media (min-width: 768px) {
  .guest-list-items li {
    font-size: 1.5rem; /* Match guest-list-header desktop size */
  }
}

/* Edit button styling */
.edit-button {
  font-family: "Nagbuloe", serif;
  font-size: 1.2rem; /* Match guest-list-header size */
  color: #ffffff;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  opacity: 0;
  transition: opacity 0.5s ease;
  padding: 0;
  text-transform: lowercase;
  pointer-events: auto; /* Ensure clickable */
}

@media (max-width: 767px) {
  .edit-button {
    font-size: 0.78rem; /* 35% smaller: 1.2rem * 0.65 */
  }
}

@media (min-width: 768px) {
  .edit-button {
    font-size: 1.5rem; /* Match guest-list-header desktop size */
  }
}

.edit-button.visible {
  opacity: 1;
}

.edit-button:hover {
  opacity: 0.7;
}

/* Ensure edit container is clickable */
.guest-list-items li > div {
  pointer-events: auto;
}

/* Edit options as plain text */
.edit-options {
  display: none;
  align-items: center;
  gap: 0.3rem;
}

.edit-options.active {
  display: flex;
}

.edit-option-link {
  font-family: "Nagbuloe", serif;
  font-size: 1.2rem; /* Match guest-list-header size */
  color: #ffffff;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  text-transform: lowercase;
}

@media (max-width: 767px) {
  .edit-option-link {
    font-size: 0.78rem; /* 35% smaller: 1.2rem * 0.65 */
  }
}

@media (min-width: 768px) {
  .edit-option-link {
    font-size: 1.5rem; /* Match guest-list-header desktop size */
  }
}

.edit-option-link:hover {
  opacity: 0.7;
}

.edit-separator {
  color: #ffffff;
  font-size: 1.2rem; /* Match guest-list-header size */
  opacity: 0.6;
}

@media (max-width: 767px) {
  .edit-separator {
    font-size: 0.78rem; /* 35% smaller: 1.2rem * 0.65 */
  }
}

@media (min-width: 768px) {
  .edit-separator {
    font-size: 1.5rem; /* Match guest-list-header desktop size */
  }
}

.guest-list-items li {
  position: relative;
}

/* Guest name clickable area */
.guest-name-clickable {
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap; /* Prevent name from wrapping */
  flex-shrink: 0; /* Don't shrink the name */
}

.guest-name-clickable:active,
.guest-name-clickable:focus,
.guest-name-clickable:visited {
  color: inherit;
  text-decoration: none;
  outline: none;
}

/* Fixed hero content */
.hero {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 100;
  pointer-events: none;
}

.small-text {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #000;
  margin-bottom: 1rem;
  font-weight: 400;
  transition: color 0.3s ease;
}

.small-text.on-orange {
  color: #ffffff;
}

.main-title {
  font-family: "Nagbuloe", serif;
  font-size: clamp(4rem, 15vw, 12rem);
  font-weight: normal;
  color: #000;
  margin: 0;
  line-height: 0.9;
  letter-spacing: -0.02em;
  font-variant-ligatures: none;
  font-kerning: none;
  transition: color 0.3s ease;
  display: inline-block;
  white-space: nowrap;
}

.main-title.on-orange {
  color: #ffffff;
}

/* Word grouping for "the" and "gala" */
.word {
  display: inline-block;
  white-space: nowrap;
}

.word span {
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  display: inline-block;
}

.word span.outline {
  font-family: "Nagbuloe Outline", serif;
  font-weight: normal;
}

/* Orange section blurb */
.orange-blurb {
  position: absolute;
  bottom: 5%; /* Mobile: position from bottom to ensure it's always visible below title */
  left: 50%;
  transform: translateX(-50%);
  font-family: "Nagbuloe", serif;
  font-weight: bold;
  font-size: 1.2rem; /* A bit bigger for better readability */
  color: #000; /* Start as black */
  text-align: center;
  width: 92%; /* Mobile: force container to be wide, close to screen edges */
  line-height: 1.4; /* Mobile: slightly increased for better readability */
  z-index: 5;
  transition: color 0.3s ease;
  padding: 0 1rem; /* Add some padding so text doesn't touch edges */
}

@media (max-width: 767px) {
  .orange-blurb {
    top: auto; /* Override top on mobile */
    bottom: 5%; /* Position from bottom on mobile */
  }
}

.orange-blurb.on-orange {
  color: #ffffff; /* Changes to white when orange section touches top */
}

/* Desktop size for orange blurb */
@media (min-width: 768px) {
  .orange-blurb {
    top: 73%; /* Desktop: stays at original position */
    font-size: 1.4rem; /* Keep desktop size */
    width: auto; /* Desktop: let it size naturally */
    max-width: 80%; /* Desktop: cap at 80% */
  }
}
</style>
