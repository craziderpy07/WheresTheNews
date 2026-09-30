'use client';

import { useEffect, useRef, useState } from 'react';

export default function GameMap({ onGuess, guess }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const pinRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let handler;

    async function setup() {
      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/WheresTheNews' : '';
        window.CESIUM_BASE_URL = `${basePath}/cesium/`;
        const Cesium = await import('cesium');
        if (cancelled || !containerRef.current) return;

        Cesium.Ion.defaultAccessToken = '';
        const viewer = new Cesium.Viewer(containerRef.current, {
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
        viewerRef.current = viewer;
        viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(-15, 24, 23000000) });

        handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement) => {
          const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
          if (!cartesian) return;
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          const lng = Cesium.Math.toDegrees(cartographic.longitude);
          onGuess?.({ lat, lng });

          if (pinRef.current) viewer.entities.remove(pinRef.current);
          pinRef.current = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            point: {
              pixelSize: 15,
              color: Cesium.Color.fromCssColorString('#0E5F8A'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 3,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
          });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      } catch {
        setError('The interactive map could not load. Install dependencies and restart the development server.');
      }
    }

    setup();
    return () => {
      cancelled = true;
      handler?.destroy();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) viewerRef.current.destroy();
      viewerRef.current = null;
    };
  }, [onGuess]);

  return (
    <div className="active-map-card prototype-card">
      <div className="active-map-toolbar">
        <div>
          <strong>Place your guess</strong>
          <span>Click anywhere on the globe to drop your pin.</span>
        </div>
        {guess && <span className="chip">Pin placed</span>}
      </div>
      <div ref={containerRef} className="active-cesium-container" />
      {error && <p className="form-message cesium-error">{error}</p>}
    </div>
  );
}
