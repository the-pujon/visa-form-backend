export interface IFile {
   url: string;
   id: string;
  }
  
  export interface IGeneralDocuments {
    passportCopy: IFile;
    passportPhoto: IFile;
    bankStatement: IFile;
    bankSolvency: IFile;
    visitingCard: IFile;
    hotelBooking: IFile;
    airTicket: IFile;
  }
  
  export interface IBusinessDocuments {
    tradeLicense: IFile;
    notarizedId: IFile;
    memorandum: IFile;
    officePad: IFile;
  }
  
  export interface IStudentDocuments {
    studentId: IFile;
    travelLetter: IFile;
    birthCertificate: IFile;
  }
  
  export interface IJobHolderDocuments {
    nocCertificate: IFile;
    officialId: IFile;
    bmdcCertificate: IFile;
    barCouncilCertificate: IFile;
    retirementCertificate: IFile;
  }
  
  export interface IOtherDocuments {
    marriageCertificate: IFile;
  }
  
  export type VisaType = 'business' | 'student' | 'jobHolder' | 'other' | '';
  
  export interface IVisaForm {
    _id?: string;
    givenName: string;
    surname: string;
    phone: string;
    email: string;
    address: string;
    notes?: string;
    visaType: VisaType;
    generalDocuments: IGeneralDocuments;
    businessDocuments?: IBusinessDocuments;
    studentDocuments?: IStudentDocuments;
    jobHolderDocuments?: IJobHolderDocuments;
    otherDocuments?: IOtherDocuments;
    subTravelers?: IVisaForm[];
  }
  