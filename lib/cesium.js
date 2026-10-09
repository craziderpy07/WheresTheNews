let cesiumPromise;

export function loadCesium() {
  if (cesiumPromise) return cesiumPromise;
  cesiumPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${process.env.NEXT_PUBLIC_CESIUM_BASE_URL}Cesium.js`;
    script.async = true;

    function fail(message) {
      cesiumPromise = null;
      script.remove();
      reject(new Error(message));
    }

    script.onload = () => {
      if (window.Cesium) resolve(window.Cesium);
      else fail('the globe code couldnt start try refreshing the page');
    };
    script.onerror = () => fail('couldnt download the globe code try refreshing the page');
    document.head.appendChild(script);
  });
  return cesiumPromise;
}
