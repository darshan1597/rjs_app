import express from 'express';
import mongoose from 'mongoose';

const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'rjs-backend',
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});

export { healthRouter };
