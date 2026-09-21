const { supabase, ...db } = require('../db');

async function uploadToSupabase(file, folder = 'items') {
    if (!file) return null;
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

// 1. Get list of all items (GET All Items)
exports.getAllItems = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM items ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 2. Save new item master (POST Create Item)
exports.createItem = async (req, res) => {
    try {
        const body = req.body || {};
        
        const id = body.id || Date.now();
        const name = body.name || null;
        const code = body.code || null;
        const printName = body.printName || name;
        const type = body.type || 'Product';
        const group = body.group || 'General';
        const brand = body.brand || null;
        const unit = body.unit || 'Pcs';
        const taxCategory = body.taxCategory || null;
        const hsn = body.hsn || null;
        const openingStock = parseInt(body.openingStock) || 0;
        const purchasePrice = parseFloat(body.purchasePrice) || 0.00;
        const price = parseFloat(body.price) || 0.00;
        const mrp = parseFloat(body.mrp) || 0.00;
        const packing = body.packing || null;
        const videoLink = body.videoLink || null;
        const description = body.description || null;
        const stock = parseInt(body.stock) || openingStock;

        if (!name || !code || !printName) {
            return res.status(400).json({ status: 'Error', message: 'Item Name, Code and Print Name are mandatory.' });
        }

        let savedImage = body.image || ""; 
        if (req.files && req.files.itemImg && req.files.itemImg.length > 0) {
            savedImage = await uploadToSupabase(req.files.itemImg[0]); 
        }

        const pdfPath = (req.files && req.files.itemPdf && req.files.itemPdf.length > 0) 
            ? await uploadToSupabase(req.files.itemPdf[0], 'brochures') 
            : null;

        const stockValue = openingStock * purchasePrice;

        const sql = `INSERT INTO items 
        (id, item_name, item_code, print_name, item_type, item_group, brand, unit, tax_category, hsn_sac_code, opening_stock_qty, opening_stock_value, purchase_price, sales_price, mrp, current_stock, packing_dimension, video_link, item_specification, image_path, pdf_path) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`;

        const values = [
            id, name, code, printName, type, group, brand, unit, taxCategory, hsn, 
            openingStock, stockValue, purchasePrice, price, mrp, stock, 
            packing, videoLink, description, savedImage, pdfPath
        ];

        await db.query(sql, values);
        res.status(201).json({ status: 'Success', message: 'Item saved successfully in the database!' });

    } catch (error) {
        if (error.code === '23505') { // PostgreSQL unique violation code
            return res.status(400).json({ status: 'Error', message: 'This Item Code is already available.' });
        }
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 3. Update item master (PUT Update Item)
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const existing = await db.query('SELECT * FROM items WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Item not found.' });
        }

        const oldData = existing.rows[0];

        const name = body.name !== undefined ? body.name : oldData.item_name;
        const code = body.code !== undefined ? body.code : oldData.item_code;
        const printName = body.printName !== undefined ? body.printName : oldData.print_name;
        const type = body.type !== undefined ? body.type : oldData.item_type;
        const group = body.group !== undefined ? body.group : oldData.item_group;
        const brand = body.brand !== undefined ? body.brand : oldData.brand;
        const unit = body.unit !== undefined ? body.unit : oldData.unit;
        const taxCategory = body.taxCategory !== undefined ? body.taxCategory : oldData.tax_category;
        const hsn = body.hsn !== undefined ? body.hsn : oldData.hsn_sac_code;
        const purchasePrice = body.purchasePrice !== undefined ? parseFloat(body.purchasePrice) || 0.00 : oldData.purchase_price;
        const salesPrice = body.price !== undefined ? parseFloat(body.price) || 0.00 : oldData.sales_price;
        const mrp = body.mrp !== undefined ? parseFloat(body.mrp) || 0.00 : oldData.mrp;
        const packing = body.packing !== undefined ? body.packing : oldData.packing_dimension;
        const videoLink = body.videoLink !== undefined ? body.videoLink : oldData.video_link;
        const description = body.description !== undefined ? body.description : oldData.item_specification;
        const stock = body.stock !== undefined ? parseInt(body.stock) || 0 : oldData.current_stock;

        let savedImage = oldData.image_path;
        if (req.files && req.files.itemImg && req.files.itemImg.length > 0) {
            savedImage = await uploadToSupabase(req.files.itemImg[0]);
        } else if (body.image) {
            savedImage = body.image;
        }

        let savedPdf = oldData.pdf_path;
        if (req.files && req.files.itemPdf && req.files.itemPdf.length > 0) {
            savedPdf = await uploadToSupabase(req.files.itemPdf[0], 'brochures');
        }

        const sql = `UPDATE items SET 
            item_name = $1, 
            item_code = $2, 
            print_name = $3, 
            item_type = $4, 
            item_group = $5, 
            brand = $6, 
            unit = $7, 
            tax_category = $8, 
            hsn_sac_code = $9, 
            purchase_price = $10, 
            sales_price = $11, 
            mrp = $12, 
            current_stock = $13, 
            packing_dimension = $14, 
            video_link = $15, 
            item_specification = $16, 
            image_path = $17, 
            pdf_path = $18 
        WHERE id = $19`;

        const values = [
            name, code, printName, type, group, brand, unit, taxCategory, hsn,
            purchasePrice, salesPrice, mrp, stock, packing, videoLink, description,
            savedImage, savedPdf, id
        ];

        await db.query(sql, values);
        res.status(200).json({ status: 'Success', message: 'Item updated successfully in the database with all fields!' });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ status: 'Error', message: 'This Item Code is linked to another item.' });
        }
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 4. Delete item (DELETE Item)
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM items WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'Error', message: 'Item not found.' });
        }
        res.status(200).json({ status: 'Success', message: 'Item deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};