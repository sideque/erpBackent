const router = require('express').Router();
const { ManagementContract } = require('./managementContract.model');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.property) filter.property = req.query.property;
  if (req.query.owner) filter.owners = req.query.owner;
  const r = await paginate(ManagementContract, filter, req.query, {
    populate: [
      { path: 'property', select: 'code name type location' },
      { path: 'owners', select: 'name email phone' },
    ],
  });
  ok(res, r.items, r.meta);
});

router.get('/:id', async (req, res) => {
  const c = await ManagementContract.findById(req.params.id).populate('property').populate('owners', 'name email phone').lean();
  if (!c) throw ApiError.notFound('Contract not found');
  ok(res, c);
});

router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  created(res, await ManagementContract.create(req.body));
});

router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const c = await ManagementContract.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) throw ApiError.notFound('Contract not found');
  ok(res, c);
});

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const c = await ManagementContract.findByIdAndDelete(req.params.id);
  if (!c) throw ApiError.notFound('Contract not found');
  noContent(res);
});

module.exports = router;