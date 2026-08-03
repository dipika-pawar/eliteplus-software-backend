const db = require('../db');

// १. सर्व आयटम्सची यादी मिळवणे (GET)
exports.getAllItems = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY id DESC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// २. नवीन आयटम मास्टर सेव्ह करणे (POST)
exports.createItem = async (req, res) => {
    try {
        const body = req.body || {};
        
        const id = body.id || Date.now();
        const name = body.name || null;
        const code = body.code || null;
        const printName = body.printName || name; // फ्रंटएंडवरून आलेले स्वतंत्र प्रिंट नेम
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

        // व्हॅलिडेशन
        if (!name || !code || !printName) {
            return res.status(400).json({ status: 'Error', message: 'Item Name, Code आणि Print Name अनिवार्य आहेत.' });
        }

        // इमेज पाथ (URL किंवा Multer द्वारे आलेली फाईल)
        let savedImage = body.image || ""; 
        if (req.files && req.files.itemImg) {
            savedImage = `/uploads/${req.files.itemImg[0].filename}`; 
        }

        // PDF Brochure पाथ
        const pdfPath = req.files && req.files.itemPdf ? `/uploads/${req.files.itemPdf[0].filename}` : null;

        // ओपनिंग स्टॉक व्हॅल्यू कॅल्क्युलेशन
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
        res.status(201).json({ status: 'Success', message: 'आयटम यशस्वीरित्या डेटाबेसमध्ये साठवला गेला!' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'Error', message: 'हा Item Code आधीपासूनच उपलब्ध आहे.' });
        }
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// ३. आयटम मास्टर अपडेट करणे (PUT)
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const [existing] = await db.query('SELECT * FROM items WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'आयटम सापडला नाही.' });
        }

        const name = body.name || existing[0].item_name;
        const code = body.code || existing[0].item_code;
        const printName = body.printName || existing[0].print_name; // अपडेटेड प्रिंट नेम मॅपिंग
        const type = body.type || existing[0].item_type;
        const brand = body.brand || existing[0].brand;
        const group = body.group || existing[0].item_group;
        const taxCategory = body.taxCategory || existing[0].tax_category;
        const hsn = body.hsn || existing[0].hsn_sac_code;
        const price = body.price || existing[0].sales_price;
        const stock = body.stock || existing[0].current_stock;

        let savedImage = existing[0].image_path;
        if (body.image) {
            savedImage = body.image;
        } else if (req.files && req.files.itemImg) {
            savedImage = `/uploads/${req.files.itemImg[0].filename}`;
        }

        const sql = `UPDATE items SET 
        item_name=?, item_code=?, print_name=?, item_type=?, brand=?, item_group=?, tax_category=?, hsn_sac_code=?, sales_price=?, current_stock=?, image_path=? WHERE id=?`;

        const values = [name, code, printName, type, brand, group, taxCategory, hsn, price, stock, savedImage, id];

        await db.query(sql, values);
        res.status(200).json({ status: 'Success', message: 'आयटम यशस्वीरित्या अपडेट झाला!' });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// ४. आयटम मास्टर डिलीट करणे (DELETE)
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'Error', message: 'आयटम सापडला नाही.' });
        }
        res.status(200).json({ status: 'Success', message: 'आयटम यशस्वीरित्या डिलीट केला!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};