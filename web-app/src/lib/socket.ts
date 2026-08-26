import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

/**
 * Single shared socket.io connection to the backend's TrackingGateway,
 * emitting 'vehicle-location', 'trip-updated' and 'delivery-created'
 * events used to keep the dashboard live without heavy polling.
 */
export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }

  return socket;
}
