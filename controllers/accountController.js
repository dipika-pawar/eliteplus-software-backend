const { supabase, ...db } = require('../db');

async function uploadToSupabase(file, folder = 'accounts') {
    if (!file) return '-';
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });
    if (error) throw new Error(error.message);
    const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
    return publicUrlData.publicUrl;
}

// 1. Get list of all accounts (GET)
exports.getAllAccounts = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM accounts ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
                message: "Backend did not receive text data from the form." 
            });
        }

        const panFileName = req.files && req.files.panFile ? await uploadToSupabase(req.files.panFile[0]) : '-';
        const gstFileName = req.files && req.files.gstFile ? await uploadToSupabase(req.files.gstFile[0]) : '-';
        const msmeFileName = req.files && req.files.msmeFile ? await uploadToSupabase(req.files.msmeFile[0]) : '-';

        const sql = `INSERT INTO accounts 
        (id, print_name, account_group, opening_bal, bal_type, credit_limit, email_id, mobile_no, whatsapp_no, telephone_no, transport, station, pin_code, msme_type, dealer_type, gstin_no, pan_no, cin_no, billing_address, shipping_address, credit_days, credit_limit_val, outstanding_alert, block_sales, pan_file_name, gst_file_name, msme_file_name) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`;

        const values = [
            id.toString(), name, group, opBal, balType, creditLimit, emailId, mobileNo, whatsapp,
            telNo, transport, station, pinCode, msmeType, gstStatus, gstNo, panNo, cinNo,
            billAddr, shipAddr, creditDays, creditLimitVal, outAlert, blockSales,
            panFileName, gstFileName, msmeFileName
        ];

        await db.query(sql, values);
        res.status(201).json({ status: 'Success', message: 'Account Master saved successfully!' });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 3. Update account master (PUT)
exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const existing = await db.query('SELECT * FROM accounts WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Account not found.' });
        }

        const oldData = existing.rows[0];
        const name = body.name || oldData.print_name;
        const group = body.group || oldData.account_group;
        const opBal = body.opBal || oldData.opening_bal;
        const balType = body.balType || oldData.bal_type;
        const creditLimit = body.creditLimit || oldData.credit_limit;
        const emailId = body.emailId || oldData.email_id;
        const mobileNo = body.mobileNo || oldData.mobile_no;
        const whatsapp = body.whatsapp || oldData.whatsapp_no;
        const telNo = body.telNo || oldData.telephone_no;
        const transport = body.transport || oldData.transport;
        const station = body.station || oldData.station;
        const pinCode = body.pinCode || oldData.pin_code;
        const msmeType = body.msmeType || oldData.msme_type;
        const gstStatus = body.gstStatus || oldData.dealer_type;
        const gstNo = body.gstNo || oldData.gstin_no;
        const panNo = body.panNo || oldData.pan_no;
        const cinNo = body.cinNo || oldData.cin_no;
        const billAddr = body.billAddr || oldData.billing_address;
        const shipAddr = body.shipAddr || oldData.shipping_address;
        const creditDays = body.creditDays || oldData.credit_days;
        const creditLimitVal = body.creditLimitVal || oldData.credit_limit_val;
        const outAlert = body.outAlert || oldData.outstanding_alert;
        const blockSales = body.blockSales || oldData.block_sales;

        const panFileName = req.files && req.files.panFile ? await uploadToSupabase(req.files.panFile[0]) : oldData.pan_file_name;
        const gstFileName = req.files && req.files.gstFile ? await uploadToSupabase(req.files.gstFile[0]) : oldData.gst_file_name;
        const msmeFileName = req.files && req.files.msmeFile ? await uploadToSupabase(req.files.msmeFile[0]) : oldData.msme_file_name;

        const sql = `UPDATE accounts SET 
        print_name=$1, account_group=$2, opening_bal=$3, bal_type=$4, credit_limit=$5, email_id=$6, mobile_no=$7, whatsapp_no=$8, 
        telephone_no=$9, transport=$10, station=$11, pin_code=$12, msme_type=$13, dealer_type=$14, gstin_no=$15, pan_no=$16, cin_no=$17, 
        billing_address=$18, shipping_address=$19, credit_days=$20, credit_limit_val=$21, outstanding_alert=$22, block_sales=$23, 
        pan_file_name=$24, gst_file_name=$25, msme_file_name=$26 WHERE id=$27`;

        const values = [
            name, group, opBal, balType, creditLimit, emailId, mobileNo, whatsapp,
            telNo, transport, station, pinCode, msmeType, gstStatus, gstNo, panNo, cinNo,
            billAddr, shipAddr, creditDays, creditLimitVal, outAlert, blockSales,
            panFileName, gstFileName, msmeFileName, id
        ];

        await db.query(sql, values);
        res.status(200).json({ status: 'Success', message: 'Account Master updated successfully!' });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 4. Delete account master (DELETE)
exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM accounts WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'Error', message: 'Account not found.' });
        }
        res.status(200).json({ status: 'Success', message: 'Account deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};