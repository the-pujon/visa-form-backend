import path from 'path';

export const mockData = {
  "givenName": "Jonyie Eng",
  "surname": "Doe",
  "phone": "+1234567890",
  "email": "jjj@example.com",
  "address": "123 Main St, City",
  "notes": "Primary traveler notes",
  "visaType": "other",
  "subTravelers": [
    {
      "givenName": "Janeeee",
      "surname": "Doe",
      "phone": "+1987654321",
      "email": "jane@example.com",
      "address": "456 Second St, City",
      "notes": "Sub traveler 1 notes",
      "visaType": "other"
    }
  ]
}
export const formData = new FormData();

formData.append('data', JSON.stringify(mockData));


const mockFilePath = path.resolve(__dirname, 'mockFile', 'mock.pdf');

// console.log(mockFilePath);

const primaryTraveler_passportPhoto=mockFilePath
const primaryTraveler_bankStatement=mockFilePath
const primaryTraveler_passportCopy=mockFilePath
const primaryTraveler_bankSolvency=mockFilePath
const primaryTraveler_visitingCard=mockFilePath
const primaryTraveler_hotelBooking=mockFilePath
const primaryTraveler_airTicket=mockFilePath
const primaryTraveler_marriageCertificate=mockFilePath
const subTraveler0_passportCopy=mockFilePath
const subTraveler0_passportPhoto=mockFilePath
const subTraveler0_bankStatement=mockFilePath
const subTraveler0_bankSolvency=mockFilePath
const subTraveler0_visitingCard=mockFilePath
const subTraveler0_hotelBooking=mockFilePath
const subTraveler0_airTicket=mockFilePath
const subTraveler0_marriageCertificate=mockFilePath

formData.append('primaryTraveler_passportPhoto', primaryTraveler_passportPhoto)
formData.append('primaryTraveler_passportPhoto', primaryTraveler_passportCopy)
formData.append('primaryTraveler_bankStatement', primaryTraveler_bankStatement)
formData.append('primaryTraveler_passportCopy', primaryTraveler_passportCopy)
formData.append('primaryTraveler_bankSolvency', primaryTraveler_bankSolvency)
formData.append('primaryTraveler_visitingCard', primaryTraveler_visitingCard)
formData.append('primaryTraveler_hotelBooking', primaryTraveler_hotelBooking)
formData.append('primaryTraveler_airTicket', primaryTraveler_airTicket)
formData.append('primaryTraveler_marriageCertificate', primaryTraveler_marriageCertificate);
formData.append('subTraveler0_passportCopy', subTraveler0_passportCopy)
formData.append('subTraveler0_passportPhoto', subTraveler0_passportPhoto)
formData.append('subTraveler0_bankStatement', subTraveler0_bankStatement)
formData.append('subTraveler0_bankSolvency', subTraveler0_bankSolvency)
formData.append('subTraveler0_visitingCard', subTraveler0_visitingCard)
formData.append('subTraveler0_hotelBooking', subTraveler0_hotelBooking)
formData.append('subTraveler0_airTicket', subTraveler0_airTicket)
formData.append('subTraveler0_marriageCertificate', subTraveler0_marriageCertificate);




const mockFileForService = {
  path: path.resolve(__dirname, 'mockFile', 'mock.pdf'), // Adjust the path as needed
  filename: 'mock.pdf',
  originalname: 'original_mock.pdf', // Change this to match the original filename if needed
};


export const mockProcessFiles = {
  primaryTraveler_passportCopy: [
    mockFileForService
  ],
  primaryTraveler_passportPhoto: [
    mockFileForService
  ],
  primaryTraveler_bankStatement: [
    mockFileForService
  ],
  primaryTraveler_bankSolvency: [
    mockFileForService
  ],
  primaryTraveler_visitingCard: [
    mockFileForService
  ],
  primaryTraveler_hotelBooking: [
    mockFileForService
  ],
  primaryTraveler_airTicket: [
    mockFileForService
  ],
  primaryTraveler_marriageCertificate: [
    mockFileForService
  ],
  subTraveler0_passportCopy: [
    mockFileForService
  ],
  subTraveler0_passportPhoto: [
    mockFileForService
  ],
  subTraveler0_bankStatement: [
    mockFileForService
  ],
  subTraveler0_bankSolvency: [
    mockFileForService
  ],
  subTraveler0_visitingCard: [
    mockFileForService
  ],
  subTraveler0_hotelBooking: [
    mockFileForService
  ],
  subTraveler0_airTicket: [
    mockFileForService
  ],
  subTraveler0_marriageCertificate: [
    mockFileForService
  ]
}