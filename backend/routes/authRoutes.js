const express =require('express');
const router = express.Router();
const {registerSuperAdmin,login} = require('../controllers/authController.js');

router.post('/register-super-admin',registerSuperAdmin);
router.post('/login',login);  

module.exports = router;


