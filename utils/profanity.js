// Simple profanity filter: masks listed words with asterisks
// Usage: maskBadWords('some text') => text with bad words replaced by *****

const DEFAULT_WORDS = [
  'fuck',
  'dick',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'bastard',
  'slut',
  'whore',
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function maskBadWords(text, customList) {
  try {
    if (typeof text !== 'string' || text.length === 0) return text;
    const list = Array.isArray(customList) && customList.length > 0 ? customList : DEFAULT_WORDS;
    const pattern = `\\b(${list.map(w => escapeRegex(w)).join('|')})\\b`;
    const re = new RegExp(pattern, 'gi');
    return text.replace(re, (match) => '*'.repeat(match.length));
  } catch (e) {
    // In case of any regex issues, fall back to original text
    return text;
  }
}

export default maskBadWords;