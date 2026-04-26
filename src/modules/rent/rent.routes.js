const router = require('express').Router();
const service = require('./rent.service');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { ok, created } = require('../../shared/utils/response');

router.use(auth);

router.get('/dashboard', async (_req, res) => ok(res, await service.rentDashboard()));
router.get('/invoices', async (req, res) => { const r = await service.listInvoices(req.query); ok(res, r.items, r.meta); });
router.get('/invoices/:id', async (req, res) => ok(res, await service.getInvoice(req.params.id)));

router.post('/invoices/:id/pay', requireRole('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'), async (req, res) => {
  const result = await service.recordPayment({ invoiceId: req.params.id, ...req.body, recordedBy: req.user.id });
  created(res, result);
});

router.get('/payments', async (req, res) => { const r = await service.listPayments(req.query); ok(res, r.items, r.meta); });

module.exports = router;