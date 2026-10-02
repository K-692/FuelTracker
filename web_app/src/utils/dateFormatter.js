/**
 * dateFormatter.js
 * Formats dates strictly as DD/Apr/YYYY (e.g., 02/Oct/2026).
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats an input date (string, timestamp, or Date) to DD/Apr/YYYY.
 * @param {string|number|Date} dateInput 
 * @returns {string} e.g. "02/Oct/2026"
 */
export function formatDate(dateInput) {
  if (!dateInput) return '--';

  try {
    let dateObj;
    if (typeof dateInput === 'string' && dateInput.includes('-') && dateInput.length === 10) {
      // YYYY-MM-DD
      const [year, month, day] = dateInput.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(dateInput);
    }

    if (isNaN(dateObj.getTime())) return String(dateInput);

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Returns today's date formatted for HTML <input type="date"> (YYYY-MM-DD).
 */
export function getTodayInputDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
