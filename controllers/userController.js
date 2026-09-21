const db = require('../db');

// 1. Get list of all users (GET)
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users ORDER BY id DESC');
        res.status(200).json(rows);
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

        const sql = `INSERT INTO users (full_name, username, role, email, phone) VALUES (?, ?, ?, ?, ?)`;
        const values = [fName, uName, role || 'User', email, phone || ''];

        await db.query(sql, values);
        res.status(201).json({ status: 'Success', message: 'New user saved successfully!' });

    } catch (error) {
        // Check for duplicate username or email
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'Error', message: 'This Username or Email is already in use.' });
        }
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 3. Update user data (PUT)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fName, uName, role, email, phone } = req.body;

        // Check if user exists in the database
        const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'User not found.' });
        }

        const sql = `UPDATE users SET full_name=?, username=?, role=?, email=?, phone=? WHERE id=?`;
        const values = [
            fName || existing[0].full_name,
            uName || existing[0].username,
            role || existing[0].role,
            email || existing[0].email,
            phone || existing[0].phone,
            id
        ];

        await db.query(sql, values);
        res.status(200).json({ status: 'Success', message: 'User details updated successfully!' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'Error', message: 'This Username or Email is already in use.' });
        }
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 4. Delete user (DELETE)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'Error', message: 'User not found.' });
        }
        res.status(200).json({ status: 'Success', message: 'User deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};