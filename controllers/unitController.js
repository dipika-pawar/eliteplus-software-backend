const db = require('../db'); // He supabaseClient (db.js) export karel

// 1. Get all units (GET /api/unit)
exports.getAllUnits = async (req, res) => {
    try {
        const { data, error } = await db
            .from('units')
            .select('unit_name')
            .order('id', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
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

        // Check for duplicate unit using Supabase ilike filter (case-insensitive)
        const { data: existing, error: fetchError } = await db
            .from('units')
            .select('*')
            .ilike('unit_name', trimmedUnit);

        if (fetchError) throw fetchError;

        if (existing && existing.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'This Unit already exists.' });
        }

        const { data: result, error: insertError } = await db
            .from('units')
            .insert([{ unit_name: trimmedUnit }])
            .select();

        if (insertError) throw insertError;

        res.status(201).json({ 
            status: 'Success', 
            message: 'New Unit added successfully to the database!', 
            unitName: trimmedUnit, 
            insertId: result && result[0] ? result[0].id : null 
        });

    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};