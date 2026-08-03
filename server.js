const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// राउट्स फाइल्स इम्पोर्ट करणे
const companyRoutes = require('./routes/companyRoutes');
const accountRoutes = require('./routes/accountRoutes');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');
const quotationRoutes = require('./routes/quotationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// १. आवश्यक मिडलवेअर्स (Global Middlewares)
app.use(cors());
app.use(express.json()); // JSON पेलोड वाचण्यासाठी
app.use(express.urlencoded({ extended: true })); // फॉर्म डेटा (URL-encoded) वाचण्यासाठी

// २. अपलोड्स फोल्डर ऑटो-क्रिएशन (Multer साठी सेफ्टी चेक)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log("📁 'uploads' फोल्डर यशस्वीरित्या तयार केले गेले आहे.");
}

// ३. स्टॅटिक फाइल्स सर्व्ह करणे (प्रतिमा आणि डॉक्युमेंट्स फ्रंटएंडला दिसण्यासाठी)
app.use('/uploads', express.static(uploadsDir));

// ४. मुख्य एपीआय राउट्स मॅपिंग (API Endpoints Mapping)
app.use('/api/company', companyRoutes);     // कंपनी प्रोफाइलसाठी
app.use('/api/account', accountRoutes);     // अकाउंट/पार्टी मास्टरसाठी
app.use('/api/item', itemRoutes);           // इन्व्हेंटरी आयटम्ससाठी
app.use('/api/user', userRoutes);           // युझर मॅनेजमेंटसाठी
app.use('/api/quotation', quotationRoutes); // सेल्स कोटेशनसाठी

// ५. ग्लोबल एरर हँडलर मिडलवेअर (सिस्टम क्रॅश टाळण्यासाठी)
app.use((err, req, res, next) => {
    console.error("❌ सर्व्हर एरर पाइपलाइन:", err.stack);
    res.status(500).json({ 
        status: 'Error', 
        message: 'सर्व्हरवर काहीतरी तांत्रिक बिघाड झाला आहे!', 
        error: err.message 
    });
});

// ६. एक्सप्रेस सर्व्ह बूट प्रोसेस
app.listen(PORT, () => {
    console.log(`🚀 बॅकएंड सर्व्हर पोर्ट ${PORT} वर यशस्वीरित्या चालू झाला आहे...`);
});