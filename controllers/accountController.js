const db = require('../db');

// 1. Get list of all accounts (GET)
exports.getAllAccounts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM accounts ORDER BY id DESC');
        res.status(200).json(rows);
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
                message: "Backend did not receive text data from the form." 
            });
        }

        // Get file names from Supabase middleware (req.supabaseFiles)
        const panFileName = req.supabaseFiles && req.supabaseFiles.panFile ? req.supabaseFiles.panFile : '-';
        const gstFileName = req.supabaseFiles && req.supabaseFiles.gstFile ? req.supabaseFiles.gstFile : '-';
        const msmeFileName = req.supabaseFiles && req.supabaseFiles.msmeFile ? req.supabaseFiles.msmeFile : '-';

        const sql = `INSERT INTO accounts 
        (id, print_name, account_group, opening_bal, bal_type, credit_limit, email_id, mobile_no, whatsapp_no, telephone_no, transport, station, pin_code, msme_type, dealer_type, gstin_no, pan_no, cin_no, billing_address, shipping_address, credit_days, credit_limit_val, outstanding_alert, block_sales, pan_file_name, gst_file_name, msme_file_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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

        const [existing] = await db.query('SELECT * FROM accounts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Account not found.' });
        }

        const name = body.name || existing[0].print_name;
        const group = body.group || existing[0].account_group;
        const opBal = body.opBal || existing[0].opening_bal;
        const balType = body.balType || existing[0].bal_type;
        const creditLimit = body.creditLimit || existing[0].credit_limit;
        const emailId = body.emailId || existing[0].email_id;
        const mobileNo = body.mobileNo || existing[0].mobile_no;
        const whatsapp = body.whatsapp || existing[0].whatsapp_no;
        const telNo = body.telNo || existing[0].telephone_no;
        const transport = body.transport || existing[0].transport;
        const station = body.station || existing[0].station;
        const pinCode = body.pinCode || existing[0].pin_code;
        const msmeType = body.msmeType || existing[0].msme_type;
        const gstStatus = body.gstStatus || existing[0].dealer_type;
        const gstNo = body.gstNo || existing[0].gstin_no;
        const panNo = body.panNo || existing[0].pan_no;
        const cinNo = body.cinNo || existing[0].cin_no;
        const billAddr = body.billAddr || existing[0].billing_address;
        const shipAddr = body.shipAddr || existing[0].shipping_address;
        const creditDays = body.creditDays || existing[0].credit_days;
        const creditLimitVal = body.creditLimitVal || existing[0].credit_limit_val;
        const outAlert = body.outAlert || existing[0].outstanding_alert;
        const blockSales = body.blockSales || existing[0].block_sales;

        // Get new uploaded file names from Supabase, or keep existing ones
        const panFileName = req.supabaseFiles && req.supabaseFiles.panFile ? req.supabaseFiles.panFile : existing[0].pan_file_name;
        const gstFileName = req.supabaseFiles && req.supabaseFiles.gstFile ? req.supabaseFiles.gstFile : existing[0].gst_file_name;
        const msmeFileName = req.supabaseFiles && req.supabaseFiles.msmeFile ? req.supabaseFiles.msmeFile : existing[0].msme_file_name;

        const sql = `UPDATE accounts SET 
        print_name=?, account_group=?, opening_bal=?, bal_type=?, credit_limit=?, email_id=?, mobile_no=?, whatsapp_no=?, 
        telephone_no=?, transport=?, station=?, pin_code=?, msme_type=?, dealer_type=?, gstin_no=?, pan_no=?, cin_no=?, 
        billing_address=?, shipping_address=?, credit_days=?, credit_limit_val=?, outstanding_alert=?, block_sales=?, 
        pan_file_name=?, gst_file_name=?, msme_file_name=? WHERE id=?`;

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
        const [result] = await db.query('DELETE FROM accounts WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'Error', message: 'Account deleted not found.' });
        }
        res.status(200).json({ status: 'Success', message: 'Account deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};