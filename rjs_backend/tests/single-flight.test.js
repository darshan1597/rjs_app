import { vi } from 'vitest';
import { createSingleFlight } from '../src/common/single-flight.js';

it('shares concurrent operations for the same booking', async () => {
  const flight = createSingleFlight();
  const operation = vi.fn().mockResolvedValue('order_test');
  expect(await Promise.all([flight('booking', operation), flight('booking', operation)])).toEqual(['order_test', 'order_test']);
  expect(operation).toHaveBeenCalledTimes(1);
});
it('permits retry after an operation fails', async () => {
  const flight = createSingleFlight();
  await expect(flight('booking', () => Promise.reject(new Error('network')))).rejects.toThrow('network');
  await expect(flight('booking', () => Promise.resolve('order_retry'))).resolves.toBe('order_retry');
});
