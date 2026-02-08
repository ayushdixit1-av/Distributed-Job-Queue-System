// =====================================================
// api/redisClient.js
// =====================================================
// This file is responsible for connecting our application to Redis.
// Redis will act as our job queue in this distributed job system.
// =====================================================

// This file is responsible for connecting our application to Redis.
//
// ---------------- What is Redis? ----------------
//
// Redis = Remote Dictionary Server.
// It is an in-memory data store (database) that stores data in RAM,
// which makes it extremely fast compared to normal databases like PostgreSQL or MongoDB.
//
// In simple words:
// Redis is like a super-fast temporary memory for your application.
//
// ---------------- Why are we using Redis here? ----------------
//
// In our system, Redis will act as a "job queue".
//
// A job queue means:
// - One service can add jobs to Redis (Producer)
// - Another service can read and process jobs from Redis (Consumer)
//
// This is very useful in distributed systems where different services
// work independently but need to communicate through a shared queue.
//
// ---------------- Example of how Redis helps ----------------
//
// Example:
// 1. API receives a request to send an email.
// 2. Instead of sending it immediately, we PUSH this job into Redis.
// 3. A worker service later POPS the job from Redis and sends the email.
//
// This makes the system:
// - Faster (API doesn't wait for email to send)
// - More reliable (jobs can be retried if something fails)
// - Scalable (multiple workers can process jobs in parallel)
//
// -----------------------------------------------------
//
// Redis will act as our job queue in this distributed job system.
// =====================================================
//Import createCLient Function from the redis package
import {createClient} from 'redis';

//Import dotenv to load environment variables from a .env file
//This helps us to keep sesitive data (like Redis URL) secure
import dotenv from 'dotenv';

//Load all vairables from the .env file into process.env
//After this line, we can access variables like process.env.REDIS_URL
dotenv.config();
// =====================================================
// SECTION 1: CREATE REDIS CLIENT
// =====================================================
// PURPOSE:
// - Creates a connection to the Redis server.
// - Uses REDIS_URL from .env file for security.
// - Example:
//   REDIS_URL=redis://localhost:6379
// =====================================================
//createCLient() creates a new Redis connection object;
//We pass configuration inside an object{}

const redisClient = createClient({
    //url tells redis where to connect.
    //-----------------------------------
    //First try: process.env.REDIS_URL
    //- This reads the Redis URL from your .env file(recommended for production)
    //
    //If REDIS_URL is NOT defined in .env, then fallback to :
    //"redis://Localhost:6379"(default local Redis sever)
    //
    //6379 is the default Redis port 
    url: process.env.REDIS_URL || "redis://localhost:6379",
});
// --------------------------------------------------
// SECTION 2: HANDLE CONNECTION EVENTS
// --------------------------------------------------
// This event is triggered when the client successfully connects to Redis
redisClient.on("connect",()=>{
    //Log a success message so we know Redis is working 
    console.log("Connected to redis successfully");
})
//This event is triggered if something goes wrong while 
//connecting to Redis (wrong URL, server down, nertwork issues, etc.)
redisClient.on("error",(err)=>{
    //Log the error so we debug the problem
    console.error("Redis connection error:",err);
});
//----------------------------------------
//SECTION 3: CONNECT REDIS CLIENT
//----------------------------------------
//We expliciltely call connect() because redis v4 requires it.
//This make client ready to use 
await redisClient.connect();
//enstablish a connection to the Redis server.
//'await' means : wait untill the connection is fully established 
//before moving to the next line of code 
// if Redis is not available, this line will throw an error

// --------------------------------------------------
// SECTION 4: EXPORT REDIS CLIENT
// --------------------------------------------------
// Other files will use this client to:
// - Push jobs into queue (API)
// - Pull jobs from queue (Worker)
//Make redisClient available to other files in the project
//Any file that needs to use Redis can now import this client
export default redisClient;