const router = require('express').Router();
const { TenancyContract } = require('./tenancyContract.model');
const { Property } = require('../properties/property.model');
const rentService = require('../rent/rent.service');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.property) filter.property = req.query.property;
  const r = await paginate(TenancyContract, filter, req.query, {
    populate: [
      { path: 'property', select: 'code name location type' },
      { path: 'tenant', select: 'name email phone avatar' },
    ],
  });
  ok(res, r.items, r.meta);
});

router.get('/:id', async (req, res) => {
  const c = await TenancyContract.findById(req.params.id).populate('property').populate('tenant').lean();
  if (!c) throw ApiError.notFound('Contract not found');
  ok(res, c);
});

router.post('/', requireRole('SUPER_ADMIN', 'MANAGER', 'AGENT'), async (req, res) => {
  const { property, startDate, endDate, code } = req.body;
  
  if (new Date(endDate) <= new Date(startDate)) {
    throw ApiError.badRequest('End date must be after start date');
  }

  const activeContract = await TenancyContract.findOne({ property, status: 'ACTIVE' });
  if (activeContract) {
    throw ApiError.badRequest('Property already has an active tenancy contract');
  }

  const contractCode = code || `TC-${Date.now().toString().slice(-6)}`;
  
  const contract = await TenancyContract.create({ ...req.body, code: contractCode, createdBy: req.user.id });
  if (contract.status === 'ACTIVE') {
    await rentService.generateInvoicesForContract(contract);
    await Property.findByIdAndUpdate(contract.property, { status: 'RENTED' });
  }
  created(res, contract);
});

router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const c = await TenancyContract.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) throw ApiError.notFound('Contract not found');
  if (c.status === 'TERMINATED' || c.status === 'EXPIRED' || c.status === 'CANCELLED') {
    await Property.findByIdAndUpdate(c.property, { status: 'AVAILABLE' });
  }
  ok(res, c);
});

router.patch('/:id/status', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { status } = req.body;
  const c = await TenancyContract.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!c) throw ApiError.notFound('Contract not found');
  
  if (status === 'TERMINATED' || status === 'EXPIRED' || status === 'CANCELLED') {
    await Property.findByIdAndUpdate(c.property, { status: 'AVAILABLE' });
  } else if (status === 'ACTIVE') {
    await Property.findByIdAndUpdate(c.property, { status: 'RENTED' });
  }
  
  ok(res, c);
});

router.post('/:id/generate-invoices', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const c = await TenancyContract.findById(req.params.id);
  if (!c) throw ApiError.notFound('Contract not found');
  const count = await rentService.generateInvoicesForContract(c);
  ok(res, { generated: count });
});

router.post('/:id/renew', requireRole('SUPER_ADMIN', 'MANAGER', 'AGENT'), async (req, res) => {
  const oldContract = await TenancyContract.findById(req.params.id);
  if (!oldContract) throw ApiError.notFound('Contract not found');

  const { startDate, endDate, annualRent } = req.body;
  if (new Date(endDate) <= new Date(startDate)) {
    throw ApiError.badRequest('End date must be after start date');
  }

  const contractCode = `TC-${Date.now().toString().slice(-6)}`;

  const newContract = await TenancyContract.create({
    ...oldContract.toObject(),
    _id: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    code: contractCode,
    startDate,
    endDate,
    annualRent: annualRent || oldContract.annualRent,
    status: 'ACTIVE',
    invoicesGenerated: false,
    createdBy: req.user.id
  });

  oldContract.status = 'RENEWED';
  await oldContract.save();

  await rentService.generateInvoicesForContract(newContract);
  await Property.findByIdAndUpdate(newContract.property, { status: 'RENTED' });

  created(res, newContract);
});

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const c = await TenancyContract.findByIdAndDelete(req.params.id);
  if (!c) throw ApiError.notFound('Contract not found');
  noContent(res);
});

module.exports = router;