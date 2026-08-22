import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';

import { trackingApi } from '../api/endpoints';

interface UseTripTrackingOptions {
  enabled: boolean;
  vehicleId: number;
  tripId: number;
}

/**
 * Streams the driver's foreground location to the backend every ~10s /
 * 30m of movement while a trip is IN_PROGRESS, so the web dashboard can
 * show the truck moving in real time.
 */
export function useTripTracking({
  enabled,
  vehicleId,
  tripId,
}: UseTripTrackingOptions) {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted' || cancelled) {
        return;
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 30,
        },
        (position) => {
          trackingApi
            .sendLocation({
              vehicleId,
              tripId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              speed: position.coords.speed ?? undefined,
              accuracy: position.coords.accuracy ?? undefined,
              heading: position.coords.heading ?? undefined,
            })
            .catch(() => {
              // ไม่ต้องหยุดการติดตามหากส่งพิกัดล้มเหลวชั่วคราว
            });
        },
      );
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled, vehicleId, tripId]);
}
