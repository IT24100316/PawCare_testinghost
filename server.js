const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const vetBookingRoutes = require('./routes/vetBookingRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const groomingRoutes = require('./routes/groomingRoutes');
const boardingRoutes = require('./routes/boardingRoutes');
const userBookingRoutes = require('./routes/userBookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Cron Jobs
const { initCronJobs } = require('./utils/cronJobs');
initCronJobs();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/bookings/vet', vetBookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/bookings/grooming', groomingRoutes);
app.use('/api/bookings/boarding', boardingRoutes);
app.use('/api/bookings', userBookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload/image', uploadRoutes);

const PORT = process.env.PORT || 5000;

// The "0.0.0.0" is the critical part for Render!
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});