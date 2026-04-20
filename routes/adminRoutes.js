const router = require('express').Router();
const ctrl = require('../controllers/adminController');

// router.post('/register', ctrl.register); // Use once, then disable
router.post('/login', ctrl.login);

module.exports = router;