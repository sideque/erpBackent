const mongoose = require('mongoose');

const managementContractSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true, index: true },

    contractStartDate: { type: Date, required: true },
    contractEndDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: false },

    contractStatus: {
      type: String,
      enum: ['Active', 'Expired', 'Terminated', 'Pending'],
      default: 'Pending',
      index: true,
    },

    // Financial Terms
    commissionType: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
    commissionValue: { type: Number, required: true, min: 0 },
    ownerSharePercentage: { type: Number, required: true, min: 0, max: 100 },
    companySharePercentage: { type: Number, required: true, min: 0, max: 100 },
    paymentCycle: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' },

    // Expense Rules
    expenseResponsibility: { type: String, enum: ['Owner', 'Company', 'Shared'], default: 'Owner' },
    expenseApprovalRequired: { type: Boolean, default: true },
    expenseLimit: { type: Number, default: 0 },

    // Management Permissions
    canCollectRent: { type: Boolean, default: true },
    canManageTenants: { type: Boolean, default: true },
    canHandleMaintenance: { type: Boolean, default: true },
    canListProperty: { type: Boolean, default: true },

    // Documents
    contractFileUrl: { type: String },
    additionalDocuments: [{ type: String }],

    // Audit Fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const ManagementContract = mongoose.model('ManagementContract', managementContractSchema);
module.exports = { ManagementContract };
