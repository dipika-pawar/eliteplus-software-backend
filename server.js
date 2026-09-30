const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes register kara
app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/taxes', require('./routes/taxRoutes'));
app.use('/api/units', require('./routes/unitRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.get('/', (req, res) => {
    res.json({ message: "ElitePlus Backend is running successfully!" });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}