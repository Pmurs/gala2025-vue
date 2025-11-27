# Gala 2025 – React rewrite

An immersive, scroll-driven RSVP experience for the annual Gala. The site has been rebuilt in **React + Vite** with three stacked panes:

1. **Hero / peel-away**: Fixed typography with a white overlay that peels back to reveal the orange section.
2. **Story + CTA**: The orange middle layer that keeps the copy anchored and lets the hero text invert colors as visitors scroll.
3. **Details + RSVP Drawer**: A slide-up pane that locks in place once fully revealed, showing event info, the RSVP workflow, and the live guest list.

Supabase powers both authentication (SMS OTP) and guest storage. Twilio integration can be layered in later if we want to send bespoke reminders while continuing to use Supabase Auth today.

## Stack

- React 18 + Vite 5 (TypeScript)
- Supabase JS client (`@supabase/supabase-js`)
- Plain CSS for the layered scroll & jukebox experience

## Getting started

```bash
npm install
npm run dev
```

Build for production with `npm run build` or preview the build with `npm run preview`.

## Environment

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if you do not want to rely on the baked-in demo credentials. The current setup reads the literal values inside `src/api/supabase.ts`; swap them for env vars before shipping.

## How the site works

- **Scroll choreography** lives in `App.tsx`. We watch `scrollY`/`innerHeight` to translate the white overlay and third pane, and to flip typography as soon as the orange layer reaches the viewport top.
- **RSVP workflow** is split into small React components (`PhoneSignIn`, `CreateRSVP`, `EditRSVP`, `GuestList`). State stays in `App.tsx`, which decides whether to show the phone gate, new RSVP flow, edit form, or the read-only guest list.
- **Music player** (`MusicPlayer.tsx`) keeps the playful jukebox image and uses a single HTML `<audio>` tag with a royalty-free loop so it works without external SDKs. Swap the track URL to anything you own.

## Next steps & Twilio hand-off

- Connect Twilio Verify or Messaging to send custom-branded codes. The `PhoneSignIn` component isolates the OTP UX, so swapping Supabase Auth for Twilio only requires changing the `sendOtp`/`verifyOtp` helpers.
- Add admin tooling (export CSV, mark payments) via Supabase Row Level Security.
- If traffic spikes, prerender the hero/scroll layers and lazy load Supabase interactions so the guest list still feels instant.
