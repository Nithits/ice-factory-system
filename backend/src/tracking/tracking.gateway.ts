import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id}`);
  }

  emitVehicleLocation(data: unknown) {
    this.server.emit('vehicle-location', data);
  }

  emitTripUpdated(data: unknown) {
    this.server.emit('trip-updated', data);
  }

  emitDeliveryCreated(data: unknown) {
    this.server.emit('delivery-created', data);
  }

  emitShiftUpdated(data: unknown) {
    this.server.emit('shift-updated', data);
  }

  emitProblemReported(data: unknown) {
    this.server.emit('problem-reported', data);
  }

  emitCustomerAdded(data: unknown) {
    this.server.emit('customer-added', data);
  }

  emitTankUpdated(data: unknown) {
    this.server.emit('tank-updated', data);
  }
}
