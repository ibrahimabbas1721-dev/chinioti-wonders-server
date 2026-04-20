const router = require('express').Router();
const ctrl = require('../controllers/productController');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', protect, upload.array('images', 6), ctrl.create);
router.put('/:id', protect, upload.array('images', 6), ctrl.update);
router.delete('/:id', protect, ctrl.delete);

module.exports = router;