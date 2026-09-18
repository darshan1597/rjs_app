// Prevent duplicate in-flight gateway calls within one backend process.
export function createSingleFlight() {
  const pending = new Map();
  return (key, operation) => {
    if (pending.has(key)) return pending.get(key);
    const promise = Promise.resolve().then(operation).finally(() => { if (pending.get(key) === promise) pending.delete(key); });
    pending.set(key, promise);
    return promise;
  };
}
