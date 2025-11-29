const express = require("express");
const { addAdmin, getAdmins, deleteAdmin,updateAdmin, updateStatus } = require("../controllers/adminController");
const { protect, isSuperAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, isSuperAdmin, addAdmin);   // Add admin
router.get("/list",protect,isSuperAdmin, getAdmins);  // View all admins
router.post("/status/:id",protect,isSuperAdmin,updateStatus)
router.patch("/update/:id",protect,isSuperAdmin,updateAdmin); //update admin
router.delete("/:id", protect, isSuperAdmin, deleteAdmin); // Delete admin

module.exports = router;