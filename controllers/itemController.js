const db = require('../db');

// 1. Get list of all items (GET All Items)
exports.getAllItems = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY id DESC');
        res.status(200).json(rows);
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
        const price = parseFloat(body.price) || 0.00; // Sales Price
        const mrp = parseFloat(body.mrp) || 0.00;
        const packing = body.packing || null;
        const videoLink = body.videoLink || null;
        const description = body.description || null;
        const stock = parseInt(body.stock) || openingStock;

        // Mandatory input validation
        if (!name || !code || !printName) {
            return res.status(400).json({ status: 'Error', message: 'Item Name, Code and Print Name are mandatory.' });
        }

        // Set image path (URL or file upload)
        let savedImage = body.image || ""; 
        if (req.files && req.files.itemImg && req.files.itemImg.length > 0) {
            savedImage = `/uploads/${req.files.itemImg[0].filename}`; 
        }

        // Set PDF Brochure path
        const pdfPath = (req.files && req.files.itemPdf && req.files.itemPdf.length > 0) 
            ? `/uploads/${req.files.itemPdf[0].filename}` 
            : null;

        // Opening stock value calculation
        const stockValue = openingStock * purchasePrice;

        const sql = `INSERT INTO items 
        (id, item_name, item_code, print_name, item_type, item_group, brand, unit, tax_category, hsn_sac_code, opening_stock_qty, opening_stock_value, purchase_price, sales_price, mrp, current_stock, packing_dimension, video_link, item_specification, image_path, pdf_path) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            id, name, code, printName, type, group, brand, unit, taxCategory, hsn, 
            openingStock, stockValue, purchasePrice, price, mrp, stock, 
            packing, videoLink, description, savedImage, pdfPath
        ];

        await db.query(sql, values);
        res.status(201).json({ status: 'Success', message: 'Item saved successfully in the database!' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
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

        // 1. Find existing record
        const [existing] = await db.query('SELECT * FROM items WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Item not found.' });
        }

        const oldData = existing[0];

        // 2. Value mapping for all 21 fields (keep old data if exact data is not received)
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

        // Image handling (New file > New URL string > Old file)
        let savedImage = oldData.image_path;
        if (req.files && req.files.itemImg && req.files.itemImg.length > 0) {
            savedImage = `/uploads/${req.files.itemImg[0].filename}`;
        } else if (body.image) {
            savedImage = body.image;
        }

        // PDF Brochure handling (Update if new PDF file is received)
        let savedPdf = oldData.pdf_path;
        if (req.files && req.files.itemPdf && req.files.itemPdf.length > 0) {
            savedPdf = `/uploads/${req.files.itemPdf[0].filename}`;
        }

        // 3. SQL query to update all 21 columns
        const sql = `UPDATE items SET 
            item_name = ?, 
            item_code = ?, 
            print_name = ?, 
            item_type = ?, 
            item_group = ?, 
            brand = ?, 
            unit = ?, 
            tax_category = ?, 
            hsn_sac_code = ?, 
            purchase_price = ?, 
            sales_price = ?, 
            mrp = ?, 
            current_stock = ?, 
            packing_dimension = ?, 
            video_link = ?, 
            item_specification = ?, 
            image_path = ?, 
            pdf_path = ? 
        WHERE id = ?`;

        const values = [
            name, code, printName, type, group, brand, unit, taxCategory, hsn,
            purchasePrice, salesPrice, mrp, stock, packing, videoLink, description,
            savedImage, savedPdf, id
        ];

        await db.query(sql, values);
        res.status(200).json({ status: 'Success', message: 'Item updated successfully in the database with all fields!' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'Error', message: 'This Item Code is linked to another item.' });
        }
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 4. Delete item (DELETE Item)
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'Error', message: 'Item not found.' });
        }
        res.status(200).json({ status: 'Success', message: 'Item deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};