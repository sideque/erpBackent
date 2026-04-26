const router = require('express').Router();
const { auth, requireRole } = require('../../shared/middleware/auth');
const ctrl = require('./property.controller');

router.use(auth);
router.get('/summary', ctrl.summary);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.create);
router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN'), ctrl.remove);

module.exports = router;