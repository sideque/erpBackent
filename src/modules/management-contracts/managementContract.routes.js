const router = require('express').Router();
const { ManagementContract } = require('./managementContract.model');
const { Property } = require('../properties/property.model');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

router.use(auth);

// Get all management contracts with filters
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.contractStatus) filter.contractStatus = req.query.contractStatus;
  if (req.query.propertyId) filter.propertyId = req.query.propertyId;
  if (req.query.ownerId) filter.ownerId = req.query.ownerId;

  const r = await paginate(ManagementContract, filter, req.query, {
    populate: [
      { path: 'propertyId', select: 'code name type location status' },
      { path: 'ownerId', select: 'name email phone' },
    ],
  });
  ok(res, r.items, r.meta);
});

// Get single management contract
router.get('/:id', async (req, res) => {
  const c = await ManagementContract.findById(req.params.id)
    .populate('propertyId')
    .populate('ownerId')
    .lean();
  if (!c) throw ApiError.notFound('Management contract not found');
  ok(res, c);
});

// Create management contract
router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { contractStartDate, contractEndDate, ownerSharePercentage, companySharePercentage, propertyId } = req.body;

  // Validations
  if (new Date(contractEndDate) <= new Date(contractStartDate)) {
    throw ApiError.badRequest('End date must be after start date');
  }

  if (Number(ownerSharePercentage) + Number(companySharePercentage) !== 100) {
    throw ApiError.badRequest('Owner share + Company share must equal 100%');
  }

  const contract = await ManagementContract.create({
    ...req.body,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  // Business Logic: If active, update property status
  if (contract.contractStatus === 'Active') {
    await Property.findByIdAndUpdate(propertyId, { status: 'MANAGED' });
  }

  created(res, contract);
});

// Update management contract
router.put('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { ownerSharePercentage, companySharePercentage } = req.body;

  if (ownerSharePercentage && companySharePercentage) {
    if (Number(ownerSharePercentage) + Number(companySharePercentage) !== 100) {
      throw ApiError.badRequest('Owner share + Company share must equal 100%');
    }
  }

  const contract = await ManagementContract.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user.id },
    { new: true }
  );

  if (!contract) throw ApiError.notFound('Contract not found');

  // Business Logic Side Effects
  if (req.body.contractStatus === 'Active') {
    await Property.findByIdAndUpdate(contract.propertyId, { status: 'MANAGED' });
  } else if (['Expired', 'Terminated'].includes(req.body.contractStatus)) {
    await Property.findByIdAndUpdate(contract.propertyId, { status: 'AVAILABLE' });
  }

  ok(res, contract);
});

// Update status specifically
router.patch('/:id/status', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { status } = req.body;
  const contract = await ManagementContract.findByIdAndUpdate(
    req.params.id,
    { contractStatus: status, updatedBy: req.user.id },
    { new: true }
  );

  if (!contract) throw ApiError.notFound('Contract not found');

  // Business Logic Side Effects
  if (status === 'Active') {
    await Property.findByIdAndUpdate(contract.propertyId, { status: 'MANAGED' });
  } else if (['Expired', 'Terminated'].includes(status)) {
    await Property.findByIdAndUpdate(contract.propertyId, { status: 'AVAILABLE' });
  }

  ok(res, contract);
});

// Renew contract
router.post('/:id/renew', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const old = await ManagementContract.findById(req.params.id);
  if (!old) throw ApiError.notFound('Contract not found');

  const { contractStartDate, contractEndDate } = req.body;

  const renewed = await ManagementContract.create({
    ...old.toObject(),
    _id: undefined,
    contractStartDate,
    contractEndDate,
    contractStatus: 'Active',
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  // Mark old as expired
  old.contractStatus = 'Expired';
  await old.save();

  await Property.findByIdAndUpdate(renewed.propertyId, { status: 'MANAGED' });

  created(res, renewed);
});

// Soft delete (or just delete for now as per erp style)
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const c = await ManagementContract.findByIdAndDelete(req.params.id);
  if (!c) throw ApiError.notFound('Contract not found');
  noContent(res);
});

module.exports = router;