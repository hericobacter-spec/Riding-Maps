declare namespace kakao {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      setLevel(level: number): void;
      getLevel(): number;
      setBounds(bounds: LatLngBounds): void;
      panTo(latlng: LatLng): void;
      addOverlayMapTypeId(mapTypeId: MapTypeId): void;
      removeOverlayMapTypeId(mapTypeId: MapTypeId): void;
    }

    interface MapOptions {
      center: LatLng;
      level: number;
      mapTypeId?: MapTypeId;
    }

    type MapTypeId = string;

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLng): void;
      getPosition(): LatLng;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      title?: string;
      image?: MarkerImage;
      draggable?: boolean;
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: MarkerImageOptions);
    }

    interface MarkerImageOptions {
      offset?: Point;
      shape?: string;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(latlng: LatLng): void;
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
      isEmpty(): boolean;
      contain(latlng: LatLng): boolean;
      toString(): string;
      equals(latlngBounds: LatLngBounds): boolean;
    }

    class Polyline {
      constructor(options: PolylineOptions);
      setMap(map: Map | null): void;
    }

    interface PolylineOptions {
      path: LatLng[];
      strokeWeight?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeStyle?: string;
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, marker: Marker): void;
      close(): void;
      setContent(content: string): void;
    }

    interface InfoWindowOptions {
      content: string;
      position?: LatLng;
      removable?: boolean;
    }

    namespace services {
      class Places {
        keywordSearch(
          keyword: string,
          callback: (result: PlacesSearchResult[], status: Status) => void,
          options?: PaginationOptions
        ): void;
      }

      interface PlacesSearchResult {
        id: string;
        place_name: string;
        address_name: string;
        road_address_name: string;
        x: string;
        y: string;
        category_name: string;
        phone: string;
        place_url: string;
      }

      type Status = string;
      const OK: Status;
      const ZERO_RESULT: Status;

      interface PaginationOptions {
        location?: LatLng;
        radius?: number;
        page?: number;
      }
    }

    function load(callback: () => void): void;

    class event {
      static addListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
      static removeListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
    }
  }
}
