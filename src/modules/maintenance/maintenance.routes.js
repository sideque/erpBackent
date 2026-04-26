const router = require('express').Router();
const { MaintenanceTicket } = require('./maintenance.model');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.property) filter.property = req.query.property;
  const r = await paginate(MaintenanceTicket, filter, req.query, {
    populate: [{ path: 'property', select: 'code name' }, { path: 'tenant', select: 'name' }],
  });
  ok(res, r.items, r.meta);
});

router.get('/:id', async (req, res) => {
  const t = await MaintenanceTicket.findById(req.params.id).populate('property').populate('tenant').lean();
  if (!t) throw ApiError.notFound('Ticket not found');
  ok(res, t);
});

router.post('/', async (req, res) => {
  const seq = (await MaintenanceTicket.countDocuments()) + 1;
  const t = await MaintenanceTicket.create({
    ...req.body,
    number: `TKT-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
  });
  created(res, t);
});

router.patch('/:id', async (req, res) => {
  const patch = { ...req.body };
  if (patch.status === 'RESOLVED' || patch.status === 'CLOSED') patch.resolvedAt = new Date();
  const t = await MaintenanceTicket.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!t) throw ApiError.notFound('Ticket not found');
  ok(res, t);
});

router.delete('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const t = await MaintenanceTicket.findByIdAndDelete(req.params.id);
  if (!t) throw ApiError.notFound('Ticket not found');
  noContent(res);
});

module.exports = router;