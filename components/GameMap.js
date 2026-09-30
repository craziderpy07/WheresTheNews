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
        // Vercel serves the app from the site root, so Cesium's static assets
        // are available at /cesium/* (copied there by scripts/copy-cesium.mjs).
        window.CESIUM_BASE_URL = '/cesium/';

        const Cesium = await import('cesium');
        if (cancelled || !containerRef.current) return;

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
          selectionIndicator: false,
          baseLayerPicker: false,
        });

        viewerRef.current = viewer;

        // Use Cesium's bundled Natural Earth imagery so the globe renders
        // without a Cesium ion token or any third-party map key.
        const imageryProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(
          '/cesium/Assets/Textures/NaturalEarthII',
        );
        viewer.imageryLayers.addImageryProvider(imageryProvider);

        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#dce9ef');

        // Start with a full-globe view.
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-15, 20, 22000000),
        });

        handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement) => {
          const cartesian = viewer.camera.pickEllipsoid(
            movement.position,
            viewer.scene.globe.ellipsoid,
          );
          if (!cartesian) return;

          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          const lng = Cesium.Math.toDegrees(cartographic.longitude);
          onGuess?.({ lat, lng });

          if (pinRef.current) viewer.entities.remove(pinRef.current);
          pinRef.current = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            point: {
              pixelSize: 16,
              color: Cesium.Color.fromCssColorString('#F59E0B'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 3,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            label: {
              text: 'Your Guess',
              font: '600 13px sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.fromCssColorString('#7C2D12'),
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, 24),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      } catch (err) {
        console.error('Cesium map failed to initialize:', err);
        setError(
          'The globe could not load. Check that /cesium/Assets, /cesium/Workers, /cesium/Widgets, and /cesium/ThirdParty are available in this deployment.',
        );
      }
    }

    setup();

    return () => {
      cancelled = true;
      handler?.destroy();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
      pinRef.current = null;
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
