import { randomBytes } from 'node:crypto';

const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const indiaDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function indiaDateStamp(date = new Date()) {
  const parts = indiaDateFormatter.formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}${value.month}${value.day}`;
}

function randomCode(length = 8) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function generateBookingNumber(date = new Date()) {
  return `RJS-${indiaDateStamp(date)}-${randomCode()}`;
}

function isBookingNumberCollision(error) {
  return Boolean(error?.code === 11000
    && (error?.keyPattern?.bookingNumber === 1 || error?.keyValue?.bookingNumber));
}

export { generateBookingNumber, indiaDateStamp, isBookingNumberCollision };
