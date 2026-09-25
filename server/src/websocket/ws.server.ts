import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { verifyAccessToken } from '../utils/jwt';
import { userRepository } from '../repositories/user.repository';
import { wsManager, AuthenticatedWebSocket } from './ws.manager';
import { AuthenticatedUser } from '../types';

export const setupWebSocketServer = (httpServer: HttpServer): WebSocketServer => {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', async (request, socket, head) => {
    try {
      const parsedUrl = url.parse(request.url || '', true);

      // Only handle requests to /ws
      if (parsedUrl.pathname !== '/ws') {
        socket.destroy();
        return;
      }

      const token = parsedUrl.query.token as string | undefined;

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const user = await userRepository.findById(payload.userId);
      if (!user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      wss.handleUpgrade(request, socket, head, (ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        authWs.user = authenticatedUser;
        authWs.isAlive = true;
        wss.emit('connection', authWs, request);
      });
    } catch (err) {
      console.error('[WS_UPGRADE_ERROR]', err);
      socket.destroy();
    }
  });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    ws.isAlive = true;
    wsManager.registerClient(ws);

    // Send connection acknowledgement with user profile
    ws.send(
      JSON.stringify({
        type: 'CONNECTED',
        data: {
          user: ws.user,
          onlineUsersCount: wsManager.getOnlineUserCount(),
        },
      })
    );

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      wsManager.removeClient(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS_CLIENT_ERROR]', err);
      wsManager.removeClient(ws);
    });
  });

  // Heartbeat interval to prune dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as AuthenticatedWebSocket;
      if (ws.isAlive === false) {
        wsManager.removeClient(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('⚡ WebSocket server attached to HTTP server at /ws');
  return wss;
};
