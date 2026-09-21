const { supabase, ...db } = require('../db');

// Helper to upload file to Supabase storage bucket 'images'
async function uploadToSupabase(file, folder = 'company') {
    if (!file) return null;
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });
    if (error) throw new Error(error.message);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
        
    return publicUrlData.publicUrl;
}

// 1. Get list of all companies (GET)
exports.getAllCompanies = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM company_profiles ORDER BY id DESC');
        res.status(200).json(result.rows);
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

        if (!req.files || !req.files.logoFile || !req.files.qrFile || !req.files.stampFile || !req.files.signFile) {
            return res.status(400).json({ message: "All 4 files (Logo, QR, Stamp, Signature) are mandatory to upload." });
        }

        const logoFile = await uploadToSupabase(req.files.logoFile[0]);
        const qrFile = await uploadToSupabase(req.files.qrFile[0]);
        const stampFile = await uploadToSupabase(req.files.stampFile[0]);
        const signFile = await uploadToSupabase(req.files.signFile[0]);

        const sql = `INSERT INTO company_profiles 
        (company_name, print_name, gst_number, gst_status, pan_number, cin_number, tan_number, udyam_number, fy_beginning, company_email, company_mobile, company_website, ac_no, ifsc_code, bank_name, registered_address, logo_file, qr_file, stamp_file, signature_file) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`;

        const values = [
            compName, printName, gstNumber, gstStatus, panNumber,
            cinNumber || null, tanNumber || null, udyamNumber || null, fyBeginning,
            compEmail, compMobile, compWebsite || null, 
            acNo || null, ifscCode || null, bankName || null, 
            regAddress, logoFile, qrFile, stampFile, signFile
        ];

        const result = await db.query(sql, values);
        res.status(201).json({ message: "Company profile saved successfully!", insertId: result.rows[0].id });

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

        const existing = await db.query('SELECT * FROM company_profiles WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: "Company profile not found." });
        }

        const logoFile = req.files && req.files.logoFile ? await uploadToSupabase(req.files.logoFile[0]) : existing.rows[0].logo_file;
        const qrFile = req.files && req.files.qrFile ? await uploadToSupabase(req.files.qrFile[0]) : existing.rows[0].qr_file;
        const stampFile = req.files && req.files.stampFile ? await uploadToSupabase(req.files.stampFile[0]) : existing.rows[0].stamp_file;
        const signFile = req.files && req.files.signFile ? await uploadToSupabase(req.files.signFile[0]) : existing.rows[0].signature_file;

        const sql = `UPDATE company_profiles SET 
        company_name=$1, print_name=$2, gst_number=$3, gst_status=$4, pan_number=$5, 
        cin_number=$6, tan_number=$7, udyam_number=$8, fy_beginning=$9, company_email=$10, 
        company_mobile=$11, company_website=$12, ac_no=$13, ifsc_code=$14, bank_name=$15, registered_address=$16, 
        logo_file=$17, qr_file=$18, stamp_file=$19, signature_file=$20 WHERE id=$21`;

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
        const result = await db.query('DELETE FROM company_profiles WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Data not found." });
        }
        res.status(200).json({ message: "Company profile deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};