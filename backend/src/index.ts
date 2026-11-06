import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import feeRuleRoutes from './routes/feeRuleRoutes';
import profitabilityRoutes from './routes/profitabilityRoutes';
import orderRoutes from './routes/orderRoutes';
import settlementRoutes from './routes/settlementRoutes';
import reconciliationRoutes from './routes/reconciliationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import reportsRoutes from './routes/reportsRoutes';
import alertsRoutes from './routes/alertsRoutes';
import userRoutes from './routes/userRoutes';
import commentsRoutes from './routes/commentsRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import auditLogsRoutes from './routes/auditLogsRoutes';
import savedProductRoutes from './routes/savedProductRoutes';
import watchlistRoutes from './routes/watchlistRoutes';
import externalRoutes from './routes/externalRoutes';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/fee-rules', feeRuleRoutes);
app.use('/api/profitability', profitabilityRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/saved-products', savedProductRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api', externalRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MarginIQ API is running', timestamp: new Date().toISOString() });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// Global production-safe error handler (no stack traces leaked)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && statusCode === 500
    ? 'Internal server error'
    : (err.message || 'Server error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

import { ReportScheduleService } from './services/reports/ReportScheduleService';

// Start Server
const server = app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development';
  console.log(`=================================================`);
  console.log(`MarginIQ API`);
  console.log(`Environment: ${env}`);
  console.log(`Port: ${PORT}`);
  console.log(`MongoDB: Connected`);
  console.log(`API: Ready (http://localhost:${PORT})`);
  console.log(`=================================================`);
  // Periodic background execution of due scheduled reports
  const reportInterval = setInterval(() => {
    ReportScheduleService.processDueSchedules().catch((err: any) => {
      console.error('Scheduled report runner error:', err.message);
    });
  }, 60000);

  // Graceful shutdown
  const gracefulShutdown = () => {
    clearInterval(reportInterval);
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});

server.on('error', (err: any) => {
  console.error('Server listen error:', err);
});
