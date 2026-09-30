const db = require('../db'); // He supabaseClient (db.js) export karel

// GET all tax categories
exports.getAllTaxes = async (req, res) => {
    try {
        const { data, error } = await db
            .from('taxes')
            .select('tax_name')
            .order('id', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
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

        // Case-insensitive check using Supabase ilike filter
        const { data: existing, error: fetchError } = await db
            .from('taxes')
            .select('*')
            .ilike('tax_name', trimmedTax);

        if (fetchError) throw fetchError;

        if (existing && existing.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'Tax category already exists.' });
        }

        const { data: result, error: insertError } = await db
            .from('taxes')
            .insert([{ tax_name: trimmedTax }])
            .select();

        if (insertError) throw insertError;

        res.status(201).json({ 
            status: 'Success', 
            message: 'Tax Category added successfully!', 
            taxName: trimmedTax, 
            insertId: result && result[0] ? result[0].id : null 
        });

    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};