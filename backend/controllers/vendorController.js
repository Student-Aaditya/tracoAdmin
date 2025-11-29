const db = require("../db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

// ✅ Add Vendor
const addVendor = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!req.user || (req.user.role !== "super_admin" && req.user.role !== "admin")) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!name || !username || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const [existing] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (name, username, password, role, created_by, activeStatus)
      VALUES (?, ?, ?, 'vendor', ?, 'Active')
    `;
    await db.query(sql, [name, username, hashedPassword, req.user.role]);

    res.status(201).json({ message: "Vendor created successfully" });
  } catch (err) {
    console.error("addVendor error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Vendor Login
const vendorlogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });

    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0)
      return res.status(400).json({ message: "Invalid username or password" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid username or password" });

    const token = generateToken(user.id, user.role);
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("vendorlogin error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get All Vendors
const getVendors = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, username, role, activeStatus FROM users WHERE role = 'vendor'"
    );
    res.json(rows);
  } catch (err) {
    console.error("getVendors error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get Single Vendor
const getVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM users WHERE id=? AND role = 'vendor'", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Vendor not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("getVendor error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update Vendor
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ msg: "Vendor not found" });

    let hashedPwd = rows[0].password;
    if (password) hashedPwd = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET name = ?, username = ?, password = ? WHERE id = ?",
      [name, username, hashedPwd, id]
    );

    res.status(200).json({ msg: "Vendor details updated successfully" });
  } catch (err) {
    console.error("updateVendor error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Update Vendor Status (Active / Blocked)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT activeStatus FROM users WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Vendor not found" });

    const current = rows[0].activeStatus;
    const newStatus = current === "Active" ? "Blocked" : "Active";

    await db.query("UPDATE users SET activeStatus = ? WHERE id = ?", [newStatus, id]);
    await db.query("UPDATE vendors_info SET active = ? WHERE user_id = ?", [
      newStatus === "Active" ? 1 : 0,
      id,
    ]);

    res.json({ message: `Vendor status changed to ${newStatus}, newStatus `});
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Add Vendor Info
const addVendorInfo = async (req, res) => {
  try {
    const {
      user_id, category, address, druglicense, gstin, mobile, email, logo,
      website, delivery_time_minutes, delivery_range_km, lat, lng,
      user_discount, company_discount, vendor_offer_user, company_offer_user,
      offer_start_date, offer_end_date, is_verified, active
    } = req.body;

    if (!user_id)
      return res.status(400).json({ message: "user_id is required" });

    const [userRows] = await db.query("SELECT * FROM users WHERE id = ? AND role = 'vendor'", [user_id]);
    if (!userRows.length)
      return res.status(404).json({ message: "Vendor user not found" });

    const [exists] = await db.query("SELECT id FROM vendors_info WHERE user_id = ?", [user_id]);
    if (exists.length > 0)
      return res.status(409).json({ message: "Vendor info already exists" });

    const ref_name = userRows[0].name || null;

    const sql = `
      INSERT INTO vendors_info (
        user_id, ref_name, category, address, druglicense, gstin, mobile, email, logo, website,
        delivery_time_minutes, delivery_range_km, lat, lng,
        user_discount, company_discount, vendor_offer_user, company_offer_user,
        offer_start_date, offer_end_date, is_verified, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      user_id, ref_name, category, address, druglicense, gstin, mobile, email, logo, website,
      delivery_time_minutes, delivery_range_km, lat, lng,
      user_discount, company_discount, vendor_offer_user, company_offer_user,
      offer_start_date, offer_end_date, is_verified ? 1 : 0,
      typeof active === "boolean" ? (active ? 1 : 0) : 1,
    ];

    await db.query(sql, params);
    res.status(201).json({ message: "Vendor info added successfully" });
  } catch (err) {
    console.error("addVendorInfo error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get All Vendor Info (Joined)
const getVendorInfo = async (req, res) => {
  try {
    const sql = `
      SELECT u.id AS user_id, u.name AS user_name, u.username, u.role, v.*
      FROM vendors_info v
      JOIN users u ON v.user_id = u.id
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("getVendorInfo error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update Vendor Info
const updateVendorInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category, address, druglicense, gstin, mobile, email, logo, website,
      delivery_time_minutes, delivery_range_km, lat, lng,
      user_discount, company_discount, vendor_offer_user, company_offer_user,
      offer_start_date, offer_end_date, is_verified, active
    } = req.body;

    const sql = `
      UPDATE vendors_info
      SET category=?, address=?, druglicense=?, gstin=?, mobile=?, email=?, logo=?, website=?,
          delivery_time_minutes=?, delivery_range_km=?, lat=?, lng=?,
          user_discount=?, company_discount=?, vendor_offer_user=?, company_offer_user=?,
          offer_start_date=?, offer_end_date=?, is_verified=?, active=?, updated_at=NOW()
      WHERE user_id=?
    `;

    const [result] = await db.query(sql, [
      category, address, druglicense, gstin, mobile, email, logo, website,
      delivery_time_minutes, delivery_range_km, lat, lng,
      user_discount, company_discount, vendor_offer_user, company_offer_user,
      offer_start_date, offer_end_date, is_verified ? 1 : 0,
      typeof active === "boolean" ? (active ? 1 : 0) : 1,
      id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Vendor info not found" });

    res.json({ message: "Vendor info updated successfully" });
  } catch (err) {
    console.error("updateVendorInfo error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  addVendor,
  vendorlogin,
  getVendors,
  getVendor,
  updateVendor,
  updateStatus,
  addVendorInfo,
  getVendorInfo,
  updateVendorInfo,
};