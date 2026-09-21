const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const companyRoutes = require('./routes/companyRoutes');
const accountRoutes = require('./routes/accountRoutes');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const unitRoutes = require('./routes/unitRoutes');
const taxRoutes = require('./routes/taxRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir);
        console.log("📁 'uploads' फोल्डर यशस्वीरित्या तयार केले गेले आहे.");
    } catch (e) {
    }
}

app.use('/uploads', express.static(uploadsDir));

app.use('/api/company', companyRoutes);     
app.use('/api/account', accountRoutes);    
app.use('/api/item', itemRoutes);           
app.use('/api/user', userRoutes);          
app.use('/api/quotation', quotationRoutes);      
app.use('/api/unit', unitRoutes);
app.use('/api/tax', taxRoutes);

app.use((err, req, res, next) => {

    console.error("❌ Server Error Pipeline:", err.stack);

    res.status(500).json({
        status: 'Error',
        message: 'Something went wrong on the server!',
        error: err.message
    });

});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Backend server is running successfully on port ${PORT}...`);
    });
}

module.exports = app;