import { Document } from 'mongoose';

export interface IFile {
   url: string;
   id: string;
}
  
export interface IGeneralDocuments extends Document {
  passportCopy: IFile;
  passportPhoto: IFile;
  bankStatement: IFile;
  bankSolvency: IFile;
  visitingCard: IFile;
  hotelBooking: IFile;
  airTicket: IFile;
}
  
export interface IBusinessDocuments extends Document {
  tradeLicense: IFile;
  notarizedId: IFile;
  memorandum: IFile;
  officePad: IFile;
}
  
export interface IStudentDocuments extends Document {
  studentId: IFile;
  travelLetter: IFile;
  birthCertificate: IFile;
}
  
export interface IJobHolderDocuments extends Document {
  nocCertificate: IFile;
  officialId: IFile;
  bmdcCertificate: IFile;
  barCouncilCertificate: IFile;
  retirementCertificate: IFile;
}
  
export interface IOtherDocuments extends Document {
  marriageCertificate: IFile;
}
  
export interface IVisaForm extends Document {
    // _id?: string;
    givenName: string;
    surname: string;
    phone: string;
    email: string;
    address: string;
    notes?: string;
    visaType: 'business' | 'student' | 'jobHolder' | 'other' | '';
    generalDocuments: IGeneralDocuments;
    businessDocuments?: IBusinessDocuments;
    studentDocuments?: IStudentDocuments;
    jobHolderDocuments?: IJobHolderDocuments;
    otherDocuments?: IOtherDocuments;
    subTravelers?: IVisaForm[];
}