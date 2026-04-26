const router = require('express').Router();
const { auth } = require('../../shared/middleware/auth');
const { ok } = require('../../shared/utils/response');
const service = require('./auth.service');

router.post('/login', async (req, res) => {
  const result = await service.login(req.body.email, req.body.password);
  ok(res, result);
});

router.get('/me', auth, async (req, res) => {
  ok(res, await service.me(req.user.id));
});

module.exports = router;