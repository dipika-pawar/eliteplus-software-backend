const db = require('../db'); // He supabaseClient (db.js) export karel

// 1. Get all users (GET)
exports.getAllUsers = async (req, res) => {
    try {
        const { data, error } = await db
            .from('users')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 2. Create new user (POST)
exports.createUser = async (req, res) => {
    try {
        const { fName, uName, role, email, phone } = req.body;

        // Basic validation
        if (!fName || !uName || !email) {
            return res.status(400).json({ status: 'Error', message: 'Full Name, Username, and Email are mandatory.' });
        }

        const { error: insertError } = await db
            .from('users')
            .insert([{
                full_name: fName,
                username: uName,
                role: role || 'User',
                email: email,
                phone: phone || ''
            }]);

        if (insertError) {
            // Check for duplicate username or email in PostgreSQL/Supabase (error code '23505')
            if (insertError.code === '23505') {
                return res.status(400).json({ status: 'Error', message: 'This Username or Email is already in use.' });
            }
            throw insertError;
        }

        res.status(201).json({ status: 'Success', message: 'New user saved successfully!' });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 3. Update user data (PUT)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fName, uName, role, email, phone } = req.body;

        // Check if user exists in the database
        const { data: existing, error: fetchError } = await db
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ status: 'Error', message: 'User not found.' });
        }

        const { error: updateError } = await db
            .from('users')
            .update({
                full_name: fName || existing.full_name,
                username: uName || existing.username,
                role: role || existing.role,
                email: email || existing.email,
                phone: phone || existing.phone
            })
            .eq('id', id);

        if (updateError) {
            if (updateError.code === '23505') {
                return res.status(400).json({ status: 'Error', message: 'This Username or Email is already in use.' });
            }
            throw updateError;
        }

        res.status(200).json({ status: 'Success', message: 'User details updated successfully!' });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 4. Delete user (DELETE)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: record, error: fetchError } = await db
            .from('users')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return res.status(404).json({ status: 'Error', message: 'User not found.' });
        }

        const { error: dbError } = await db
            .from('users')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        res.status(200).json({ status: 'Success', message: 'User deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};