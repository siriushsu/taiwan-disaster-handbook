// Google Maps directions deep link — on mobile this opens the Maps app
// with turn-by-turn navigation to the facility.
export function mapsDirUrl(item: {
  lat?: number;
  lng?: number;
  name: string;
  address?: string;
}): string {
  return item.lat != null && item.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address || item.name)}`;
}
