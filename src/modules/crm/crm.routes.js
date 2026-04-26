const router = require('express').Router();
const { Lead } = require('./lead.model');
const { auth } = require('../../shared/middleware/auth');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.agent) filter.agent = req.query.agent;
  const r = await paginate(Lead, filter, req.query, { populate: { path: 'agent', select: 'name avatar' } });
  ok(res, r.items, r.meta);
});

router.get('/pipeline', async (_req, res) => {
  const stages = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const result = {};
  for (const s of stages) {
    result[s] = await Lead.find({ stage: s }).sort({ updatedAt: -1 }).limit(50).populate('agent', 'name avatar').lean();
  }
  ok(res, result);
});

router.post('/', async (req, res) => created(res, await Lead.create(req.body)));

router.patch('/:id', async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound('Lead not found');
  if (req.body.stage && req.body.stage !== lead.stage) {
    lead.history.push({ stage: req.body.stage, at: new Date(), note: req.body.notes || '' });
  }
  Object.assign(lead, req.body);
  await lead.save();
  ok(res, lead);
});

router.delete('/:id', async (req, res) => {
  const l = await Lead.findByIdAndDelete(req.params.id);
  if (!l) throw ApiError.notFound('Lead not found');
  noContent(res);
});

module.exports = router;