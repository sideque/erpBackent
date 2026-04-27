const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');
const service = require('./property.service');
const { ok, created, noContent } = require('../../shared/utils/response');
const { UPLOAD_ROOT } = require('../../config/paths');
const ApiError = require('../../shared/utils/ApiError');

exports.list = async (req, res) => {
  const r = await service.list(req.query);
  ok(res, r.items, r.meta);
};
exports.get = async (req, res) => ok(res, await service.get(req.params.id));
exports.create = async (req, res) => created(res, await service.create(req.body));
exports.update = async (req, res) => ok(res, await service.update(req.params.id, req.body));
exports.remove = async (req, res) => { await service.remove(req.params.id); noContent(res); };
exports.summary = async (_req, res) => ok(res, await service.summary());

function extForMime(m) {
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  return '.jpg';
}

exports.uploadImage = async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw ApiError.badRequest('Image file is required (form field: image)');
  }
  const ext = extForMime(req.file.mimetype);
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const dir = path.join(UPLOAD_ROOT, 'properties', id);
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, name);
  await fs.writeFile(dest, req.file.buffer);
  const publicPath = `/api/uploads/properties/${id}/${name}`;
  const data = await service.addImageFromUpload(id, publicPath);
  ok(res, data);
};

exports.removeImage = async (req, res) => {
  const { id } = req.params;
  const url = req.body && req.body.url;
  if (!url || typeof url !== 'string') {
    throw ApiError.badRequest('body.url is required (public image path from this API)');
  }
  const data = await service.removeImage(id, url);
  ok(res, data);
};
