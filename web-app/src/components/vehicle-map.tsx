'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import type { VehicleWithLocation } from '@/types';

const truckIcon = L.divIcon({
  html: '🚚',
  className: 'text-2xl leading-none',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018];

export default function VehicleMap({
  vehicles,
}: {
  vehicles: VehicleWithLocation[];
}) {
  const withLocation = vehicles.filter((v) => v.location);
  const center: [number, number] = withLocation[0]?.location
    ? [withLocation[0].location.latitude, withLocation[0].location.longitude]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {withLocation.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[
            vehicle.location!.latitude,
            vehicle.location!.longitude,
          ]}
          icon={truckIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">
                {vehicle.name} ({vehicle.plate})
              </p>
              <p className="text-neutral-500">
                อัปเดตล่าสุด:{' '}
                {new Date(vehicle.location!.recordedAt).toLocaleTimeString(
                  'th-TH',
                )}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
