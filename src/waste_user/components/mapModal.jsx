import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapModal = ({ onSave, onCancel }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState({ lng: 36.8219, lat: -1.2921 }); // Default: Nairobi

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [coords.lng, coords.lat],
      zoom: 13
    });

    const marker = new maplibregl.Marker({ draggable: true })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      setCoords({ lng, lat });
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude
          };
          map.setCenter([userLoc.lng, userLoc.lat]);
          marker.setLngLat([userLoc.lng, userLoc.lat]);
          setCoords(userLoc);
        },
        () => console.warn('Location access denied.')
      );
    }

    mapInstance.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="modal-backdrop">
      <div className="modal-map-container">
        <div ref={mapRef} className="map-view" />
        <div className="modal-actions">
          <button type="button" onClick={() => onSave(coords)}>✅ Save</button>
          <button type="button" onClick={onCancel} className="cancel">❌ Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
