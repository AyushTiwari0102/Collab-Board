import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDB } from './server/config/db.ts';
import authRoutes from './server/routes/authRoutes.ts';
import roomRoutes from './server/routes/roomRoutes.ts';
import aiRoutes from './server/routes/aiRoutes.ts';
import { setupSocket } from './server/socket/socketHandler.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // In production, restrict this to your APP_URL
      methods: ['GET', 'POST']
    }
  });

  const PORT = 3000;

  // Initialize Database
  initDB();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/ai', aiRoutes);

  // Setup Socket.io
  setupSocket(io);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files serving (after build)
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
