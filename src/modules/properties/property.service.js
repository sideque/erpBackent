const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { Property } = require('./property.model');
const ApiError = require('../../shared/utils/ApiError');
const { paginate } = require('../../shared/utils/paginate');
const { UPLOAD_ROOT } = require('../../config/paths');

const MAX_PROPERTY_IMAGES = 8;

async function list(query) {
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.status) {
    const s = Array.isArray(query.status) ? query.status : query.status.split(',');
    filter.status = s.length > 1 ? { $in: s } : s[0];
  }
  if (query.q) {
    filter.$or = [
      { name: new RegExp(query.q, 'i') },
      { code: new RegExp(query.q, 'i') },
      { 'location.area': new RegExp(query.q, 'i') },
      { 'location.community': new RegExp(query.q, 'i') },
    ];
  }
  return paginate(Property, filter, query, { populate: { path: 'owners.owner', select: 'name email phone' } });
}

async function get(id) {
  const p = await Property.findById(id).populate('owners.owner', 'name email phone idType idNumber').lean();
  if (!p) throw ApiError.notFound('Property not found');
  return p;
}

function validateOwners(owners) {
  if (!owners || owners.length === 0) return;
  const total = owners.reduce((s, o) => s + Number(o.percentage || 0), 0);
  if (Math.round(total) !== 100) {
    throw ApiError.badRequest('Total ownership percentage must equal 100');
  }
}

async function create(data) {
  validateOwners(data.owners);
  const p = await Property.create(data);
  return get(p._id);
}

async function update(id, patch) {
  if (patch.owners) validateOwners(patch.owners);
  const p = await Property.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!p) throw ApiError.notFound('Property not found');
  return get(p._id);
}

async function remove(id) {
  const p = await Property.findByIdAndDelete(id);
  if (!p) throw ApiError.notFound('Property not found');
  const propDir = path.join(UPLOAD_ROOT, 'properties', String(p._id));
  try {
    await fs.rm(propDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function isValidPropertyObjectId(id) {
  return mongoose.isValidObjectId(id);
}

function publicPathToDisk(propertyId, publicUrl) {
  const prefix = `/api/uploads/properties/${propertyId}/`;
  if (typeof publicUrl !== 'string' || !publicUrl.startsWith(prefix)) {
    return null;
  }
  const rest = publicUrl.slice(prefix.length);
  if (rest.includes('..')) {
    return null;
  }
  return path.join(UPLOAD_ROOT, 'properties', propertyId, path.basename(rest));
}

async function addImageFromUpload(id, publicUrl) {
  if (!isValidPropertyObjectId(id)) {
    throw ApiError.badRequest('Invalid property id');
  }
  const p = await Property.findById(id);
  if (!p) throw ApiError.notFound('Property not found');
  if (p.images && p.images.length >= MAX_PROPERTY_IMAGES) {
    throw ApiError.badRequest(`A property can have at most ${MAX_PROPERTY_IMAGES} images`);
  }
  await Property.findByIdAndUpdate(id, { $push: { images: publicUrl } });
  return get(id);
}

async function removeImage(id, publicUrl) {
  if (!isValidPropertyObjectId(id)) {
    throw ApiError.badRequest('Invalid property id');
  }
  const p = await Property.findById(id);
  if (!p) throw ApiError.notFound('Property not found');
  const list = p.images || [];
  if (!list.includes(publicUrl)) {
    throw ApiError.notFound('Image not found on this property');
  }
  const disk = publicPathToDisk(String(id), publicUrl);
  await Property.findByIdAndUpdate(id, { $pull: { images: publicUrl } });
  if (disk) {
    try {
      await fs.unlink(disk);
    } catch {
      // file already gone
    }
  }
  return get(id);
}

async function summary() {
  const [total, byStatus, byType] = await Promise.all([
    Property.countDocuments(),
    Property.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Property.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
  ]);
  const status = byStatus.reduce((a, x) => ({ ...a, [x._id]: x.count }), {});
  const types = byType.reduce((a, x) => ({ ...a, [x._id]: x.count }), {});
  const occupancy = total ? Math.round(((status.RENTED || 0) / total) * 100) : 0;
  return { total, status, types, occupancy };
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  summary,
  addImageFromUpload,
  removeImage,
  MAX_PROPERTY_IMAGES,
};
