// 1. YYYY
// 2. MM
// 3. DD
// 4. HH
// 5. mm
// 6. ss
// 7. msec
export const DATE_ISO_STRING_REGEXP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/;

export const DATE_ISO_STRING_PATTERN = 'yyyy-mm-ddThh:mm:ss.sssZ';

export default function parseDateIsoString(value) {
  if (DATE_ISO_STRING_REGEXP.test(value)) {
    return new Date(value);
  }
}
