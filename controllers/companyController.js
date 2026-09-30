const db = require('../db'); // He aata supabaseClient (db.js) export karel

// Helper function: Supabase storage var files upload karun public URL milvane sathi
async function uploadFileToSupabase(file, bucketName) {
    const fileName = `${Date.now()}_${file.originalname}`;
    const { error: uploadError } = await db.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (uploadError) throw uploadError;

    const { data: urlData } = db.storage
        .from(bucketName)
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

// 1. Get list of all companies (GET)
exports.getAllCompanies = async (req, res) => {
    try {
        const { data, error } = await db
            .from('company_profiles')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
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

        const bucketName = process.env.COMPANY_BUCKET || 'company-images';

        // 4 pan files Supabase storage madhe upload karun public URLs milvane
        const logoUrl = await uploadFileToSupabase(req.files.logoFile[0], bucketName);
        const qrUrl = await uploadFileToSupabase(req.files.qrFile[0], bucketName);
        const stampUrl = await uploadFileToSupabase(req.files.stampFile[0], bucketName);
        const signUrl = await uploadFileToSupabase(req.files.signFile[0], bucketName);

        const { data, error: dbError } = await db
            .from('company_profiles')
            .insert([{
                company_name: compName,
                print_name: printName,
                gst_number: gstNumber,
                gst_status: gstStatus,
                pan_number: panNumber,
                cin_number: cinNumber || null,
                tan_number: tanNumber || null,
                udyam_number: udyamNumber || null,
                fy_beginning: fyBeginning,
                company_email: compEmail,
                company_mobile: compMobile,
                company_website: compWebsite || null,
                ac_no: acNo || null,
                ifsc_code: ifscCode || null,
                bank_name: bankName || null,
                registered_address: regAddress,
                logo_file: logoUrl,
                qr_file: qrUrl,
                stamp_file: stampUrl,
                signature_file: signUrl
            }])
            .select();

        if (dbError) throw dbError;

        res.status(201).json({ message: "Company profile saved successfully!", data: data[0] });

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

        const { data: existing, error: fetchError } = await db
            .from('company_profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ message: "Company profile not found." });
        }

        const bucketName = process.env.COMPANY_BUCKET || 'company-images';

        // Navin file dili asel tar upload hoil, nahi tar juni URL tashich rahil
        const logoUrl = req.files && req.files.logoFile ? await uploadFileToSupabase(req.files.logoFile[0], bucketName) : existing.logo_file;
        const qrUrl = req.files && req.files.qrFile ? await uploadFileToSupabase(req.files.qrFile[0], bucketName) : existing.qr_file;
        const stampUrl = req.files && req.files.stampFile ? await uploadFileToSupabase(req.files.stampFile[0], bucketName) : existing.stamp_file;
        const signUrl = req.files && req.files.signFile ? await uploadFileToSupabase(req.files.signFile[0], bucketName) : existing.signature_file;

        const { error: updateError } = await db
            .from('company_profiles')
            .update({
                company_name: compName,
                print_name: printName,
                gst_number: gstNumber,
                gst_status: gstStatus,
                pan_number: panNumber,
                cin_number: cinNumber || null,
                tan_number: tanNumber || null,
                udyam_number: udyamNumber || null,
                fy_beginning: fyBeginning,
                company_email: compEmail,
                company_mobile: compMobile,
                company_website: compWebsite || null,
                ac_no: acNo || null,
                ifsc_code: ifscCode || null,
                bank_name: bankName || null,
                registered_address: regAddress,
                logo_file: logoUrl,
                qr_file: qrUrl,
                stamp_file: stampUrl,
                signature_file: signUrl
            })
            .eq('id', id);

        if (updateError) throw updateError;

        res.status(200).json({ message: "Company profile updated successfully!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Delete company profile (DELETE)
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: record, error: fetchError } = await db
            .from('company_profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return res.status(404).json({ message: "Data not found." });
        }

        const { error: dbError } = await db
            .from('company_profiles')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        res.status(200).json({ message: "Company profile deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};