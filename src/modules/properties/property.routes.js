const router = require('express').Router();
const { auth, requireRole } = require('../../shared/middleware/auth');
const { uploadImageMemory } = require('./property.upload');
const ctrl = require('./property.controller');

router.use(auth);
router.get('/summary', ctrl.summary);
router.get('/', ctrl.list);
router.post(
  '/:id/images',
  requireRole('SUPER_ADMIN', 'MANAGER'),
  uploadImageMemory,
  ctrl.uploadImage
);
router.delete('/:id/images', requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.removeImage);
router.get('/:id', ctrl.get);
router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.create);
router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN'), ctrl.remove);

module.exports = router;
