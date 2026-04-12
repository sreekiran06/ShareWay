import React, { useEffect, useRef } from 'react';

// Dynamically load Leaflet to avoid SSR issues
let L = null;

const getLeaflet = async () => {
  if (L) return L;
  L = await import('leaflet');
  return L;
};

// Custom markers
const createDriverIcon = (L) => L.divIcon({
  html: `<div style="width:36px;height:36px;background:#f97316;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
  </div>`,
  iconSize: [36, 36],
  className: ''
});

const createPickupIcon = (L) => L.divIcon({
  html: `<div style="width:28px;height:28px;background:#10b981;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [28, 28],
  className: ''
});

const createDropIcon = (L) => L.divIcon({
  html: `<div style="width:28px;height:28px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [28, 28],
  className: ''
});

export default function MapView({
  center = [17.385, 78.4867], // Hyderabad default
  zoom = 13,
  pickup,
  destination,
  driverLocation,
  nearbyDrivers = [],
  className = '',
  height = '400px',
  onMapClick
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const routeLayerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      const L = await getLeaflet();
      if (!mounted || !mapRef.current || mapInstanceRef.current) return;

      // Initialize map
      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true
      });

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      if (onMapClick) map.on('click', onMapClick);
      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when props change
  useEffect(() => {
    const updateMarkers = async () => {
      const L = await getLeaflet();
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear existing markers
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null; }

      const bounds = [];

      // Pickup marker
      if (pickup?.lat && pickup?.lng) {
        const m = L.marker([pickup.lat, pickup.lng], { icon: createPickupIcon(L) })
          .addTo(map)
          .bindPopup(`<b>Pickup:</b><br>${pickup.address || 'Pickup Location'}`);
        markersRef.current.pickup = m;
        bounds.push([pickup.lat, pickup.lng]);
      }

      // Destination marker
      if (destination?.lat && destination?.lng) {
        const m = L.marker([destination.lat, destination.lng], { icon: createDropIcon(L) })
          .addTo(map)
          .bindPopup(`<b>Drop:</b><br>${destination.address || 'Destination'}`);
        markersRef.current.destination = m;
        bounds.push([destination.lat, destination.lng]);
      }

      // Draw route line
      if (pickup?.lat && destination?.lat) {
        routeLayerRef.current = L.polyline([
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng]
        ], { color: '#f97316', weight: 4, opacity: 0.8, dashArray: '8, 4' }).addTo(map);
      }

      // Driver location
      if (driverLocation?.lat && driverLocation?.lng) {
        const m = L.marker([driverLocation.lat, driverLocation.lng], { icon: createDriverIcon(L) })
          .addTo(map)
          .bindPopup('<b>Your Driver</b>');
        markersRef.current.driver = m;
        bounds.push([driverLocation.lat, driverLocation.lng]);
      }

      // Nearby drivers
      nearbyDrivers.forEach((driver, i) => {
        if (driver.currentLocation?.coordinates?.length === 2) {
          const [lng, lat] = driver.currentLocation.coordinates;
          const m = L.marker([lat, lng], { icon: createDriverIcon(L) })
            .addTo(map)
            .bindPopup(`<b>Driver nearby</b><br>⭐ ${driver.rating?.average || 'N/A'}`);
          markersRef.current[`nearby_${i}`] = m;
        }
      });

      // Fit bounds
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      }
    };

    updateMarkers();
  }, [pickup, destination, driverLocation, nearbyDrivers]);

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className={`w-full map-container ${className}`}
    />
  );
}
