const db = require('../db');

function getCurrentFinancialYear() {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;

    let startYear, endYear;
    if (month >= 3) {
        startYear = year;
        endYear = year + 1;
    } else {
        startYear = year - 1;
        endYear = year;
    }

    const startFormatted = startYear;
    const endFormatted = endYear.toString().slice(-2);
    return `${startFormatted}-${endFormatted}`; 
}

exports.getNextVoucherNumber = async (req, res) => {
    try {
        const fyStr = getCurrentFinancialYear();
        const prefix = `QTN/${fyStr}/`;

        const result = await db.query(
            "SELECT voucher_no FROM quotations WHERE voucher_no LIKE $1 ORDER BY id DESC LIMIT 1",
            [`${prefix}%`]
        );

        let nextNumber = 1;
        if (result.rows.length > 0) {
            const lastVoucherNo = result.rows[0].voucher_no;
            const parts = lastVoucherNo.split('/');
            const lastSeq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastSeq)) {
                nextNumber = lastSeq + 1;
            }
        }

        const autoVoucherNo = `${prefix}${nextNumber}`;
        res.status(200).json({ status: 'Success', voucherNo: autoVoucherNo, financialYear: fyStr });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

exports.getAllQuotations = async (req, res) => {
    try {
        const sql = `
            SELECT q.*, a.print_name AS party_name 
            FROM quotations q 
            JOIN accounts a ON q.account_id = a.id 
            ORDER BY q.id DESC
        `;
        const result = await db.query(sql);
        res.status(200).json({ status: 'Success', data: result.rows });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

exports.getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const quotation = await db.query('SELECT * FROM quotations WHERE id = $1', [id]);
        if (quotation.rows.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Voucher not found.' });
        }
        
        const items = await db.query(`
            SELECT qi.*, i.item_name, i.brand, i.hsn_sac_code
            FROM quotation_items qi
            JOIN items i ON qi.item_id = i.id
            WHERE qi.quotation_id = $1
        `, [id]);
        
        res.status(200).json({ status: 'Success', quotation: quotation.rows[0], items: items.rows });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

exports.createQuotation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            id, series, date, voucherNo, saleType, partyName, matCentre,
            narration, termsConditions, discountPercent, subtotal, taxableAmount, gstTotal,
            discountAmount, roundOff, grandTotal, amountInWords, items
        } = req.body;

        const partyRows = await connection.query('SELECT id FROM accounts WHERE print_name = $1', [partyName]);
        if (partyRows.rows.length === 0) {
            throw new Error(`Organization named '${partyName}' not found in Party Master.`);
        }
        const accountId = partyRows.rows[0].id;

        const parts = date.split('-');
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        const qSql = `INSERT INTO quotations 
        (id, series, quotation_date, voucher_no, sale_type, account_id, material_centre, narration, terms_conditions, discount_percentage, subtotal, taxable_amount, gst_total, discount_amount, round_off, grand_total, amount_in_words) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`;
        
        await connection.query(qSql, [
            id, series, formattedDate, voucherNo, saleType, accountId, matCentre, 
            narration, termsConditions, discountPercent, subtotal, taxableAmount, gstTotal, 
            discountAmount, roundOff, grandTotal, amountInWords
        ]);

        for (let item of items) {
            const itemRows = await connection.query('SELECT id FROM items WHERE item_name = $1', [item.name]);
            if (itemRows.rows.length === 0) {
                throw new Error(`Product '${item.name}' not found in Item Master.`);
            }
            const itemId = itemRows.rows[0].id;

            const itemSql = `INSERT INTO quotation_items 
            (quotation_id, item_id, qty, unit, price, tax_rate, taxable_amount, tax_amount, line_total) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
            
            await connection.query(itemSql, [
                id, itemId, item.qty, item.unit, item.price, item.gstRate, 
                item.taxableAmount, item.taxAmount, item.aggregate
            ]);
        }

        await connection.commit();
        res.status(201).json({ status: 'Success', message: 'New sales quotation voucher saved successfully!' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ status: 'Error', message: error.message });
    } finally {
        connection.release();
    }
};

exports.updateQuotation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const {
            series, date, voucherNo, saleType, partyName, matCentre,
            narration, termsConditions, discountPercent, subtotal, taxableAmount, gstTotal,
            discountAmount, roundOff, grandTotal, amountInWords, items
        } = req.body;

        const partyRows = await connection.query('SELECT id FROM accounts WHERE print_name = $1', [partyName]);
        if (partyRows.rows.length === 0) throw new Error('Invalid Party Selection.');
        const accountId = partyRows.rows[0].id;

        const parts = date.split('-');
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        const uSql = `UPDATE quotations SET 
        series=$1, quotation_date=$2, voucher_no=$3, sale_type=$4, account_id=$5, material_centre=$6, narration=$7, terms_conditions=$8, 
        discount_percentage=$9, subtotal=$10, taxable_amount=$11, gst_total=$12, discount_amount=$13, round_off=$14, grand_total=$15, amount_in_words=$16 
        WHERE id=$17`;
        
        await connection.query(uSql, [
            series, formattedDate, voucherNo, saleType, accountId, matCentre, narration, termsConditions, 
            discountPercent, subtotal, taxableAmount, gstTotal, discountAmount, roundOff, grandTotal, amountInWords, id
        ]);

        await connection.query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);

        for (let item of items) {
            const itemRows = await connection.query('SELECT id FROM items WHERE item_name = $1', [item.name]);
            if (itemRows.rows.length === 0) throw new Error(`Item '${item.name}' not found.`);
            const itemId = itemRows.rows[0].id;

            const itemSql = `INSERT INTO quotation_items 
            (quotation_id, item_id, qty, unit, price, tax_rate, taxable_amount, tax_amount, line_total) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
            
            await connection.query(itemSql, [
                id, itemId, item.qty, item.unit, item.price, item.gstRate, 
                item.taxableAmount, item.taxAmount, item.aggregate
            ]);
        }

        await connection.commit();
        res.status(200).json({ status: 'Success', message: 'Sales quotation voucher updated successfully!' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ status: 'Error', message: error.message });
    } finally {
        connection.release();
    }
};

exports.deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM quotations WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'Error', message: 'Voucher not found.' });
        }
        res.status(200).json({ status: 'Success', message: 'Voucher deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};