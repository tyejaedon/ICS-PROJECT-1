import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';


const MapModal = ({ onSave, onCancel }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState({ lng: 36.8219, lat: -1.2921 });

  useEffect(() => {
    mapInstance.current = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [coords.lng, coords.lat],
      zoom: 13
    });

    markerRef.current = new maplibregl.Marker({ draggable: true })
      .setLngLat([coords.lng, coords.lat])
      .addTo(mapInstance.current);

    markerRef.current.on('dragend', () => {
      const { lng, lat } = markerRef.current.getLngLat();
      setCoords({ lng, lat });
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude
          };
          mapInstance.current.setCenter([userLoc.lng, userLoc.lat]);
          markerRef.current.setLngLat([userLoc.lng, userLoc.lat]);
          setCoords(userLoc);
        },
        () => console.warn('Location access denied.')
      );
    }

    return () => mapInstance.current.remove();
  }, []);

  return (
    <div className="modal-backdrop">
      <div className="modal-map-container">
        <div ref={mapRef} className="map-view" />
        <div className="modal-actions">
          <button onClick={() => onSave(coords)}>✅ Save</button>
          <button onClick={onCancel} className="cancel">❌ Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
