const router = require('express').Router()
const ctrl = require('../controllers/videoController')
const protect = require('../middleware/authMiddleware')
const upload = require('../middleware/uploadMiddleware')

router.get('/', ctrl.getAll)
router.post('/', protect, upload.single('thumbnail'), ctrl.create)
router.put('/:id', protect, upload.single('thumbnail'), ctrl.update)
router.delete('/:id', protect, ctrl.delete)

module.exports = router