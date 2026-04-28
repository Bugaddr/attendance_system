export const getAccuratePosition = (timeoutMs = 10000, desiredAccuracy = 15) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by this browser.'));
    }

    let watchId;
    let timeoutId;
    let bestPos = null;

    const cleanup = () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Fallback timeout in case we never reach the desired accuracy
    timeoutId = setTimeout(() => {
      cleanup();
      if (bestPos) {
        resolve(bestPos);
      } else {
        reject(new Error('Failed to get location within the timeout period.'));
      }
    }, timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // Keep track of the most accurate position received
        if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
          bestPos = pos;
        }

        // If we reach our desired accuracy, return immediately
        if (bestPos.coords.accuracy <= desiredAccuracy) {
          cleanup();
          resolve(bestPos);
        }
      },
      (err) => {
        // If we encounter an error but already have a position, just return what we have
        if (bestPos) {
          cleanup();
          resolve(bestPos);
        } else {
          // Ignore transient errors if we still have time left
          if (err.code !== err.TIMEOUT && !bestPos) {
             cleanup();
             reject(err);
          }
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  });
};
