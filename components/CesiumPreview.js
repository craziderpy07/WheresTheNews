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
          selectionIndicator: false,
          baseLayerPicker: false,
        });

        const imageryProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(
          '/cesium/Assets/Textures/NaturalEarthII',
        );
        viewer.imageryLayers.addImageryProvider(imageryProvider);

        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#dce9ef');
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-15, 20, 22000000),
        });
      } catch (err) {
        console.error('Cesium preview failed to initialize:', err);
        setError('CesiumJS preview could not load. Check the browser console for details.');
      }
    }

    setup();
    return () => {
      cancelled = true;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return (
    <div className="cesium-card prototype-card">
      <div className="cesium-heading">
        <div>
          <strong>Interactive World Map</strong>
          <p>Use the globe to explore the map experience for the game.</p>
        </div>
        <span className="chip">CesiumJS</span>
      </div>
      <div ref={containerRef} className="cesium-container" />
      {error && <p className="form-message cesium-error">{error}</p>}
    </div>
  );
}
