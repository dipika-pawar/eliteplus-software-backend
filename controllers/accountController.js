const db = require('../db'); // He supabaseClient (db.js) export karel

// Helper function: Supabase storage var file upload karun public URL milvane sathi
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

// 1. Get list of all accounts (GET)
exports.getAllAccounts = async (req, res) => {
    try {
        const { data, error } = await db
            .from('accounts')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 2. Save new account master (POST)
exports.createAccount = async (req, res) => {
    try {
        const body = req.body || {};

        const id = body.id ? BigInt(body.id) : Date.now();
        const name = body.name || null;
        const group = body.group || null;
        const opBal = body.opBal || 0.00;
        const balType = body.balType || null;
        const creditLimit = body.creditLimit || 0.00;
        const emailId = body.emailId || null;
        const mobileNo = body.mobileNo || null;
        const whatsapp = body.whatsapp || null;
        const telNo = body.telNo || null;
        const transport = body.transport || null;
        const station = body.station || null;
        const pinCode = body.pinCode || null;
        const msmeType = body.msmeType || null;
        const gstStatus = body.gstStatus || null;
        const gstNo = body.gstNo || null;
        const panNo = body.panNo || null;
        const cinNo = body.cinNo || null;
        const billAddr = body.billAddr || null;
        const shipAddr = body.shipAddr || null;
        const creditDays = body.creditDays || 0;
        const creditLimitVal = body.creditLimitVal || 0.00;
        const outAlert = body.outAlert || 'No';
        const blockSales = body.blockSales || 'No';

        if (!name || !group) {
            return res.status(400).json({ 
                status: 'Error', 
                message: "Backend did not receive text data from the form. Please ensure data is sent correctly from Postman or frontend." 
            });
        }

        const bucketName = process.env.ACCOUNT_BUCKET || 'account-files';

        // Supabase storage var files upload karun URLs milvane (or '-' fallback)
        const panFileName = req.files && req.files.panFile ? await uploadFileToSupabase(req.files.panFile[0], bucketName) : '-';
        const gstFileName = req.files && req.files.gstFile ? await uploadFileToSupabase(req.files.gstFile[0], bucketName) : '-';
        const msmeFileName = req.files && req.files.msmeFile ? await uploadFileToSupabase(req.files.msmeFile[0], bucketName) : '-';

        const { data, error: dbError } = await db
            .from('accounts')
            .insert([{
                id: id.toString(),
                print_name: name,
                account_group: group,
                opening_bal: opBal,
                bal_type: balType,
                credit_limit: creditLimit,
                email_id: emailId,
                mobile_no: mobileNo,
                whatsapp_no: whatsapp,
                telephone_no: telNo,
                transport: transport,
                station: station,
                pin_code: pinCode,
                msme_type: msmeType,
                dealer_type: gstStatus,
                gstin_no: gstNo,
                pan_no: panNo,
                cin_no: cinNo,
                billing_address: billAddr,
                shipping_address: shipAddr,
                credit_days: creditDays,
                credit_limit_val: creditLimitVal,
                outstanding_alert: outAlert,
                block_sales: blockSales,
                pan_file_name: panFileName,
                gst_file_name: gstFileName,
                msme_file_name: msmeFileName
            }])
            .select();

        if (dbError) throw dbError;

        res.status(201).json({ status: 'Success', message: 'Account Master saved successfully!', data: data[0] });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 3. Update account master (PUT)
exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const { data: existing, error: fetchError } = await db
            .from('accounts')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ status: 'Error', message: 'Account not found.' });
        }

        const name = body.name || existing.print_name;
        const group = body.group || existing.account_group;
        const opBal = body.opBal || existing.opening_bal;
        const balType = body.balType || existing.bal_type;
        const creditLimit = body.creditLimit || existing.credit_limit;
        const emailId = body.emailId || existing.email_id;
        const mobileNo = body.mobileNo || existing.mobile_no;
        const whatsapp = body.whatsapp || existing.whatsapp_no;
        const telNo = body.telNo || existing.telephone_no;
        const transport = body.transport || existing.transport;
        const station = body.station || existing.station;
        const pinCode = body.pinCode || existing.pin_code;
        const msmeType = body.msmeType || existing.msme_type;
        const gstStatus = body.gstStatus || existing.dealer_type;
        const gstNo = body.gstNo || existing.gstin_no;
        const panNo = body.panNo || existing.pan_no;
        const cinNo = body.cinNo || existing.cin_no;
        const billAddr = body.billAddr || existing.billing_address;
        const shipAddr = body.shipAddr || existing.shipping_address;
        const creditDays = body.creditDays || existing.credit_days;
        const creditLimitVal = body.creditLimitVal || existing.credit_limit_val;
        const outAlert = body.outAlert || existing.outstanding_alert;
        const blockSales = body.blockSales || existing.block_sales;

        const bucketName = process.env.ACCOUNT_BUCKET || 'account-files';

        const panFileName = req.files && req.files.panFile ? await uploadFileToSupabase(req.files.panFile[0], bucketName) : existing.pan_file_name;
        const gstFileName = req.files && req.files.gstFile ? await uploadFileToSupabase(req.files.gstFile[0], bucketName) : existing.gst_file_name;
        const msmeFileName = req.files && req.files.msmeFile ? await uploadFileToSupabase(req.files.msmeFile[0], bucketName) : existing.msme_file_name;

        const { error: updateError } = await db
            .from('accounts')
            .update({
                print_name: name,
                account_group: group,
                opening_bal: opBal,
                bal_type: balType,
                credit_limit: creditLimit,
                email_id: emailId,
                mobile_no: mobileNo,
                whatsapp_no: whatsapp,
                telephone_no: telNo,
                transport: transport,
                station: station,
                pin_code: pinCode,
                msme_type: msmeType,
                dealer_type: gstStatus,
                gstin_no: gstNo,
                pan_no: panNo,
                cin_no: cinNo,
                billing_address: billAddr,
                shipping_address: shipAddr,
                credit_days: creditDays,
                credit_limit_val: creditLimitVal,
                outstanding_alert: outAlert,
                block_sales: blockSales,
                pan_file_name: panFileName,
                gst_file_name: gstFileName,
                msme_file_name: msmeFileName
            })
            .eq('id', id);

        if (updateError) throw updateError;

        res.status(200).json({ status: 'Success', message: 'Account Master updated successfully!' });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 4. Delete account master (DELETE)
exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: record, error: fetchError } = await db
            .from('accounts')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return res.status(404).json({ status: 'Error', message: 'Account not found.' });
        }

        const { error: dbError } = await db
            .from('accounts')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        res.status(200).json({ status: 'Success', message: 'Account deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};