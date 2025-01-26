import { z } from 'zod';

// Define the base file schema
const fileSchema = z.object({
  url: z.string().optional(),
  id: z.string().optional(),
  file: z.any().optional()
}).optional();

// Define the document schemas
const generalDocumentsSchema = z.object({
  passportCopy: fileSchema,
  passportPhoto: fileSchema,
  bankStatement: fileSchema,
  bankSolvency: fileSchema,
  visitingCard: fileSchema,
  hotelBooking: fileSchema,
  airTicket: fileSchema,
}).optional();

const businessDocumentsSchema = z.object({
  tradeLicense: fileSchema,
  notarizedId: fileSchema,
  memorandum: fileSchema,
  officePad: fileSchema,
}).optional();

const studentDocumentsSchema = z.object({
  studentId: fileSchema,
  travelLetter: fileSchema,
  birthCertificate: fileSchema,
}).optional();

const jobHolderDocumentsSchema = z.object({
  nocCertificate: fileSchema,
  officialId: fileSchema,
  bmdcCertificate: fileSchema,
  barCouncilCertificate: fileSchema,
  retirementCertificate: fileSchema,
}).optional();

const otherDocumentsSchema = z.object({
  marriageCertificate: fileSchema,
}).optional();

// Define the VisaForm schema
export const visaValidationSchema = z.object({
  body: z.object({
    givenName: z.string().min(1, 'Given name is required').optional(),
    surname: z.string().min(1, 'Surname is required').optional(),
    phone: z.string().min(1, 'Phone number is required').optional(),
    email: z.string().email('Invalid email format').optional(),
    address: z.string().min(1, 'Address is required').optional(),
    notes: z.string().optional(),
    visaType: z.enum(['business', 'student', 'jobHolder', 'other', '']).optional(),
  })
});

