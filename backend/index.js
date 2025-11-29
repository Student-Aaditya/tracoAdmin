const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
dotenv.config();

const app = express();

// ✅ CORS Setup for Frontend (5173)
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ✅ Fallback (For Preflight Requests)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT,PATCH, DELETE, OPTIONS");
    next();
});

app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
app.use("/auth", authRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use("/admin", adminRoutes);

const vendorRoutes = require('./routes/vendorRoutes');
app.use("/vendor", vendorRoutes);

const medicineRoutes = require('./routes/medicineRoutes');
app.use("/medicine", medicineRoutes);
// Default Route
app.get("/", (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});