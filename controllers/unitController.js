const db = require('../db');

// 1. Get all units (GET /api/unit)
exports.getAllUnits = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT unit_name FROM units ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};

// 2. Save new unit in the database (POST /api/unit)
exports.createUnit = async (req, res) => {
    try {
        const { unitName } = req.body;

        if (!unitName || unitName.trim() === '') {
            return res.status(400).json({ status: 'Error', message: 'Unit Name is required.' });
        }

        const trimmedUnit = unitName.trim();

        // Check for duplicate unit
        const [existing] = await db.query('SELECT * FROM units WHERE LOWER(unit_name) = LOWER(?)', [trimmedUnit]);
        if (existing.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'This Unit already exists.' });
        }

        const [result] = await db.query('INSERT INTO units (unit_name) VALUES (?)', [trimmedUnit]);
        res.status(201).json({ 
            status: 'Success', 
            message: 'New Unit added successfully to the database!', 
            unitName: trimmedUnit, 
            insertId: result.insertId 
        });

    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};