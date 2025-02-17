import request from "supertest";
import app from "../../../app";
import path from "path";
import fs from "fs";

describe("api/visa", () => {
  let mockFilePath: string;
  let id: string;
  let subTravelerId: string;

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

  //Delete api test for subTraveler by id
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
