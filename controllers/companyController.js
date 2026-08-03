const db = require('../db');

// १. सर्व कंपन्यांची यादी मिळवणे (GET)
exports.getAllCompanies = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM company_profiles ORDER BY id DESC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// २. नवीन कंपनी प्रोफाइल सेव्ह करणे (POST)
exports.createCompany = async (req, res) => {
    try {
        const {
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber, tanNumber, udyamNumber, fyBeginning,
            compEmail, compMobile, compWebsite, bankAccounts, regAddress
        } = req.body;

        if (!req.files || !req.files.logoFile || !req.files.qrFile || !req.files.stampFile || !req.files.signFile) {
            return res.status(400).json({ message: "सर्व ४ फाईल्स (Logo, QR, Stamp, Signature) अपलोड करणे अनिवार्य आहे." });
        }

        const logoFile = req.files.logoFile[0].filename;
        const qrFile = req.files.qrFile[0].filename;
        const stampFile = req.files.stampFile[0].filename;
        const signFile = req.files.signFile[0].filename;

        const sql = `INSERT INTO company_profiles 
        (company_name, print_name, gst_number, gst_status, pan_number, cin_number, tan_number, udyam_number, fy_beginning, company_email, company_mobile, company_website, bank_accounts, registered_address, logo_file, qr_file, stamp_file, signature_file) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber || null, tanNumber || null, udyamNumber || null, fyBeginning,
            compEmail, compMobile, compWebsite || null, bankAccounts || null, regAddress,
            logoFile, qrFile, stampFile, signFile
        ];

        const [result] = await db.query(sql, values);
        res.status(201).json({ message: "कंपनी प्रोफाइल यशस्वीरित्या साठवली!", insertId: result.insertId });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ३. कंपनी प्रोफाइल अपडेट करणे (PUT)
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber, tanNumber, udyamNumber, fyBeginning,
            compEmail, compMobile, compWebsite, bankAccounts, regAddress
        } = req.body;

        const [existing] = await db.query('SELECT * FROM company_profiles WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "कंपनी प्रोफाइल सापडली नाही." });
        }

        const logoFile = req.files && req.files.logoFile ? req.files.logoFile[0].filename : existing[0].logo_file;
        const qrFile = req.files && req.files.qrFile ? req.files.qrFile[0].filename : existing[0].qr_file;
        const stampFile = req.files && req.files.stampFile ? req.files.stampFile[0].filename : existing[0].stamp_file;
        const signFile = req.files && req.files.signFile ? req.files.signFile[0].filename : existing[0].signature_file;

        const sql = `UPDATE company_profiles SET 
        company_name=?, print_name=?, gst_number=?, gst_status=?, pan_number=?, 
        cin_number=?, tan_number=?, udyam_number=?, fy_beginning=?, company_email=?, 
        company_mobile=?, company_website=?, bank_accounts=?, registered_address=?, 
        logo_file=?, qr_file=?, stamp_file=?, signature_file=? WHERE id=?`;

        const values = [
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber || null, tanNumber || null, udyamNumber || null, fyBeginning,
            compEmail, compMobile, compWebsite || null, bankAccounts || null, regAddress,
            logoFile, qrFile, stampFile, signFile, id
        ];

        await db.query(sql, values);
        res.status(200).json({ message: "कंपनी प्रोफाइल अपडेट झाली!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ४. कंपनी प्रोफाइल डिलीट करणे (DELETE)
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM company_profiles WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "डेटा सापडला नाही." });
        }
        res.status(200).json({ message: "कंपनी प्रोफाइल डिलीट करण्यात आली आहे." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};