// Keep this in sync with the React Native app's BASE_URL
// d:\\Desktop\\date\\urls\\url.js
// Prefer env override for local development; fall back to local API when running on localhost
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);

export const BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  (isLocalhost ? 'http://localhost:4000' : 'https://dating-app-c1vv.onrender.com');