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

const app = express();

// Initialize Database Connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Gauseva HealthTech API is running',
    timestamp: new Date().toISOString()
  });
});

export default app;


