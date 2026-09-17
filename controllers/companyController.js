const db = require('../db');

// 1. Get list of all companies (GET)
exports.getAllCompanies = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM company_profiles ORDER BY id DESC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Save new company profile (POST)
exports.createCompany = async (req, res) => {
    try {
        const {
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber, tanNumber, udyamNumber, fyBeginning,
            compEmail, compMobile, compWebsite, 
            acNo, ifscCode, bankName, regAddress
        } = req.body;

        // Check if files exist from middleware (req.supabaseFiles)
        if (!req.supabaseFiles || !req.supabaseFiles.logoFile || !req.supabaseFiles.qrFile || !req.supabaseFiles.stampFile || !req.supabaseFiles.signFile) {
            return res.status(400).json({ message: "All 4 files (Logo, QR, Stamp, Signature) are mandatory to upload." });
        }

        const logoFile = req.supabaseFiles.logoFile;
        const qrFile = req.supabaseFiles.qrFile;
        const stampFile = req.supabaseFiles.stampFile;
        const signFile = req.supabaseFiles.signFile;

        const sql = `INSERT INTO company_profiles 
        (company_name, print_name, gst_number, gst_status, pan_number, cin_number, tan_number, udyam_number, fy_beginning, company_email, company_mobile, company_website, ac_no, ifsc_code, bank_name, registered_address, logo_file, qr_file, stamp_file, signature_file) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber || null, tanNumber || null, udyamNumber || null, fyBeginning,
            compEmail, compMobile, compWebsite || null, 
            acNo || null, ifscCode || null, bankName || null, 
            regAddress, logoFile, qrFile, stampFile, signFile
        ];

        const [result] = await db.query(sql, values);
        res.status(201).json({ message: "Company profile saved successfully!", insertId: result.insertId });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Update company profile (PUT)
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber, tanNumber, udyamNumber, fyBeginning,
            compEmail, compMobile, compWebsite, 
            acNo, ifscCode, bankName, regAddress
        } = req.body;

        const [existing] = await db.query('SELECT * FROM company_profiles WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Company profile not found." });
        }

        // Get new uploaded file names from Supabase middleware, or keep existing database file names if not uploaded
        const logoFile = req.supabaseFiles && req.supabaseFiles.logoFile ? req.supabaseFiles.logoFile : existing[0].logo_file;
        const qrFile = req.supabaseFiles && req.supabaseFiles.qrFile ? req.supabaseFiles.qrFile : existing[0].qr_file;
        const stampFile = req.supabaseFiles && req.supabaseFiles.stampFile ? req.supabaseFiles.stampFile : existing[0].stamp_file;
        const signFile = req.supabaseFiles && req.supabaseFiles.signFile ? req.supabaseFiles.signFile : existing[0].signature_file;

        const sql = `UPDATE company_profiles SET 
        company_name=?, print_name=?, gst_number=?, gst_status=?, pan_number=?, 
        cin_number=?, tan_number=?, udyam_number=?, fy_beginning=?, company_email=?, 
        company_mobile=?, company_website=?, ac_no=?, ifsc_code=?, bank_name=?, registered_address=?, 
        logo_file=?, qr_file=?, stamp_file=?, signature_file=? WHERE id=?`;

        const values = [
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber || null, tanNumber || null, udyamNumber || null, fyBeginning,
            compEmail, compMobile, compWebsite || null, 
            acNo || null, ifscCode || null, bankName || null, 
            regAddress, logoFile, qrFile, stampFile, signFile, id
        ];

        await db.query(sql, values);
        res.status(200).json({ message: "Company profile updated successfully!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Delete company profile (DELETE)
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM company_profiles WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data not found." });
        }
        res.status(200).json({ message: "Company profile deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};