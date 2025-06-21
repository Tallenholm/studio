
'use client';

import { getDistance } from 'geolib';

// Configurable "home base" coordinates and radius
// In a real app, these would come from a settings page/database.
const GEOFENCE_CENTER = { latitude: 41.7356, longitude: -111.8347 }; // Logan, UT
const GEOFENCE_RADIUS_METERS = 200; // 200 meters

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDistance(userCoords: Coordinates): number {
  return getDistance(userCoords, GEOFENCE_CENTER);
}

export function isWithinGeofence(distance: number): boolean {
  return distance <= GEOFENCE_RADIUS_METERS;
}

export function getGeofenceRadius() {
    return GEOFENCE_RADIUS_METERS;
}
