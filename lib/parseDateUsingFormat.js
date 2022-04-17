import convertLocalDateToUtcDateWithSameTime from './convertLocalDateToUtcDateWithSameTime.js';

export default function parseDateUsingFormat(value, format) {
  const date = _parseDateUsingFormat(value, format);
  if (date) {
    // Convert the `Date` from `00:00` in local time zone
    // to `00:00` in `UTC+0` time zone.
    return convertLocalDateToUtcDateWithSameTime(date);
  }
}

function _parseDateUsingFormat(value, format) {
  if (format !== YEAR_MONTH_DAY_DATE_PATTERN) {
    throw new Error(`Unsupported date format: ${format}`);
  }
  return parseDateDayMonthYear(value);
}

export const YEAR_MONTH_DAY_DATE_PATTERN = 'yyyy-mm-dd';
export const YEAR_MONTH_DAY_DATE_REGEXP = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateDayMonthYear(value) {
  const match = value.match(YEAR_MONTH_DAY_DATE_REGEXP);
  if (match) {
    const [_, year, month, day] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
  }
}
