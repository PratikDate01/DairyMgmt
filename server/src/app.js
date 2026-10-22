import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import dairyFarmerRoutes from './routes/dairyFarmerRoutes.js';
import milkCollectionRoutes from './routes/milkCollectionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import medicineRequestRoutes from './routes/medicineRequestRoutes.js';
import diseaseScanRoutes from './routes/diseaseScanRoutes.js';
import veterinarianRoutes from './routes/veterinarianRoutes.js';
import cattleRoutes from './routes/cattleRoutes.js';
import vetRequestRoutes from './routes/vetRequestRoutes.js';
import fodderListingRoutes from './routes/fodderListingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';

const app = express();

// Initialize Database Connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dairy-connections', dairyFarmerRoutes);
app.use('/api/milk-collections', milkCollectionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medicine-requests', medicineRequestRoutes);
app.use('/api/disease-scans', diseaseScanRoutes);
app.use('/api/veterinarian', veterinarianRoutes);
app.use('/api/cattle', cattleRoutes);
app.use('/api/vet-requests', vetRequestRoutes);
app.use('/api/fodder-listings', fodderListingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Gauseva HealthTech API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (catches entity.too.large and JSON parse errors)
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Uploaded file or payload is too large. Please upload an image under 50MB.'
    });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received.'
    });
  }
  console.error('Unhandled server error:', err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

export default app;


