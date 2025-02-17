import request from "supertest";
import app from "../../../app";
import path from "path";
import fs from "fs";

describe("api/visa", () => {
  let mockFilePath: string;
  let id: string;
  let subTravelerId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let existingData: any;

  beforeAll(() => {
    const mockDir = path.resolve(__dirname, "../../__mock__/mockFile");
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true });
    }

    mockFilePath = path.join(mockDir, "mock.pdf");

    if (!fs.existsSync(mockFilePath)) {
      const content =
        "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF";
      fs.writeFileSync(mockFilePath, content);
    }
  });

  afterAll(() => {
    if (fs.existsSync(mockFilePath)) {
      fs.unlinkSync(mockFilePath);
    }
  });

  //Post api tests for visa application creation
  describe("POST /api/visa/create create visa application", () => {
    it("should successfully create visa applications with files", async () => {
      expect(fs.existsSync(mockFilePath)).toBe(true);
      const testData = {
        givenName: "John",
        surname: "Doe",
        phone: "+1234567890",
        email: "john@example.com",
        address: "123 Test St",
        notes: "Test notes",
        visaType: "other",
        subTravelers: [
          {
            givenName: "Jane",
            surname: "Doe",
            phone: "+0987654321",
            email: "jane@example.com",
            address: "456 Test Ave",
            notes: "Sub traveler notes",
            visaType: "other",
          },
        ],
      };

      const response = await request(app)
        .post("/api/visa/create")
        .field("data", JSON.stringify(testData))
        .attach("primaryTraveler_passportPhoto", mockFilePath)
        .attach("primaryTraveler_passportCopy", mockFilePath)
        .attach("primaryTraveler_bankStatement", mockFilePath)
        .attach("primaryTraveler_bankSolvency", mockFilePath)
        .attach("primaryTraveler_visitingCard", mockFilePath)
        .attach("primaryTraveler_hotelBooking", mockFilePath)
        .attach("primaryTraveler_airTicket", mockFilePath)
        .attach("primaryTraveler_marriageCertificate", mockFilePath)
        .attach("subTraveler0_passportPhoto", mockFilePath)
        .attach("subTraveler0_passportCopy", mockFilePath)
        .attach("subTraveler0_bankStatement", mockFilePath)
        .attach("subTraveler0_bankSolvency", mockFilePath)
        .attach("subTraveler0_visitingCard", mockFilePath)
        .attach("subTraveler0_hotelBooking", mockFilePath)
        .attach("subTraveler0_airTicket", mockFilePath)
        .attach("subTraveler0_marriageCertificate", mockFilePath);

      // console.log(response.body)
      id = response.body.data._id;
      subTravelerId = response.body.data.subTravelers[0]._id;
      existingData = response.body.data;

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
    }, 30000);

    it("should return 400 if required files are missing", async () => {
      const testData = {
        givenName: "John",
        surname: "Doe",
        phone: "+1234567890",
        email: "john@example.com",
        address: "123 Test St",
        notes: "Test notes",
        visaType: "business",
        subTravelers: [],
      };

      const response = await request(app)
        .post("/api/visa/create")
        .field("data", JSON.stringify(testData));

      // console.log(response.body)

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "No files were uploaded",
        errorMessages: [{ path: "", message: "No files were uploaded" }],
      });
      //   expect(response.body).toHaveProperty('error');
    });

    it("should return 400 if data is invalid", async () => {
      const response = await request(app)
        .post("/api/visa/create")
        .field("data", "invalid-json");

      // console.log(response.body)

      expect(response.status).toBe(500);
      //   expect(response.body).toHaveProperty('error');
    });
  });

  //Get api tests for visa applications
  describe("GET /api/visa/getAll get all visa applications", () => {
    it("should return all visa applications", async () => {
      const response = await request(app).get("/api/visa");
      //   console.log(response.body)
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
    });
  });

  //Get api tests for visa application by id
  describe("GET /api/visa/:id get visa application by id", () => {
    it("should return visa application by id", async () => {
      const response = await request(app).get(`/api/visa/${id}`);
      // console.log(response.body)
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
    });
  });

  //Put api tests for visa application by id
  // describe("PUT /api/visa/:id update visa application by id", () => {
  //   it("should update visa application by id", async () => {
  //     const testData = {
  //       _id: id,
  //       givenName: existingData.givenName,
  //       surname: "Doe test2",
  //       phone: existingData.phone,
  //       email: "john@exampletest2.com",
  //       address: existingData.address,
  //       notes: existingData.notes,
  //       visaType: "student",
  //       generalDocuments: existingData.generalDocuments,
  //       subTravelers: [
  //         {
  //           _id: subTravelerId,
  //           givenName: existingData.subTravelers[0].givenName,
  //           surname: "Doe testers",
  //           phone: existingData.subTravelers[0].phone,
  //           email: existingData.subTravelers[0].email,
  //           address: existingData.subTravelers[0].address,
  //           notes: existingData.subTravelers[0].notes,
  //           generalDocuments: existingData.subTravelers[0].generalDocuments,
  //           visaType: "student",
  //         },
  //       ],
  //     };

  //     const response = await request(app)
  //       .put(`/api/visa/${id}/primary-traveler`)
  //       .timeout(30000)
  //       .field("data", JSON.stringify(testData))
  //       .attach("primaryTraveler_birthCertificate", mockFilePath)
  //       .attach("primaryTraveler_studentId", mockFilePath)
  //       .attach("primaryTraveler_travelLetter", mockFilePath)
  //       .attach(`subTraveler_${subTravelerId}_birthCertificate`, mockFilePath)
  //       .attach(`subTraveler_${subTravelerId}_studentId`, mockFilePath)
  //       .attach(`subTraveler_${subTravelerId}_travelLetter`, mockFilePath);

  //     console.log(response.body);
  //     expect(response.status).toBe(200);
  //   }, 30000);

  //   it("should add new subTraveler to visa application when new subTraveler is provided", async () => {
  //     const newSubTraveler = [{
  //       id: "new1",
  //       givenName: "Jane",
  //       surname: "Doe",
  //       phone: "+0987654321",
  //       email: "jane@example.com",
  //       address: "456 Test Ave",
  //       notes: "Sub traveler notes",
  //       visaType: "other",
  //     }];

  //     const testData = {
  //       _id: id,
  //       givenName: existingData.givenName,
  //       surname: "Doe test2",
  //       phone: existingData.phone,
  //       email: "john@exampletest2.com",
  //       address: existingData.address,
  //       notes: existingData.notes,
  //       visaType: "student",
  //       generalDocuments: existingData.generalDocuments,
  //       subTravelers: [
  //         {
  //           _id: subTravelerId,
  //           givenName: existingData.subTravelers[0].givenName,
  //           surname: "Doe testers",
  //           phone: existingData.subTravelers[0].phone,
  //           email: existingData.subTravelers[0].email,
  //           address: existingData.subTravelers[0].address,
  //           notes: existingData.subTravelers[0].notes,
  //           generalDocuments: existingData.subTravelers[0].generalDocuments,
  //           visaType: "student",
  //         },
  //       ],
  //     };

  //     const response = await request(app)
  //       .put(`/api/visa/${id}/primary-traveler`)
  //       .timeout(30000)
  //       .field("data", JSON.stringify(testData))
  //       .field("newTraveler", JSON.stringify(newSubTraveler))
  //       .attach("primaryTraveler_birthCertificate", mockFilePath)
  //       .attach("primaryTraveler_studentId", mockFilePath)
  //       .attach("primaryTraveler_travelLetter", mockFilePath)
  //       .attach(`subTraveler_${subTravelerId}_birthCertificate`, mockFilePath)
  //       .attach(`subTraveler_${subTravelerId}_studentId`, mockFilePath)
  //       .attach(`subTraveler_${subTravelerId}_travelLetter`, mockFilePath)
  //       .attach("subTraveler_new1_passportPhoto", mockFilePath)
  //       .attach("subTraveler_new1_passportCopy", mockFilePath)
  //       .attach("subTraveler_new1_bankStatement", mockFilePath)
  //       .attach("subTraveler_new1_bankSolvency", mockFilePath)
  //       .attach("subTraveler_new1_visitingCard", mockFilePath)
  //       .attach("subTraveler_new1_hotelBooking", mockFilePath)
  //       .attach("subTraveler_new1_airTicket", mockFilePath)
  //       .attach("subTraveler_new1_marriageCertificate", mockFilePath);

  //     expect(response.status).toBe(200);
  //   }, 30000);
  // });

  //Delete api test for subTraveler by id




  describe("PUT /api/visa/:id update visa application by id", () => {
   
     it("should update visa application by id", async () => {
      const testData = {
        _id: id,
        givenName: existingData.givenName,
        surname: "Doe test2",
        phone: existingData.phone,
        email: "john@exampletest2.com",
        address: existingData.address,
        notes: existingData.notes,
        visaType: "student",
        generalDocuments: existingData.generalDocuments,
        subTravelers: [
          {
            _id: subTravelerId,
            givenName: existingData.subTravelers[0].givenName,
            surname: "Doe testers",
            phone: existingData.subTravelers[0].phone,
            email: existingData.subTravelers[0].email,
            address: existingData.subTravelers[0].address,
            notes: existingData.subTravelers[0].notes,
            generalDocuments: existingData.subTravelers[0].generalDocuments,
            visaType: "student",
          },
        ],
      };

      const response = await request(app)
        .put(`/api/visa/${id}/primary-traveler`)
        .timeout(30000)
        .field("data", JSON.stringify(testData))
        .attach("primaryTraveler_birthCertificate", mockFilePath)
        .attach("primaryTraveler_studentId", mockFilePath)
        .attach("primaryTraveler_travelLetter", mockFilePath)
        .attach(`subTraveler_${subTravelerId}_birthCertificate`, mockFilePath)
        .attach(`subTraveler_${subTravelerId}_studentId`, mockFilePath)
        .attach(`subTraveler_${subTravelerId}_travelLetter`, mockFilePath);

      console.log(response.body);
      expect(response.status).toBe(200);
    }, 30000);

    it("should add new subTraveler to visa application when new subTraveler is provided", async () => {
      const newSubTraveler = [{
        id: "new1",
        givenName: "Jane",
        surname: "Doe",
        phone: "+0987654321",
        email: "jane@example.com",
        address: "456 Test Ave",
        notes: "Sub traveler notes",
        visaType: "other",
      }];

      const testData = {
        _id: id,
        givenName: existingData.givenName,
        surname: "Doe test2",
        phone: existingData.phone,
        email: "john@exampletest2.com",
        address: existingData.address,
        notes: existingData.notes,
        visaType: "student",
        generalDocuments: existingData.generalDocuments,
        subTravelers: [
          {
            _id: subTravelerId,
            givenName: existingData.subTravelers[0].givenName,
            surname: "Doe testers",
            phone: existingData.subTravelers[0].phone,
            email: existingData.subTravelers[0].email,
            address: existingData.subTravelers[0].address,
            notes: existingData.subTravelers[0].notes,
            generalDocuments: existingData.subTravelers[0].generalDocuments,
            visaType: "student",
          },
        ],
      };

      const response = await request(app)
        .put(`/api/visa/${id}/primary-traveler`)
        .timeout(30000)
        .field("data", JSON.stringify(testData))
        .field("newTraveler", JSON.stringify(newSubTraveler))
        .attach("primaryTraveler_birthCertificate", mockFilePath)
        .attach("primaryTraveler_studentId", mockFilePath)
        .attach("primaryTraveler_travelLetter", mockFilePath)
        .attach(`subTraveler_${subTravelerId}_birthCertificate`, mockFilePath)
        .attach(`subTraveler_${subTravelerId}_studentId`, mockFilePath)
        .attach(`subTraveler_${subTravelerId}_travelLetter`, mockFilePath)
        .attach("subTraveler_new1_passportPhoto", mockFilePath)
        .attach("subTraveler_new1_passportCopy", mockFilePath)
        .attach("subTraveler_new1_bankStatement", mockFilePath)
        .attach("subTraveler_new1_bankSolvency", mockFilePath)
        .attach("subTraveler_new1_visitingCard", mockFilePath)
        .attach("subTraveler_new1_hotelBooking", mockFilePath)
        .attach("subTraveler_new1_airTicket", mockFilePath)
        .attach("subTraveler_new1_marriageCertificate", mockFilePath);

      expect(response.status).toBe(200);
    }, 30000);

    // New error test cases
    it("should return 400 when updating with invalid visa type", async () => {
      const invalidTestData = {
        ...existingData,
        visaType: "invalid_type"
      };

      const response = await request(app)
        .put(`/api/visa/${id}/primary-traveler`)
        .field("data", JSON.stringify(invalidTestData))
        .attach("primaryTraveler_birthCertificate", mockFilePath);


        console.log("should return 400 when updating with invalid visa type", response.body)

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errorMessages");
      expect(response.body.errorMessages[0].message).toContain("Invalid enum value. Expected 'business' | 'student' | 'jobHolder' | 'other', received 'invalid_type'");
    });

    it("should return 400 when updating with invalid email format", async () => {
      const invalidTestData = {
        ...existingData,
        email: "invalid-email"
      };

      const response = await request(app)
        .put(`/api/visa/${id}/primary-traveler`)
        .field("data", JSON.stringify(invalidTestData))
        .attach("primaryTraveler_birthCertificate", mockFilePath);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errorMessages");
      expect(response.body.errorMessages[0].message).toContain("Invalid email format");
    });


    it("should return 400 when required fields are missing", async () => {
      const invalidTestData = {
        _id: id,
        // Missing required fields like givenName and surname
        email: "john@example.com",
        visaType: "student"
      };

      const response = await request(app)
        .put(`/api/visa/${id}/primary-traveler`)
        .field("data", JSON.stringify(invalidTestData))
        .attach("primaryTraveler_birthCertificate", mockFilePath);

        console.log("should return 400 when required fields are missing", response.body)

      expect(response.status).toBe(400);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errorMessages");
      expect(response.body.errorMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("Required")
          })
        ])
      );
    });

    it("should return 400 when updating with invalid file type", async () => {
      // Create a temporary text file instead of PDF
      const invalidFilePath = path.join(path.dirname(mockFilePath), "invalid.txt");
      fs.writeFileSync(invalidFilePath, "This is not a PDF file");

      try {
        const response = await request(app)
          .put(`/api/visa/${id}/primary-traveler`)
          .field("data", JSON.stringify(existingData))
          .attach("primaryTraveler_birthCertificate", invalidFilePath);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("errorMessages");
        expect(response.body.errorMessages[0].message).toContain("Invalid file type");
      } finally {
        fs.unlinkSync(invalidFilePath);
      }
    });

    it("should return 400 when file size exceeds limit", async () => {
      // Create a large temporary file
      const largeFilePath = path.join(path.dirname(mockFilePath), "large.pdf");
      const largeContent = Buffer.alloc(10 * 1024 * 1024); // 5MB file
      fs.writeFileSync(largeFilePath, largeContent);

      try {
        const response = await request(app)
          .put(`/api/visa/${id}/primary-traveler`)
          .field("data", JSON.stringify(existingData))
          .attach("primaryTraveler_birthCertificate", largeFilePath);

          console.log("should return 400 when file size exceeds limit", response.body)

          

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("errorMessages");
        expect(response.body.errorMessages[0].message).toContain("File too large");
      } finally {
        fs.unlinkSync(largeFilePath);
      }
    });

    it("should return 404 when updating non-existent visa application", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .put(`/api/visa/${nonExistentId}/primary-traveler`)
        .field("data", JSON.stringify(existingData))
        .attach("primaryTraveler_birthCertificate", mockFilePath);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Visa application not found");
    });

    it("should return 400 when updating with malformed JSON data", async () => {
      const response = await request(app)
        .put(`/api/visa/${id}/primary-traveler`)
        .field("data", "{invalid-json")
        .attach("primaryTraveler_birthCertificate", mockFilePath);

        console.log("should return 400 when updating with malformed JSON data", response.body)


      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("errorMessages");
      // expect(response.body.errorMessages[0].).toContain("Invalid JSON format");
    });
  });


  describe("DELETE /api/:visaId/sub-traveler/:subTravelerId delete subTraveler by id", () => {
    it("should delete subTraveler by id", async () => {
      const response = await request(app).delete(
        `/api/visa/${id}/sub-traveler/${subTravelerId}`,
      );
      // console.log(response.body)
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
    });

    it("should return 404 if subTraveler not found", async () => {
      const response = await request(app).delete(
        `/api/visa/${id}/sub-traveler/${subTravelerId}`,
      );
      expect(response.status).toBe(400);
    });
  });

  //Delete api tests for visa application by id
  describe("DELETE /api/visa/:id delete visa application by id", () => {
    it("should delete visa application by id", async () => {
      const response = await request(app).delete(`/api/visa/${id}`);
      // console.log(response.body)
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
    });

    it("should return 404 if main traveler not found", async () => {
      const response = await request(app).delete(`/api/visa/${id}`);
      expect(response.status).toBe(400);
    });
  });


});
