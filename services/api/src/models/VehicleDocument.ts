import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleDocumentDoc extends Document {
  vehicleId: mongoose.Types.ObjectId;
  type: 'RC' | 'Insurance' | 'PUC' | 'Permit';
  documentNumber: string;
  fileUrl: string; // Secure/Private URL
  verified: boolean;
  expiryDate?: Date;
  rejectionReason?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleDocumentSchema = new Schema<IVehicleDocumentDoc>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    type: { type: String, enum: ['RC', 'Insurance', 'PUC', 'Permit'], required: true },
    documentNumber: { type: String, required: true },
    fileUrl: { type: String, required: true }, // Controlled access
    verified: { type: Boolean, default: false },
    expiryDate: { type: Date },
    rejectionReason: { type: String },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const VehicleDocumentModel =
  mongoose.models.VehicleDocument ||
  mongoose.model<IVehicleDocumentDoc>('VehicleDocument', VehicleDocumentSchema);
export default VehicleDocumentModel;
