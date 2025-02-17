import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
// import { createClient } from 'redis-mock';
import { config } from 'dotenv';

config({ path: '.env.test' });

let mongo: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // console.log("I came here to test")
  // Setup MongoDB Memory Server
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);

  // Setup Redis Mock
//   global.redisClient = createClient();
});

// Clear data between tests
// beforeEach(async () => {
//   const collections = await mongoose!.connection!.db!.collections();
//   for (let collection of collections) {
//     await collection.deleteMany({});
//   }
// });

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});