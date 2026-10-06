'use client';

import { useEffect, useRef, useState } from 'react';
import { loadCesium } from '../lib/cesium';

export function loadGameGlobe() {
  window.CESIUM_BASE_URL = process.env.NEXT_PUBLIC_CESIUM_BASE_URL;
  return loadCesium();
}

export default function GameMap({ guess, answer, locked, roundKey, onGuess }) {
  const containerRef = useRef(null);
  const runtimeRef = useRef(null);
  const interactionRef = useRef({ locked, onGuess });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    interactionRef.current = { locked, onGuess };
  }, [locked, onGuess]);

  // sets up the globe once and cleans it up when the map closes
  // https://react.dev/reference/react/useEffect
  useEffect(() => {
    let cancelled = false;
    let viewer;
    let handler;
    let removeImageryError;

    async function setup() {
      try {
        const Cesium = await loadGameGlobe();
        if (cancelled) return;

        // makes the globe and turns off the extra buttons
        // https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html
        viewer = new Cesium.Viewer(containerRef.current, { baseLayer: false, baseLayerPicker: false, terrainProvider: new Cesium.EllipsoidTerrainProvider(), animation: false, timeline: false, geocoder: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false, infoBox: false, selectionIndicator: false });

        const imagery = new Cesium.UrlTemplateImageryProvider({ url: `${process.env.NEXT_PUBLIC_CESIUM_BASE_URL}Assets/Textures/NaturalEarthII/{z}/{x}/{reverseY}.jpg`, tilingScheme: new Cesium.GeographicTilingScheme(), maximumLevel: 2, hasAlphaChannel: false });
        viewer.imageryLayers.addImageryProvider(imagery);
        // gets map tiles from openstreetmap so zooming in loads more detail and place names
        // https://cesium.com/learn/cesiumjs/ref-doc/OpenStreetMapImageryProvider.html
        const detailedImagery = new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/', maximumLevel: 19, credit: new Cesium.Credit('<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">&copy; OpenStreetMap contributors</a>', true) });
        removeImageryError = detailedImagery.errorEvent.addEventListener(() => {
          if (cancelled) return;
          setError('Detailed map tiles could not load. Check your internet connection and refresh the page.');
        });
        viewer.imageryLayers.addImageryProvider(detailedImagery);
        viewer.useBrowserRecommendedResolution = false;
        viewer.scene.globe.enableLighting = false;

        // sets which mouse movements rotate the globe and which ones zoom
        // https://cesium.com/learn/cesiumjs/ref-doc/ScreenSpaceCameraController.html
        const controls = viewer.scene.screenSpaceCameraController;
        controls.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG, Cesium.CameraEventType.RIGHT_DRAG];
        controls.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
        controls.enableTilt = false;
        controls.enableLook = false;
        controls.minimumZoomDistance = 1000;
        controls.maximumZoomDistance = 40000000;

        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        // listens for a click so we can place the players pin
        // https://cesium.com/learn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
        handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement) => {
          const interaction = interactionRef.current;
          if (interaction.locked) return;

          // finds the spot on the globe under the click
          // https://cesium.com/learn/cesiumjs/ref-doc/Camera.html#pickEllipsoid
          const position = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
          if (!position) return;

          const coordinates = Cesium.Cartographic.fromCartesian(position);
          interaction.onGuess({ latitude: Cesium.Math.toDegrees(coordinates.latitude), longitude: Cesium.Math.toDegrees(coordinates.longitude) });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // makes the orange guess pin and green answer pin
        // https://cesium.com/learn/cesiumjs/ref-doc/PinBuilder.html
        const pinBuilder = new Cesium.PinBuilder();
        runtimeRef.current = { Cesium, viewer, guessImage: pinBuilder.fromColor(Cesium.Color.fromCssColorString('#f59e0b'), 42).toDataURL(), answerImage: pinBuilder.fromColor(Cesium.Color.fromCssColorString('#42d6a4'), 42).toDataURL() };
        setReady(true);
      } catch (loadError) {
        if (cancelled) return;
        console.error('The game globe could not load:', loadError);
        if (removeImageryError) removeImageryError();
        if (handler) handler.destroy();
        handler = null;
        if (viewer && !viewer.isDestroyed()) viewer.destroy();
        setError('The globe could not load.');
      }
    }

    setup();
    return () => {
      cancelled = true;
      runtimeRef.current = null;
      if (removeImageryError) removeImageryError();
      if (handler) handler.destroy();
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const { Cesium, viewer } = runtimeRef.current;
    viewer.camera.cancelFlight();
    viewer.entities.removeAll();
    viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(-15, 20, 22000000), orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 } });
  }, [ready, roundKey]);

  useEffect(() => {
    if (!ready) return;
    const { Cesium, viewer, guessImage, answerImage } = runtimeRef.current;
    viewer.entities.removeAll();

    function addPin(coordinates, label, image, labelOffset) {
      // puts the pin and its label at these coordinates
      // https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html#entities
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude),
        billboard: { image, verticalOrigin: Cesium.VerticalOrigin.BOTTOM },
        label: { text: label, font: '600 13px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 3, style: Cesium.LabelStyle.FILL_AND_OUTLINE, pixelOffset: new Cesium.Cartesian2(0, labelOffset) }
      });
    }

    if (guess) addPin(guess, 'Your guess', guessImage, -54);
    if (answer) {
      addPin(answer, 'Correct location', answerImage, -80);
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(answer.longitude, answer.latitude, 22000000), orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 }, duration: 1 });
    }
  }, [ready, roundKey, guess, answer]);

  return (
    <div className="cesium-card game-map">
      <div className="cesium-heading">
        <div>
          <strong>Explore the globe</strong>
          <p>Drag with either mouse button to rotate. Scroll or pinch to zoom. Click or tap to place your pin.</p>
        </div>
      </div>
      {!ready && !error && <p className="cesium-heading" role="status">Still loading the globe...</p>}
      {error && <p className="form-message cesium-heading" role="alert">{error}</p>}
      <div ref={containerRef} className="cesium-container" />
    </div>
  );
}
