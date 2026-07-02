/** WMO weather codes — https://open-meteo.com/en/docs */
const WMO_LABELS: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Peu nuageux",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Bruine dense",
  61: "Pluie faible",
  63: "Pluie",
  65: "Forte pluie",
  66: "Pluie verglaçante",
  67: "Forte pluie verglaçante",
  71: "Neige faible",
  73: "Neige",
  75: "Forte neige",
  77: "Grains de neige",
  80: "Averses faibles",
  81: "Averses",
  82: "Fortes averses",
  85: "Averses de neige",
  86: "Fortes averses de neige",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent avec grêle",
};

export function weatherCodeLabel(code: number): string {
  return WMO_LABELS[code] ?? "Conditions variables";
}

export function isRainy(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code === 95 ||
    code === 96 ||
    code === 99
  );
}

export function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  if (isRainy(code)) return "🌧️";
  return "🌤️";
}
