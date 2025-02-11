import mongoose, { Schema } from 'mongoose';
import { IVisaForm } from './visa.interface';

// File Schema
const fileSchema = new Schema({
  url: { type: String, required: true },
  id: { type: String, required: true }
});

// General Documents Schema
const generalDocumentsSchema = new Schema({
  passportCopy: { type: fileSchema, required: true },
  passportPhoto: { type: fileSchema, required: true },
  bankStatement: { type: fileSchema, required: true },
  bankSolvency: { type: fileSchema, required: true },
  visitingCard: { type: fileSchema, required: true },
  hotelBooking: { type: fileSchema, required: true },
  airTicket: { type: fileSchema, required: true }
});

// Business Documents Schema
const businessDocumentsSchema = new Schema({
  tradeLicense: { type: fileSchema, required: true },
  notarizedId: { type: fileSchema, required: true },
  memorandum: { type: fileSchema, required: true },
  officePad: { type: fileSchema, required: true }
});

// Student Documents Schema
const studentDocumentsSchema = new Schema({
  studentId: { type: fileSchema, required: true },
  travelLetter: { type: fileSchema, required: true },
  birthCertificate: { type: fileSchema, required: true }
});

// Job Holder Documents Schema
const jobHolderDocumentsSchema = new Schema({
  nocCertificate: { type: fileSchema, required: true },
  officialId: { type: fileSchema, required: true },
  bmdcCertificate: { type: fileSchema, required: true },
  barCouncilCertificate: { type: fileSchema, required: true },
  retirementCertificate: { type: fileSchema, required: true }
});

// Other Documents Schema
const otherDocumentsSchema = new Schema({
  marriageCertificate: { type: fileSchema, required: true }
});

// Subtraveler Schema
const subTravelerSchema = new Schema({
  // This will automatically add _id
}, { 
  timestamps: true,
  strict: false // Allows for flexible additional fields
});

// Main Visa Form Schema
const visaSchema = new Schema<IVisaForm>({
  givenName: { type: String, required: true },
  surname: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  notes: { type: String, required: false },
  visaType: { 
    type: String, 
    required: true,
    enum: ['business', 'student', 'jobHolder', 'other']
  },
  generalDocuments: { type: generalDocumentsSchema, required: true },
  businessDocuments: { type: businessDocumentsSchema, required: false },
  studentDocuments: { type: studentDocumentsSchema, required: false },
  jobHolderDocuments: { type: jobHolderDocumentsSchema, required: false },
  otherDocuments: { type: otherDocumentsSchema, required: false },
  subTravelers: [{ type: subTravelerSchema, required: false }]
}, {
  timestamps: true,
  minimize: true,
});

const VisaModel = mongoose.model<IVisaForm>('Visa', visaSchema);

export default VisaModel;
