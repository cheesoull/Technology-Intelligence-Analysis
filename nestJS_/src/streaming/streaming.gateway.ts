import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class StreamingGateway {
  @WebSocketServer() server!: Server;

  broadcastChunk(chunk: string) {
    this.server.emit('stream_chunk', chunk);
  }

  broadcastEnd() {
    this.server.emit('stream_complete');
  }
}
