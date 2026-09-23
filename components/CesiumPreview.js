'use client';

import { useEffect, useRef, useState } from 'react';

export default function CesiumPreview() {
  const containerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let viewer;
    let cancelled = false;

    async function setup() {
      try {
        window.CESIUM_BASE_URL = '/cesium/';
        const Cesium = await import('cesium');
        if (cancelled || !containerRef.current) return;
        Cesium.Ion.defaultAccessToken = '';
        viewer = new Cesium.Viewer(containerRef.current, {
          baseLayer: false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          animation: false,
          timeline: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false
        });
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-15, 24, 23000000)
        });
      } catch (e) {
        setError('CesiumJS preview could not load. Install dependencies and restart the dev server.');
      }
    }

    setup();
    return () => {
      cancelled = true;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return (
    <div className="cesium-card">
      <div className="cesium-heading">
        <div><strong>CesiumJS map technology preview</strong><p>Map-based guessing will be implemented in the next milestone.</p></div>
        <span className="chip">CesiumJS</span>
      </div>
      <div ref={containerRef} className="cesium-container" />
      {error && <p className="form-message">{error}</p>}
    </div>
  );
}
