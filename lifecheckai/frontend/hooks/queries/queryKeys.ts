export const safetyKeys = {
  all: ["safety"] as const,
  cities: () => [...safetyKeys.all, "cities"] as const,
  liveCities: () => [...safetyKeys.cities(), "live"] as const,
  city: (city: string) => [...safetyKeys.all, "city", city.trim().toLowerCase()] as const,
  coordinates: (lat: number, lon: number) =>
    [...safetyKeys.all, "coordinates", Number(lat.toFixed(4)), Number(lon.toFixed(4))] as const,
  suggestions: (q: string) => [...safetyKeys.all, "suggestions", q.trim().toLowerCase()] as const,
};

export const waterKeys = {
  all: ["water"] as const,
  states: () => [...waterKeys.all, "states"] as const,
  stations: (state: string, query?: string) =>
    [...waterKeys.all, "stations", state.trim().toLowerCase(), query?.trim().toLowerCase() || ""] as const,
  prediction: (state: string, stationId?: string, location?: string) =>
    [...waterKeys.all, "prediction", state.trim().toLowerCase(), stationId || "", location?.trim().toLowerCase() || ""] as const,
  trends: (state: string, stationId?: string, location?: string) =>
    [...waterKeys.all, "trends", state.trim().toLowerCase(), stationId || "", location?.trim().toLowerCase() || ""] as const,
  nearby: (lat: number, lon: number) =>
    [...waterKeys.all, "nearby", Number(lat.toFixed(4)), Number(lon.toFixed(4))] as const,
  metrics: () => [...waterKeys.all, "metrics"] as const,
};
