export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStop {
  id: string;
  name: string;
  position: LatLng;
  type: "origin" | "waypoint" | "destination";
  order: number;
  photos: PhotoMarker[];
  content: string;
}

export interface PhotoMarker {
  id: string;
  position: LatLng;
  thumbnail: string;
  originalUrl: string;
  timestamp: Date | null;
  altitude: number | null;
  fileName: string;
}

export interface RouteSegment {
  from: LatLng;
  to: LatLng;
  geometry: LatLng[];
  distance: number;
  duration: number;
}

export type TransportMode = "car" | "walk" | "bicycle" | "traffic";

export interface Journey {
  id: string;
  title: string;
  stops: RouteStop[];
  content: string;
  route: RouteSegment | null;
  transportMode: TransportMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: string;
  roadAddress?: string;
  phone?: string;
  placeUrl?: string;
}
