const router = require('express').Router();
const { Tenant } = require('./tenant.model');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.q) filter.$or = [
    { name: new RegExp(req.query.q, 'i') },
    { email: new RegExp(req.query.q, 'i') },
    { phone: new RegExp(req.query.q, 'i') },
  ];
  if (req.query.blacklisted) filter.blacklisted = req.query.blacklisted === 'true';
  const r = await paginate(Tenant, filter, req.query);
  ok(res, r.items, r.meta);
});

router.get('/:id', async (req, res) => {
  const t = await Tenant.findById(req.params.id).lean();
  if (!t) throw ApiError.notFound('Tenant not found');
  ok(res, t);
});

router.post('/', requireRole('SUPER_ADMIN', 'MANAGER', 'AGENT'), async (req, res) => {
  created(res, await Tenant.create(req.body));
});

router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER', 'AGENT'), async (req, res) => {
  const t = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!t) throw ApiError.notFound('Tenant not found');
  ok(res, t);
});

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const t = await Tenant.findByIdAndDelete(req.params.id);
  if (!t) throw ApiError.notFound('Tenant not found');
  noContent(res);
});

module.exports = router;