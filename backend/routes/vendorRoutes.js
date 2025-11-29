const express = require("express");
const { addVendor,addVendorInfo,getVendorInfo,updateVendorInfo,getVendors, deleteVendor, vendorlogin,getVendor ,updateVendor,updateStatus} = require("../controllers/vendorController");
const { protect, isSuperAdminorAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post('/vendorlogin', vendorlogin);
router.post("/add", protect, isSuperAdminorAdmin, addVendor);
router.get("/list", protect, isSuperAdminorAdmin, getVendors);  // View all vendors
router.post("/status/:id",protect,isSuperAdminorAdmin,updateStatus);

router.get("/list/:id", protect, isSuperAdminorAdmin, getVendor);  // View one vendor
router.patch("/update/:id",protect,isSuperAdminorAdmin,updateVendor);

router.post("/info", addVendorInfo);
router.get("/info/all", getVendorInfo);
router.put("/info/:id", updateVendorInfo);


module.exports = router;