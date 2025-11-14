// ZEGOCLOUD App credentials for development.
// IMPORTANT: Do NOT ship appSign in production builds. Use a server-generated token.
// Replace the placeholders below with your ZEGOCLOUD App ID and App Sign from the console.

export const ZEGOCLOUD_APP_ID = 1381986278; // e.g., 123456789
export const ZEGOCLOUD_APP_SIGN = '26c504a8e241865e28660653af7234a33aff0196b23d84c5e1b573dab1f93d13';

// When you move to production, generate a token on your backend and pass it here.
// Example: export const ZEGOCLOUD_TOKEN_URL = 'https://your.api.example.com/zego-token';
export const ZEGOCLOUD_TOKEN_URL = '';

// Helper to build a stable room ID between two users
export const buildRoomId = (a, b) => {
  const s = [String(a || ''), String(b || '')].sort();
  return `room_${s[0]}_${s[1]}`;
};