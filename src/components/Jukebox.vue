<script setup lang="ts">

</script>

<template>
  <div class="jukebox-container" id="jukeboxContainer">
    <img src="@/assets/jukebox.png" alt="Jukebox" class="jukebox-image" id="jukeboxImage">
    <button class="play-button" id="playButton">
      <div class="play-icon"></div>
      <div class="pause-icon"></div>
    </button>
  </div>

  <!-- Hidden YouTube player -->
  <div id="player" style="display: none;"></div>
</template>

<style scoped>

/* Jukebox container */
.jukebox-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 2.4rem; /* Mobile: 20% bigger (2rem * 1.2) - about 38px */
  height: 2.4rem; /* Mobile: 20% bigger (2rem * 1.2) - about 38px */
  z-index: 1000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

@media (min-width: 768px) {
  .jukebox-container {
    top: 2rem;
    right: 2rem;
    width: 3.6rem; /* Desktop: keep larger size - about 58px */
    height: 3.6rem;
  }
}

.jukebox-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform-origin: center center;
  pointer-events: auto;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  -webkit-backface-visibility: hidden;
  -moz-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transform: translateZ(0);
  -moz-transform: translateZ(0);
  transform: translateZ(0);
  will-change: transform;
}

@media (max-width: 767px) {
  .jukebox-image {
    /* Use smooth rendering on mobile to fix pixelation */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: auto;
    image-rendering: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

.jukebox-image.twitch {
  animation: jukeboxTwitch 0.5s ease-in-out forwards;
}

@keyframes jukeboxTwitch {
  0% { transform: rotate(0deg); opacity: 1; }
  100% { transform: rotate(70deg); opacity: 0; }
}

.jukebox-image.activated {
  opacity: 0;
  pointer-events: none;
  display: none;
}

/* Jukebox maintains original color on orange background */
/* Removed color inversion to keep original jukebox colors */

/* Play button styling - now behind jukebox */
.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1.8rem; /* Mobile: 20% bigger (1.5rem * 1.2) - about 29px */
  height: 1.8rem; /* Mobile: 20% bigger (1.5rem * 1.2) - about 29px */
  border-radius: 50%;
  background-color: #000;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.3s ease;
  z-index: 1001;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

@media (min-width: 768px) {
  .play-button {
    width: 2.7rem; /* Desktop: keep larger size - about 43px */
    height: 2.7rem;
  }
}

.play-button.revealed {
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
  animation: playButtonAppear 0.3s ease-out forwards;
}

@keyframes playButtonAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.play-button.on-orange {
  background-color: #ffffff;
}

.play-button:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.play-button:active {
  transform: translate(-50%, -50%) scale(0.95);
}

/* Play triangle */
.play-button .play-icon {
  width: 0;
  height: 0;
  border-left: 0.538rem solid #ffffff; /* Mobile: 20% bigger (0.448rem * 1.2) */
  border-top: 0.353rem solid transparent; /* Mobile: 20% bigger (0.294rem * 1.2) */
  border-bottom: 0.353rem solid transparent; /* Mobile: 20% bigger (0.294rem * 1.2) */
  margin-left: 0.154rem; /* Mobile: 20% bigger (0.128rem * 1.2) */
}

@media (min-width: 768px) {
  .play-button .play-icon {
    border-left: 0.806rem solid #ffffff; /* Desktop: 20% smaller */
    border-top: 0.538rem solid transparent; /* Desktop: 20% smaller */
    border-bottom: 0.538rem solid transparent; /* Desktop: 20% smaller */
    margin-left: 0.23rem; /* Desktop: 20% smaller */
  }
}

.play-button.on-orange .play-icon {
  border-left-color: #000000;
}

/* Pause icon */
.play-button .pause-icon {
  display: none;
  width: 0.768rem; /* Mobile: 20% bigger (0.64rem * 1.2) */
  height: 0.922rem; /* Mobile: 20% bigger (0.768rem * 1.2) */
  position: relative;
}

.play-button .pause-icon::before,
.play-button .pause-icon::after {
  content: '';
  position: absolute;
  width: 0.23rem; /* Mobile: 20% bigger (0.192rem * 1.2) */
  height: 0.922rem; /* Mobile: 20% bigger (0.768rem * 1.2) */
  background-color: #ffffff;
}

@media (min-width: 768px) {
  .play-button .pause-icon {
    width: 1.152rem; /* Desktop: 20% smaller */
    height: 1.392rem; /* Desktop: 20% smaller */
  }

  .play-button .pause-icon::before,
  .play-button .pause-icon::after {
    width: 0.336rem; /* Desktop: 20% smaller */
    height: 1.392rem; /* Desktop: 20% smaller */
  }
}

.play-button.on-orange .pause-icon::before,
.play-button.on-orange .pause-icon::after {
  background-color: #000000;
}

.play-button .pause-icon::before {
  left: 0;
}

.play-button .pause-icon::after {
  right: 0;
}

.play-button.playing .play-icon {
  display: none;
}

.play-button.playing .pause-icon {
  display: block;
}
</style>