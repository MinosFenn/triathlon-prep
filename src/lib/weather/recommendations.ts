import type { DisciplineKey } from "@/types";
import type { WeatherCurrent, WeatherRecommendation } from "@/lib/weather/types";
import { isRainy } from "@/lib/weather/codes";

export function buildWeatherRecommendation(
  discipline: DisciplineKey,
  current: WeatherCurrent
): WeatherRecommendation {
  const tips: string[] = [];
  let level: WeatherRecommendation["level"] = "ok";
  let headline = "Conditions favorables pour ta séance.";

  const heavyRain =
    isRainy(current.weatherCode) &&
    (current.precipitationMm > 0.5 || current.weatherCode >= 65);
  const lightRain = isRainy(current.weatherCode) && !heavyRain;
  const strongWind = current.windGustsKmh >= 40 || current.windKmh >= 30;
  const veryStrongWind = current.windGustsKmh >= 55;
  const cold = current.feelsLikeC < 8;
  const hot = current.feelsLikeC >= 28;

  switch (discipline) {
    case "swim":
      if (heavyRain || current.weatherCode >= 95) {
        level = "warning";
        headline = "Pluie ou orage — privilégie la piscine.";
        tips.push("Évite l'eau libre par visibilité et sécurité.");
      } else if (strongWind) {
        level = "caution";
        headline = "Vent marqué en eau libre.";
        tips.push("Reste près du bord ou choisis une piscine.");
      }
      if (cold) {
        level = level === "ok" ? "caution" : level;
        tips.push("Eau froide : combinaison nécessaire (< 18°C).");
      }
      break;

    case "bike":
      if (veryStrongWind) {
        level = "warning";
        headline = "Vent fort — home-trainer ou route abritée.";
      } else if (strongWind) {
        level = "caution";
        headline = "Vent notable — adapte l'itinéraire.";
        tips.push("Évite les cols exposés et les descentes techniques.");
      }
      if (heavyRain) {
        level = "warning";
        headline = "Pluie soutenue — home-trainer recommandé.";
      } else if (lightRain) {
        level = level === "ok" ? "caution" : level;
        tips.push("Route glissante : freinage progressif, éclairage.");
      }
      break;

    case "run":
      if (heavyRain) {
        level = "caution";
        headline = "Pluie — séance possible avec équipement adapté.";
        tips.push("Chaussures avec grip, évite les sentiers boueux.");
      }
      if (hot) {
        level = level === "ok" ? "caution" : level;
        headline = "Chaleur — hydrate-toi et ralentis la zone.";
        tips.push("Privilégie tôt le matin ou ombrage.");
      }
      if (cold && current.feelsLikeC < 5) {
        tips.push("Couches chaudes + échauffement prolongé.");
      }
      break;

    case "brick":
      if (heavyRain || veryStrongWind) {
        level = "warning";
        headline = "Météo difficile pour le brick extérieur.";
        tips.push("Envisage vélo home-trainer + course tapis ou report.");
      } else if (strongWind || lightRain) {
        level = "caution";
        headline = "Brick possible avec adaptations.";
        tips.push("Partie vélo plus abritée, transition sécurisée.");
      }
      break;

    case "recovery":
      headline = "Météo du jour pour planifier ta sortie éventuelle.";
      if (heavyRain) tips.push("Yoga / mobilité en intérieur aujourd'hui.");
      break;
  }

  if (tips.length === 0 && level === "ok") {
    tips.push("Profite des conditions pour ta séance prévue.");
  }

  return { level, headline, tips };
}
