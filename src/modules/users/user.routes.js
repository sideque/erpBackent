const router = require('express').Router();
const { auth, requireRole } = require('../../shared/middleware/auth');
const ctrl = require('./user.controller');

router.use(auth);

router.get('/summary', ctrl.summary);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', requireRole('SUPER_ADMIN'), ctrl.create);
router.patch('/:id', requireRole('SUPER_ADMIN'), ctrl.update);
router.patch('/:id/status', requireRole('SUPER_ADMIN'), ctrl.toggleStatus);
router.delete('/:id', requireRole('SUPER_ADMIN'), ctrl.remove);

module.exports = router;