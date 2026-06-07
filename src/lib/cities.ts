// Major Polish cities with centre coordinates. Used by the location picker until a real
// geocoder backend exists — selecting a city re-centres the search around these coords.

export type City = { name: string; lat: number; lng: number };

export const PL_CITIES: City[] = [
  { name: "Warszawa", lat: 52.2297, lng: 21.0122 },
  { name: "Kraków", lat: 50.0647, lng: 19.945 },
  { name: "Łódź", lat: 51.7592, lng: 19.456 },
  { name: "Wrocław", lat: 51.1079, lng: 17.0385 },
  { name: "Poznań", lat: 52.4064, lng: 16.9252 },
  { name: "Gdańsk", lat: 54.352, lng: 18.6466 },
  { name: "Szczecin", lat: 53.4285, lng: 14.5528 },
  { name: "Bydgoszcz", lat: 53.1235, lng: 18.0084 },
  { name: "Lublin", lat: 51.2465, lng: 22.5684 },
  { name: "Katowice", lat: 50.2649, lng: 19.0238 },
  { name: "Białystok", lat: 53.1325, lng: 23.1688 },
  { name: "Gdynia", lat: 54.5189, lng: 18.5305 },
  { name: "Rzeszów", lat: 50.0413, lng: 21.999 },
];

/** The default search origin shown when the user hasn't set a location yet. */
export const DEFAULT_CITY: City = PL_CITIES[0];
