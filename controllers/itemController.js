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

// 1. Get list of all items (GET All Items)
exports.getAllItems = async (req, res) => {
    try {
        const { data, error } = await db
            .from('items')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
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

        const bucketName = process.env.ITEM_BUCKET || 'item-files';

        // Set image path (URL or Supabase file upload)
        let savedImage = body.image || ""; 
        if (req.files && req.files.itemImg && req.files.itemImg.length > 0) {
            savedImage = await uploadFileToSupabase(req.files.itemImg[0], bucketName); 
        }

        // Set PDF Brochure path (Supabase file upload)
        const pdfPath = (req.files && req.files.itemPdf && req.files.itemPdf.length > 0) 
            ? await uploadFileToSupabase(req.files.itemPdf[0], bucketName) 
            : null;

        // Opening stock value calculation
        const stockValue = openingStock * purchasePrice;

        const { data, error: dbError } = await db
            .from('items')
            .insert([{
                id: id.toString(),
                item_name: name,
                item_code: code,
                print_name: printName,
                item_type: type,
                item_group: group,
                brand: brand,
                unit: unit,
                tax_category: taxCategory,
                hsn_sac_code: hsn,
                opening_stock_qty: openingStock,
                opening_stock_value: stockValue,
                purchase_price: purchasePrice,
                sales_price: price,
                mrp: mrp,
                current_stock: stock,
                packing_dimension: packing,
                video_link: videoLink,
                item_specification: description,
                image_path: savedImage,
                pdf_path: pdfPath
            }])
            .select();

        if (dbError) {
            if (dbError.code === '23505') { // Supabase/PostgreSQL unique constraint violation code
                return res.status(400).json({ status: 'Error', message: 'This Item Code is already available.' });
            }
            throw dbError;
        }

        res.status(201).json({ status: 'Success', message: 'Item saved successfully in the database!', data: data[0] });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 3. Update item master (PUT Update Item)
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        // 1. Find existing record
        const { data: existing, error: fetchError } = await db
            .from('items')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ status: 'Error', message: 'Item not found.' });
        }

        const oldData = existing;

        // 2. Value mapping for all fields
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

        const bucketName = process.env.ITEM_BUCKET || 'item-files';

        // Image handling (New file > New URL string > Old file)
        let savedImage = oldData.image_path;
        if (req.files && req.files.itemImg && req.files.itemImg.length > 0) {
            savedImage = await uploadFileToSupabase(req.files.itemImg[0], bucketName);
        } else if (body.image) {
            savedImage = body.image;
        }

        // PDF Brochure handling (Update if new PDF file is received)
        let savedPdf = oldData.pdf_path;
        if (req.files && req.files.itemPdf && req.files.itemPdf.length > 0) {
            savedPdf = await uploadFileToSupabase(req.files.itemPdf[0], bucketName);
        }

        // 3. Supabase update query
        const { error: updateError } = await db
            .from('items')
            .update({
                item_name: name,
                item_code: code,
                print_name: printName,
                item_type: type,
                item_group: group,
                brand: brand,
                unit: unit,
                tax_category: taxCategory,
                hsn_sac_code: hsn,
                purchase_price: purchasePrice,
                sales_price: salesPrice,
                mrp: mrp,
                current_stock: stock,
                packing_dimension: packing,
                video_link: videoLink,
                item_specification: description,
                image_path: savedImage,
                pdf_path: savedPdf
            })
            .eq('id', id);

        if (updateError) {
            if (updateError.code === '23505') {
                return res.status(400).json({ status: 'Error', message: 'This Item Code is linked to another item.' });
            }
            throw updateError;
        }

        res.status(200).json({ status: 'Success', message: 'Item updated successfully in the database with all fields!' });

    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};

// 4. Delete item (DELETE Item)
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: record, error: fetchError } = await db
            .from('items')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return res.status(404).json({ status: 'Error', message: 'Item not found.' });
        }

        const { error: dbError } = await db
            .from('items')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        res.status(200).json({ status: 'Success', message: 'Item deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
};