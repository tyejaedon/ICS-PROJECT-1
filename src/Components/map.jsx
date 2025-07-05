import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapLibreMap = ({ onLocationChange }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState({ lng: 36.8219, lat: -1.2921 }); // Nairobi default

  useEffect(() => {
    mapInstance.current = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [coords.lng, coords.lat],
      zoom: 13
    });

    // Add draggable marker
    markerRef.current = new maplibregl.Marker({ draggable: true })
      .setLngLat([coords.lng, coords.lat])
      .addTo(mapInstance.current);

    // Listen to marker drag
    markerRef.current.on('dragend', () => {
      const lngLat = markerRef.current.getLngLat();
      setCoords({ lng: lngLat.lng, lat: lngLat.lat });
      if (onLocationChange) onLocationChange({ lng: lngLat.lng, lat: lngLat.lat });
    });

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lng: position.coords.longitude,
            lat: position.coords.latitude
          };
          mapInstance.current.setCenter([userCoords.lng, userCoords.lat]);
          markerRef.current.setLngLat([userCoords.lng, userCoords.lat]);
          setCoords(userCoords);
          if (onLocationChange) onLocationChange(userCoords);
        },
        (error) => {
          console.warn('Geolocation permission denied, using default location.');
        }
      );
    }

    return () => mapInstance.current.remove();
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '500px',
        borderRadius: '12px',
        overflow: 'hidden',
        marginTop: '1rem'
      }}
    />
  );
};

export default MapLibreMap;
