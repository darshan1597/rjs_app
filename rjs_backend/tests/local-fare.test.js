import { describe, expect, it } from 'vitest';

import { calculateLocalFare, fareBandFor } from '../src/modules/bookings/local-fare.service.js';

describe('local ride fare calculation', () => {
  it('selects the government fare band from on-road value', () => {
    expect(fareBandFor(1_000_000).code).toBe('UP_TO_10_LAKH');
    expect(fareBandFor(1_000_001).code).toBe('ABOVE_10_TO_15_LAKH');
    expect(fareBandFor(1_500_001).code).toBe('ABOVE_15_LAKH');
  });

  it('charges minimum fare through the first four kilometres', () => {
    const fare = calculateLocalFare({
      onRoadPrice: 900_000,
      distanceKm: 3.5,
      bookedAt: new Date('2026-09-10T06:30:00.000Z'),
    });
    expect(fare.distanceFare).toBe(100);
    expect(fare.gstAmount).toBe(5);
    expect(fare.totalFare).toBe(105);
  });

  it('taxes distance, waiting and night surcharge but excludes toll', () => {
    const fare = calculateLocalFare({
      onRoadPrice: 900_000,
      distanceKm: 4,
      waitingMinutes: 8,
      tollCharge: 50,
      bookedAt: new Date('2026-09-10T19:00:00.000Z'),
    });
    expect(fare.waitingCharge).toBe(3);
    expect(fare.nightSurcharge).toBe(10);
    expect(fare.taxableSubtotal).toBe(113);
    expect(fare.gstAmount).toBe(5.65);
    expect(fare.totalFare).toBe(168.65);
  });
});
