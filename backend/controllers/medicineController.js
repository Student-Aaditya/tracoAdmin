const con = require("../db");

const medicineController = {

    /* ---------------------- ADD BUCKET ---------------------- */
    addbucket: async (req, res) => {
        try {
            const { bucket_name, created_by, createdAt, capacity, number_medicines } = req.body;

            const imageUrls = req.files?.map(file => file.path) || [];

            const sql = `
                INSERT INTO BUCKET (name, image, created_by, createdAt, capacity, number_medicines)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const values = [
                bucket_name,
                JSON.stringify(imageUrls),
                created_by,
                createdAt,
                capacity,
                number_medicines
            ];

            const [result] = await con.query(sql, values);

            return res.status(201).json({
                msg: "Bucket added successfully",
                images: imageUrls,
                bucketId: result.insertId
            });

        } catch (err) {
            console.error("Add Bucket Error:", err);
            res.status(500).json({ msg: err.message });
        }
    },

    /* ---------------------- GET ALL BUCKETS ---------------------- */
    getAllBucket: async (req, res) => {
        try {
            const [rows] = await con.query("SELECT * FROM BUCKET");
            res.json(rows);
        } catch (err) {
            console.error("Get Buckets Error:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    },

    /* ---------------------- ADD MEDICINE ---------------------- */
    addMedicine: async (req, res) => {
        try {
            const {
                bucket_id, name, salt_composition, manufacturers, medicine_type,
                packaging, packaging_typ, mrp, cost_price, discount_percent,
                selling_price, offers_percent, prescription_required,
                storage, country_of_origin, manufacture_address,
                best_price, brought
            } = req.body;

            if (!bucket_id || !name) {
                return res.status(400).json({
                    message: "Bucket ID and Medicine Name are required"
                });
            }

            const filesArray = Array.isArray(req.files) ? req.files : [];
            const imageUrls = filesArray.map(f => f.path);

            const prescriptionValue =
                prescription_required == "1" ||
                prescription_required === 1 ||
                prescription_required === true ||
                prescription_required === "true"
                    ? 1 : 0;

            const sql = `
                INSERT INTO medicine (
                    bucket_id, name, salt_composition, manufacturers, medicine_type,
                    packaging, packaging_typ, mrp, cost_price, discount_percent,
                    selling_price, offers_percent, prescription_required,
                    storage, country_of_origin, manufacture_address,
                    best_price, brought, image
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                bucket_id,
                name,
                salt_composition,
                manufacturers,
                medicine_type,
                packaging,
                packaging_typ,
                mrp,
                cost_price,
                discount_percent,
                selling_price,
                offers_percent,
                prescriptionValue,
                storage,
                country_of_origin,
                manufacture_address,
                best_price,
                brought,
                JSON.stringify(imageUrls)
            ];

            const [result] = await con.query(sql, values);

            return res.status(201).json({
                msg: "Medicine added successfully",
                images: imageUrls,
                medicineId: result.insertId
            });

        } catch (err) {
            console.error("Add Medicine Error:", err);
            res.status(500).json({ msg: err.message });
        }
    },

    /* ---------------------- GET MEDICINES BY BUCKET ---------------------- */
    getRelavantDtaMedicine: async (req, res) => {
        try {
            const { id } = req.params;

            const sql = `
                SELECT id, bucket_id, name, salt_composition, manufacturers,
                packaging, mrp, discount_percent, selling_price
                FROM medicine
                WHERE bucket_id = ?
            `;

            const [rows] = await con.query(sql, [id]);

            res.json(rows);

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Server error" });
        }
    },

    /* ---------------------- GET SINGLE MEDICINE ---------------------- */
    getMedicine: async (req, res) => {
        try {
            const { id } = req.params;

            const sql = "SELECT * FROM medicine WHERE id = ?";

            const [rows] = await con.query(sql, [id]);

            if (!rows.length) {
                return res.status(404).json({ msg: "Medicine not found" });
            }

            const item = rows[0];

            // Fix image JSON parsing
            let images = [];
            try {
                images = item.image ? JSON.parse(item.image) : [];
            } catch {
                images = [item.image];
            }

            return res.json({ ...item, images });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Server error" });
        }
    },

    /* ---------------------- DELETE MEDICINE ---------------------- */
    deleteMedicine: async (req, res) => {
        try {
            const { id } = req.params;

            const [result] = await con.query("DELETE FROM medicine WHERE id = ?", [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Medicine not found" });
            }

            res.json({ message: "Medicine deleted successfully" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Server error" });
        }
    }

};

module.exports = medicineController;
