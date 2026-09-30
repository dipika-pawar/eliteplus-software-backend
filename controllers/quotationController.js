const db = require('../db'); // He supabaseClient (db.js) export karel

// helper logic for Financial Year (1 March to 28/29 February)
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

// 0. Get the next auto-incremented voucher number (GET Next Voucher Number)
exports.getNextVoucherNumber = async (req, res) => {
    try {
        const fyStr = getCurrentFinancialYear();
        const prefix = `QTN/${fyStr}/`;

        const { data: rows, error } = await db
            .from('quotations')
            .select('voucher_no')
            .like('voucher_no', `${prefix}%`)
            .order('id', { ascending: false })
            .limit(1);

        if (error) throw error;

        let nextNumber = 1;
        if (rows && rows.length > 0) {
            const lastVoucherNo = rows[0].voucher_no;
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

// 1. Get list of all quotations (GET Directory)
exports.getAllQuotations = async (req, res) => {
    try {
        const { data, error } = await db
            .from('quotations')
            .select('*, accounts(print_name)')
            .order('id', { ascending: false });

        if (error) throw error;

        // Map data to match exact structure with party_name
        const rows = data.map(q => ({
            ...q,
            party_name: q.accounts ? q.accounts.print_name : null
        }));

        res.status(200).json({ status: 'Success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 2. Get full details of a specific quotation (GET Single View)
exports.getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: quotation, error: qError } = await db
            .from('quotations')
            .select('*')
            .eq('id', id)
            .single();

        if (qError || !quotation) {
            return res.status(404).json({ status: 'Error', message: 'Voucher not found.' });
        }
        
        const { data: items, error: iError } = await db
            .from('quotation_items')
            .select('*, items(item_name, brand, hsn_sac_code)')
            .eq('quotation_id', id);

        if (iError) throw iError;

        const formattedItems = items.map(qi => ({
            ...qi,
            item_name: qi.items ? qi.items.item_name : null,
            brand: qi.items ? qi.items.brand : null,
            hsn_sac_code: qi.items ? qi.items.hsn_sac_code : null
        }));
        
        res.status(200).json({ status: 'Success', quotation: quotation, items: formattedItems });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 3. Save new sales quotation and its dynamic items (POST)
exports.createQuotation = async (req, res) => {
    try {
        const {
            id, series, date, voucherNo, saleType, partyName, matCentre,
            narration, termsConditions, discountPercent, subtotal, taxableAmount, gstTotal,
            discountAmount, roundOff, grandTotal, amountInWords, items
        } = req.body;

        const { data: partyRows, error: partyError } = await db
            .from('accounts')
            .select('id')
            .eq('print_name', partyName);

        if (partyError || partyRows.length === 0) {
            throw new Error(`Organization named '${partyName}' not found in Party Master.`);
        }
        const accountId = partyRows[0].id;

        const parts = date.split('-');
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        const { error: qInsertError } = await db
            .from('quotations')
            .insert([{
                id: id.toString(),
                series,
                quotation_date: formattedDate,
                voucher_no: voucherNo,
                sale_type: saleType,
                account_id: accountId,
                material_centre: matCentre,
                narration,
                terms_conditions: termsConditions,
                discount_percentage: discountPercent,
                subtotal,
                taxable_amount: taxableAmount,
                gst_total: gstTotal,
                discount_amount: discountAmount,
                round_off: roundOff,
                grand_total: grandTotal,
                amount_in_words: amountInWords
            }]);

        if (qInsertError) throw qInsertError;

        for (let item of items) {
            const { data: itemRows, error: itemErr } = await db
                .from('items')
                .select('id')
                .eq('item_name', item.name);

            if (itemErr || itemRows.length === 0) {
                throw new Error(`Product '${item.name}' not found in Item Master.`);
            }
            const itemId = itemRows[0].id;

            const { error: qiError } = await db
                .from('quotation_items')
                .insert([{
                    quotation_id: id.toString(),
                    item_id: itemId,
                    qty: item.qty,
                    unit: item.unit,
                    price: item.price,
                    tax_rate: item.gstRate,
                    taxable_amount: item.taxableAmount,
                    tax_amount: item.taxAmount,
                    line_total: item.aggregate
                }]);

            if (qiError) throw qiError;
        }

        res.status(201).json({ status: 'Success', message: 'New sales quotation voucher saved successfully!' });
    } catch (error) {
        res.status(400).json({ status: 'Error', message: error.message });
    }
};

// 4. Update existing sales quotation (PUT)
exports.updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            series, date, voucherNo, saleType, partyName, matCentre,
            narration, termsConditions, discountPercent, subtotal, taxableAmount, gstTotal,
            discountAmount, roundOff, grandTotal, amountInWords, items
        } = req.body;

        const { data: partyRows, error: partyError } = await db
            .from('accounts')
            .select('id')
            .eq('print_name', partyName);

        if (partyError || partyRows.length === 0) throw new Error('Invalid Party Selection.');
        const accountId = partyRows[0].id;

        const parts = date.split('-');
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        const { error: updateErr } = await db
            .from('quotations')
            .update({
                series,
                quotation_date: formattedDate,
                voucher_no: voucherNo,
                sale_type: saleType,
                account_id: accountId,
                material_centre: matCentre,
                narration,
                terms_conditions: termsConditions,
                discount_percentage: discountPercent,
                subtotal,
                taxable_amount: taxableAmount,
                gst_total: gstTotal,
                discount_amount: discountAmount,
                round_off: roundOff,
                grand_total: grandTotal,
                amount_in_words: amountInWords
            })
            .eq('id', id);

        if (updateErr) throw updateErr;

        // Delete old items and insert updated items
        const { error: delErr } = await db
            .from('quotation_items')
            .delete()
            .eq('quotation_id', id);

        if (delErr) throw delErr;

        for (let item of items) {
            const { data: itemRows, error: itemErr } = await db
                .from('items')
                .select('id')
                .eq('item_name', item.name);

            if (itemErr || itemRows.length === 0) throw new Error(`Item '${item.name}' not found.`);
            const itemId = itemRows[0].id;

            const { error: qiError } = await db
                .from('quotation_items')
                .insert([{
                    quotation_id: id,
                    item_id: itemId,
                    qty: item.qty,
                    unit: item.unit,
                    price: item.price,
                    tax_rate: item.gstRate,
                    taxable_amount: item.taxableAmount,
                    tax_amount: item.taxAmount,
                    line_total: item.aggregate
                }]);

            if (qiError) throw qiError;
        }

        res.status(200).json({ status: 'Success', message: 'Sales quotation voucher updated successfully!' });
    } catch (error) {
        res.status(400).json({ status: 'Error', message: error.message });
    }
};

// 5. Delete quotation (DELETE)
exports.deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: record, error: fetchError } = await db
            .from('quotations')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return res.status(404).json({ status: 'Error', message: 'Voucher not found.' });
        }

        const { error: dbError } = await db
            .from('quotations')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        res.status(200).json({ status: 'Success', message: 'Voucher deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};