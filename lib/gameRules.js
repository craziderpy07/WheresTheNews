export const ROUND_COUNT = 5;

export const GAME_MODES = [
  { id: 'current', name: 'Current Events', icon: '●', enabled: true, description: 'Daily challenge and random news rounds' },
  { id: 'historical', name: 'Historical', icon: '◷', enabled: false, description: 'Historical news and events', note: 'Coming later' },
  { id: 'default', name: 'Mixed', icon: '◎', enabled: false, description: 'Historical and current events', note: 'Coming later' }
];

export function getChallengeDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  const day = parts.find((part) => part.type === 'day').value;
  return `${year}-${month}-${day}`;
}

export function isValidCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

// uses haversine to work out how far your pin is from the answer on the globe
export function calculateDistanceKm(guess, answer) {
  const radians = Math.PI / 180;
  const latitude1 = guess.latitude * radians;
  const latitude2 = answer.latitude * radians;
  const latitudeDifference = latitude2 - latitude1;
  const longitudeDifference = (answer.longitude - guess.longitude) * radians;

  const haversine = Math.sin(latitudeDifference / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDifference / 2) ** 2;
  const clamped = Math.min(1, Math.max(0, haversine));

  return 2 * 6371.0088 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
}

export function calculatePoints(distanceKm) {
  // gives 1000 points within 100 km then less the further away you are
  // lower 2000 to make points drop faster or raise it to be more forgiving
  return Math.round(1000 * Math.exp(-Math.max(0, distanceKm - 100) / 2000));
}
