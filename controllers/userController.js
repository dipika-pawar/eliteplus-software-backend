const db = require('../db');

// १. सर्व युझर्सची यादी मिळवणे (GET)
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users ORDER BY id DESC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// २. नवीन युझर तयार करणे (POST)
exports.createUser = async (req, res) => {
    try {
        const { fName, uName, role, email, phone } = req.body;

        // बेसिक व्हॅलिडेशन
        if (!fName || !uName || !email) {
            return res.status(400).json({ status: 'Error', message: 'Full Name, Username आणि Email भरणे अनिवार्य आहे.' });
        }

        const sql = `INSERT INTO users (full_name, username, role, email, phone) VALUES (?, ?, ?, ?, ?)`;
        const values = [fName, uName, role || 'User', email, phone || ''];

        await db.query(sql, values);
        res.status(201).json({ status: 'Success', message: 'नवीन युझर यशस्वीरित्या साठवला गेला!' });

    } catch (error) {
        // डुप्लिकेट युझरनेम किंवा ईमेल चेक करणे
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'Error', message: 'हा Username किंवा Email आधीपासूनच वापरला गेला आहे.' });
        }
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// ३. युझरचा डेटा अपडेट करणे (PUT)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fName, uName, role, email, phone } = req.body;

        // युझर डेटाबेसमध्ये अस्तित्त्वात आहे का ते तपासा
        const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'युझर सापडला नाही.' });
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
        res.status(200).json({ status: 'Success', message: 'युझरचा तपशील यशस्वीरित्या अपडेट झाला!' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'Error', message: 'हा Username किंवा Email आधीपासूनच वापरला गेला आहे.' });
        }
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// ४. युझर डिलीट करणे (DELETE)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'Error', message: 'युझर सापडला नाही.' });
        }
        res.status(200).json({ status: 'Success', message: 'युझर यशस्वीरित्या डिलीट केला!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};