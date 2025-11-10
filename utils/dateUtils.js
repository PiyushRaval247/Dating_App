export const getAgeFromDob = (dob) => {
  try {
    if (!dob) return null;
    let date;
    if (dob instanceof Date) {
      date = dob;
    } else if (typeof dob === 'number') {
      date = new Date(dob);
    } else if (typeof dob === 'string') {
      const trimmed = dob.trim();
      // Match YYYY-MM-DD or YYYY/MM/DD
      const isoMatch = trimmed.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})$/);
      if (isoMatch) {
        const [_, y, m, d] = isoMatch;
        date = new Date(Number(y), Number(m) - 1, Number(d));
      } else {
        // Match DD/MM/YYYY
        const dmyMatch = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
        if (dmyMatch) {
          const [_, d, m, y] = dmyMatch;
          date = new Date(Number(y), Number(m) - 1, Number(d));
        } else {
          // Fallback to Date parse
          const parsed = new Date(trimmed);
          if (!isNaN(parsed.getTime())) {
            date = parsed;
          }
        }
      }
    }

    if (!date || isNaN(date.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  } catch (e) {
    return null;
  }
};

// Compute remaining days between today and an end date using calendar-day math.
// Returns a non-negative integer or null when date is invalid.
export const getDaysLeft = (endDate) => {
  try {
    if (!endDate) return null;
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return null;
    const today = new Date();
    // Normalize to start of day (local time) to avoid off-by-one rounding issues.
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffMs = startOfEnd - startOfToday;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days; // never negative
  } catch (_) {
    return null;
  }
};