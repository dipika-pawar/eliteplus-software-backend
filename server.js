const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import route files
const companyRoutes = require('./routes/companyRoutes');
const accountRoutes = require('./routes/accountRoutes');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const unitRoutes = require('./routes/unitRoutes');
const taxRoutes = require('./routes/taxRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Required Middlewares (Global Middlewares)
app.use(cors());
app.use(express.json()); // To read JSON payloads
app.use(express.urlencoded({ extended: true })); // To read form data (URL-encoded)

// 2. Automatically Create Uploads Folder (Safety Check for Multer)
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log("📁 'uploads' folder has been created successfully.");
}

// 3. Serve Static Files
// Used to make images and documents accessible to the frontend
app.use('/uploads', express.static(uploadsDir));

// 4. Main API Routes Mapping
app.use('/api/company', companyRoutes);       // Company profile
app.use('/api/account', accountRoutes);       // Account / Party Master
app.use('/api/item', itemRoutes);             // Inventory items
app.use('/api/user', userRoutes);             // User management
app.use('/api/quotation', quotationRoutes);   // Quotation / Invoice
app.use('/api/unit', unitRoutes);             // Unit management
app.use('/api/tax', taxRoutes);               // Tax management

// 5. Global Error Handler Middleware
// Prevents the system from crashing due to unhandled errors
app.use((err, req, res, next) => {

    console.error("❌ Server Error Pipeline:", err.stack);

    res.status(500).json({
        status: 'Error',
        message: 'Something went wrong on the server!',
        error: err.message
    });
});

// 6. Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 Backend server is running successfully on port ${PORT}...`);
});