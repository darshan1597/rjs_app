import { env } from '../../config/env.js';

const LOCAL_FARE_CONFIG = Object.freeze({
  includedDistanceKm: 4,
  waitingFreeMinutes: 5,
  waitingRatePerMinute: 1,
  nightStartHour: 0,
  nightEndHour: 6,
  nightSurchargePercent: 10,
  gstPercent: env.LOCAL_RIDE_GST_PERCENT,
});

function fareBandFor(onRoadPrice) {
  if (onRoadPrice <= 1_000_000) {
    return { code: 'UP_TO_10_LAKH', minimumFare: 100, perKmRate: 24 };
  }
  if (onRoadPrice <= 1_500_000) {
    return { code: 'ABOVE_10_TO_15_LAKH', minimumFare: 115, perKmRate: 28 };
  }
  return { code: 'ABOVE_15_LAKH', minimumFare: 130, perKmRate: 32 };
}

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function hourInIndia(date) {
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date));
}

function calculateLocalFare({
  onRoadPrice,
  distanceKm,
  waitingMinutes = 0,
  tollCharge = 0,
  parkingCharge = 0,
  bookedAt = new Date(),
}) {
  const vehicleValue = Number(onRoadPrice);
  const distance = Math.max(0, Number(distanceKm));
  if (!Number.isFinite(vehicleValue) || vehicleValue <= 0) {
    throw new TypeError('A valid vehicle on-road price is required');
  }
  if (!Number.isFinite(distance)) throw new TypeError('A valid distance is required');

  const band = fareBandFor(vehicleValue);
  const extraDistanceKm = Math.max(0, distance - LOCAL_FARE_CONFIG.includedDistanceKm);
  const distanceFare = money(band.minimumFare + extraDistanceKm * band.perKmRate);
  const totalWaitingMinutes = Math.max(0, Number(waitingMinutes) || 0);
  const chargeableWaitingMinutes = Math.max(
    0,
    Math.ceil(totalWaitingMinutes - LOCAL_FARE_CONFIG.waitingFreeMinutes),
  );
  const waitingCharge = money(chargeableWaitingMinutes * LOCAL_FARE_CONFIG.waitingRatePerMinute);
  const bookingHour = hourInIndia(new Date(bookedAt));
  const nightApplicable = bookingHour >= LOCAL_FARE_CONFIG.nightStartHour
    && bookingHour < LOCAL_FARE_CONFIG.nightEndHour;
  const nightSurcharge = money(
    nightApplicable ? distanceFare * LOCAL_FARE_CONFIG.nightSurchargePercent / 100 : 0,
  );
  const taxableSubtotal = money(distanceFare + waitingCharge + nightSurcharge);
  const gstAmount = money(taxableSubtotal * LOCAL_FARE_CONFIG.gstPercent / 100);
  const toll = money(Math.max(0, Number(tollCharge) || 0));
  const parking = money(Math.max(0, Number(parkingCharge) || 0));
  const totalFare = money(taxableSubtotal + gstAmount + toll + parking);

  return {
    vehicleOnRoadPrice: vehicleValue,
    fareBand: band.code,
    minimumFare: band.minimumFare,
    includedDistanceKm: LOCAL_FARE_CONFIG.includedDistanceKm,
    perKmRate: band.perKmRate,
    distanceKm: distance,
    extraDistanceKm: money(extraDistanceKm),
    distanceFare,
    waitingMinutes: totalWaitingMinutes,
    freeWaitingMinutes: LOCAL_FARE_CONFIG.waitingFreeMinutes,
    chargeableWaitingMinutes,
    waitingRatePerMinute: LOCAL_FARE_CONFIG.waitingRatePerMinute,
    waitingCharge,
    nightApplicable,
    nightSurchargePercent: nightApplicable ? LOCAL_FARE_CONFIG.nightSurchargePercent : 0,
    nightSurcharge,
    taxableSubtotal,
    gstPercent: LOCAL_FARE_CONFIG.gstPercent,
    gstAmount,
    tollCharge: toll,
    parkingCharge: parking,
    totalFare,
  };
}

export { LOCAL_FARE_CONFIG, calculateLocalFare, fareBandFor };
