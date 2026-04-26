const router = require('express').Router();
const { auth, requireRole } = require('../../shared/middleware/auth');
const service = require('./owner.service');
const { ok, created, noContent } = require('../../shared/utils/response');

router.use(auth);
router.get('/', async (req, res) => { const r = await service.list(req.query); ok(res, r.items, r.meta); });
router.get('/:id', async (req, res) => ok(res, await service.get(req.params.id)));
router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => created(res, await service.create(req.body)));
router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => ok(res, await service.update(req.params.id, req.body)));
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => { await service.remove(req.params.id); noContent(res); });

module.exports = router;