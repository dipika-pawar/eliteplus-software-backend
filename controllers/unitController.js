const db = require('../db');

// १. सर्व युनिट्स मिळवणे (GET /api/unit)
exports.getAllUnits = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT unit_name FROM units ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};

// २. नवीन युनिट डेटाबेसमध्ये सेव्ह करणे (POST /api/unit)
exports.createUnit = async (req, res) => {
    try {
        const { unitName } = req.body;

        if (!unitName || unitName.trim() === '') {
            return res.status(400).json({ status: 'Error', message: 'Unit Name is required.' });
        }

        const trimmedUnit = unitName.trim();

        // ड्युप्लिकेट युनिट तपासणे
        const [existing] = await db.query('SELECT * FROM units WHERE LOWER(unit_name) = LOWER(?)', [trimmedUnit]);
        if (existing.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'हा Unit आधीपासूनच उपलब्ध आहे.' });
        }

        const [result] = await db.query('INSERT INTO units (unit_name) VALUES (?)', [trimmedUnit]);
        res.status(201).json({ 
            status: 'Success', 
            message: 'नवीन Unit यशस्वीरित्या डेटाबेसमध्ये जोडला गेला!', 
            unitName: trimmedUnit, 
            insertId: result.insertId 
        });

    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};