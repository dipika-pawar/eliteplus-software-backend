const db = require('../db');

// GET all tax categories
exports.getAllTaxes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT tax_name FROM taxes ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};

// POST new tax category
exports.createTax = async (req, res) => {
    try {
        const { taxName } = req.body;

        if (!taxName || taxName.trim() === '') {
            return res.status(400).json({ status: 'Error', message: 'Tax category name is required.' });
        }

        const trimmedTax = taxName.trim();

        const [existing] = await db.query('SELECT * FROM taxes WHERE LOWER(tax_name) = LOWER(?)', [trimmedTax]);
        if (existing.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'Tax category already exists.' });
        }

        const [result] = await db.query('INSERT INTO taxes (tax_name) VALUES (?)', [trimmedTax]);
        res.status(201).json({ 
            status: 'Success', 
            message: 'Tax Category added successfully!', 
            taxName: trimmedTax, 
            insertId: result.insertId 
        });

    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};