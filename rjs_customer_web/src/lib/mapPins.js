export function rjsPinDataUrl(type = 'pickup') {
  const color = type === 'pickup' ? '#0756f8' : '#ff5a00';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 72 90"><ellipse cx="36" cy="78" rx="20" ry="7" fill="${color}" fill-opacity=".16"/><path d="M36 73V43" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/><circle cx="36" cy="78" r="5.5" fill="white"/><circle cx="36" cy="78" r="3.2" fill="${color}"/><circle cx="36" cy="29" r="24" fill="${color}"/><circle cx="36" cy="29" r="17.5" fill="white"/><circle cx="36" cy="29" r="10.5" fill="${color}"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
