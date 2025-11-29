const express=require("express");
const router=express.Router();
const medicineController=require("../controllers/medicineController.js");
const upload=require("../Services/cloudinary.js");

router.post("/addmedicine",upload.array("images",5),medicineController.addMedicine);
router.get("/getMedicine/:id",medicineController.getMedicine);
router.get("/getRelavantDtaMedicine/:id",medicineController.getRelavantDtaMedicine);
router.delete("/deleteMdecine/:id",medicineController.deleteMedicine);
router.post("/bucket",upload.single("images"),medicineController.addbucket)
router.get("/bucket/list",medicineController.getAllBucket);

module.exports=router;