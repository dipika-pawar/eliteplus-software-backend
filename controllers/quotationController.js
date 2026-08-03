const db = require('../db');

// १. सर्व कोटेशन्सची यादी (GET Directory)
exports.getAllQuotations = async (req, res) => {
    try {
        const sql = `
            SELECT q.*, a.print_name AS party_name 
            FROM quotations q 
            JOIN accounts a ON q.account_id = a.id 
            ORDER BY q.id DESC
        `;
        const [rows] = await db.query(sql);
        res.status(200).json({ status: 'Success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// २. ठराविक कोटेशनचे पूर्ण तपशील मिळवणे (GET Single View)
exports.getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [quotation] = await db.query('SELECT * FROM quotations WHERE id = ?', [id]);
        if (quotation.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Voucher not found.' });
        }
        
        const [items] = await db.query(`
            SELECT qi.*, i.item_name, i.brand, i.hsn_sac_code
            FROM quotation_items qi
            JOIN items i ON qi.item_id = i.id
            WHERE qi.quotation_id = ?
        `, [id]);
        
        res.status(200).json({ status: 'Success', quotation: quotation[0], items: items });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// ३. नवीन सेल्स कोटेशन आणि त्याचे डायनॅमिक आयटम्स सेव्ह करणे (POST)
exports.createQuotation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            id, series, date, voucherNo, saleType, partyName, matCentre,
            narration, discountPercent, subtotal, taxableAmount, gstTotal,
            discountAmount, roundOff, grandTotal, amountInWords, items
        } = req.body;

        const [partyRows] = await connection.query('SELECT id FROM accounts WHERE print_name = ?', [partyName]);
        if (partyRows.length === 0) {
            throw new Error(`पार्टी मास्टरमध्ये '${partyName}' नावाची संस्था सापडलेली नाही.`);
        }
        const accountId = partyRows[0].id;

        const parts = date.split('-');
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        const qSql = `INSERT INTO quotations 
        (id, series, quotation_date, voucher_no, sale_type, account_id, material_centre, narration, discount_percentage, subtotal, taxable_amount, gst_total, discount_amount, round_off, grand_total, amount_in_words) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        await connection.query(qSql, [
            id, series, formattedDate, voucherNo, saleType, accountId, matCentre, 
            narration, discountPercent, subtotal, taxableAmount, gstTotal, 
            discountAmount, roundOff, grandTotal, amountInWords
        ]);

        for (let item of items) {
            const [itemRows] = await connection.query('SELECT id FROM items WHERE item_name = ?', [item.name]);
            if (itemRows.length === 0) {
                throw new Error(`आयटम मास्टरमध्ये '${item.name}' प्रॉडक्ट सापडलेला नाही.`);
            }
            const itemId = itemRows[0].id;

            const itemSql = `INSERT INTO quotation_items 
            (quotation_id, item_id, qty, unit, price, tax_rate, taxable_amount, tax_amount, line_total) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            await connection.query(itemSql, [
                id, itemId, item.qty, item.unit, item.price, item.gstRate, 
                item.taxableAmount, item.taxAmount, item.aggregate
            ]);
        }

        await connection.commit();
        res.status(201).json({ status: 'Success', message: 'नवीन सेल्स कोटेशन वाउचर यशस्वीरित्या जतन झाले!' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ status: 'Error', message: error.message });
    } finally {
        connection.release();
    }
};

// ४. जुने सेल्स कोटेशन अपडेट करणे (PUT)
exports.updateQuotation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const {
            series, date, voucherNo, saleType, partyName, matCentre,
            narration, discountPercent, subtotal, taxableAmount, gstTotal,
            discountAmount, roundOff, grandTotal, amountInWords, items
        } = req.body;

        const [partyRows] = await connection.query('SELECT id FROM accounts WHERE print_name = ?', [partyName]);
        if (partyRows.length === 0) throw new Error('Invalid Party Selection.');
        const accountId = partyRows[0].id;

        const parts = date.split('-');
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        const uSql = `UPDATE quotations SET 
        series=?, quotation_date=?, voucher_no=?, sale_type=?, account_id=?, material_centre=?, narration=?, 
        discount_percentage=?, subtotal=?, taxable_amount=?, gst_total=?, discount_amount=?, round_off=?, grand_total=?, amount_in_words=? 
        WHERE id=?`;
        
        await connection.query(uSql, [
            series, formattedDate, voucherNo, saleType, accountId, matCentre, narration, 
            discountPercent, subtotal, taxableAmount, gstTotal, discountAmount, roundOff, grandTotal, amountInWords, id
        ]);

        await connection.query('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);

        for (let item of items) {
            const [itemRows] = await connection.query('SELECT id FROM items WHERE item_name = ?', [item.name]);
            if (itemRows.length === 0) throw new Error(`Item '${item.name}' not found.`);
            const itemId = itemRows[0].id;

            const itemSql = `INSERT INTO quotation_items 
            (quotation_id, item_id, qty, unit, price, tax_rate, taxable_amount, tax_amount, line_total) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            await connection.query(itemSql, [
                id, itemId, item.qty, item.unit, item.price, item.gstRate, 
                item.taxableAmount, item.taxAmount, item.aggregate
            ]);
        }

        await connection.commit();
        res.status(200).json({ status: 'Success', message: 'सेल्स कोटेशन वाउचर यशस्वीरित्या अपडेट झाले!' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ status: 'Error', message: error.message });
    } finally {
        connection.release();
    }
};

// ५. कोटेशन डिलीट करणे (DELETE)
exports.deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM quotations WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'Error', message: 'Voucher not found.' });
        }
        res.status(200).json({ status: 'Success', message: 'वाउचर यशस्वीरित्या डिलीट केले!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};