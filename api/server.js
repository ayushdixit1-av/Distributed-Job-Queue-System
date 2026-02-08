//--------------------------------
//api/server.js
//--------------------------------
// This file is the ENTRY POINT of API server
// I starts the Express app,connects middleware
//loads routes, and esures the jobs table exists
//----------------------------------
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

//import our database connection (so it initializes)
import db from "../db/db.js";

//import table initializer from job model
import {createJobsTable} from "./routes/jobRoutes.js";

//import job routes 
import jobRoutes from "./routes/jobRoutes.js";


// Load all environment variables from the .env file into process.env
// After this line, we can access values like process.env.PORT
dotenv.config();

// -----------------------------------------------------
// Create an Express application instance
// This 'app' object will be used to define routes,
// apply middleware, and start the server.
// -----------------------------------------------------
const app = express();

// -----------------------------------------------------
// Define the port on which the server will run
// -----------------------------------------------------
//
// First, try to read PORT from environment variables:
//   process.env.PORT  -> used in production (cloud/server)
//
// If PORT is not defined in .env or environment,
// fallback to default value 5000 (local development).
//
// So the server will run on:
//   - process.env.PORT in production
//   - 5000 on local machine if not set
// -----------------------------------------------------
const PORT = process.env.PORT || 5000;
//===================================================
// SECTION 1: MIDDLEWARE (Global settings for the API)
//===================================================

/*
------------------------------------------------------
CORS MIDDLEWARE
------------------------------------------------------

CORS = Cross-Origin Resource Sharing

By default, browsers block requests when:
- Frontend runs on one origin (e.g. http://localhost:3000)
- Backend runs on another origin (e.g. http://localhost:5000)

app.use(cors()) tells Express to:
- Allow requests coming from other origins (frontend)
- Prevent browser CORS errors
- Enable communication between frontend and backend
*/
app.use(cors());

/*
------------------------------------------------------
JSON BODY PARSER MIDDLEWARE
------------------------------------------------------

express.json() is built-in Express middleware.

It allows Express to:
- Read incoming request bodies in JSON format
- Convert JSON data into a JavaScript object
- Store that object in req.body

Without this, req.body would be undefined.

Example:
If client sends:
{
  "name": "Job1",
  "status": "pending"
}

Then after this middleware:
req.body = { name: "Job1", status: "pending" }
*/
app.use(express.json());

/*
------------------------------------------------------
CUSTOM LOGGER MIDDLEWARE
------------------------------------------------------

This is a simple custom middleware function that:
- Runs for every incoming request
- Logs the HTTP method (GET, POST, etc.)
- Logs the requested URL (route)

req.method -> HTTP method (GET, POST, PUT, DELETE)
req.url    -> Requested endpoint (e.g. /api/jobs)

next() is very important:
- It tells Express to move to the next middleware or route handler
- If we don't call next(), the request will get stuck here
*/
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

//===================================================
//SECTION 2: ROUTES 
//===================================================
// All job realted endpoints will be handled in jobRoutes.js


//  means:

// - Any request that starts with "/jobs"
//   will be handled by the jobRoutes router.

// Example:
// If client calls:
//   GET  /jobs
//   POST /jobs
//   GET  /jobs/5

// Then Express will:
// - Forward these requests to jobRoutes
// - Instead of handling them directly in this file

// This keeps your main server file clean and organized.
// */
app.use("/jobs", jobRoutes);

/*
------------------------------------------------------
HEALTH CHECK ROUTE
------------------------------------------------------

This is a simple test route to check if the API is running.

When someone visits:
  GET /

The server will respond with a message saying that the API is live.

Uses:
- Testing if server is working
- Checking deployment status
- Simple monitoring endpoint
*/
app.get("/", (req, res) => {
  res.send("🚀 Distributed Job Queue API is running...");
});

//===================================================
//SECTION 3: START SERVER + INIT DB
//===================================================


/*
This function is responsible for starting the server safely.

We make it async because:
- We need to wait for some operations (like database setup)
  before actually starting the Express server.
*/
const startServer = async () => {
  try {
    /*
    Before starting the server, we ensure that the required
    "jobs" table exists in the database.

    - If the table already exists → nothing happens.
    - If it does NOT exist → it will be created.

    This prevents runtime errors when the API tries to
    access the table later.
    */
    await createJobsTable();

    /*
    Start the Express server on the specified PORT.

    app.listen() does two things:
    1. It makes the server start listening for HTTP requests.
    2. It runs the callback function once the server is ready.

    The console.log is just a confirmation message
    so we know the server started successfully.
    */
    app.listen(PORT, () => {
      console.log(`✅ API Server running on port ${PORT}`);
    });

  } catch (error) {
    /*
    If anything fails inside the try block
    (e.g., database connection fails, table creation fails),
    execution jumps here.

    We log the error so we can debug what went wrong.
    */
    console.error("❌ Failed to start server:", error);

    /*
    process.exit(1) means:
    - Stop the Node.js process immediately
    - "1" indicates that the program exited due to an error
      (0 usually means success).
    */
    process.exit(1);
  }
};

/*
Call the function to actually start the server.

Without this line, the server would never start.
*/
startServer();

/*
====================================================================
EXPLANATION OF async / await (IN DETAIL)
====================================================================

-----------------------------
1️⃣ WHAT IS "async"?
-----------------------------

async is a keyword that you put before a function:

  async function example() { }

or

  const example = async () => { };

What async does:

- It automatically makes the function return a Promise.
- Even if you return a normal value, it gets wrapped inside a Promise.

Example:

async function test() {
  return "Hello";
}

Internally, this becomes:

return Promise.resolve("Hello");

So calling:

test();

Actually returns:

Promise { "Hello" }
/*
async function means:
- The function will always return a Promise.

async function test() {
  return "Hello"; 
}

Internally, JavaScript converts this to:
return Promise.resolve("Hello");

So when we call:
test();

It does NOT return "Hello" directly.
Instead, it returns:
Promise { "Hello" }

To get the value, we must use await or .then().


--------------------------------------------------

-----------------------------
2️⃣ WHAT IS "await"?
-----------------------------

await can ONLY be used inside an async function.

await is used to pause execution until a Promise is resolved.

In simple words:
"Wait here until this async task finishes."

Example:

const result = await someAsyncFunction();

Here:
- JavaScript stops at this line
- It waits for someAsyncFunction() to complete
- Once finished, result gets the returned value

--------------------------------------------------

-----------------------------
3️⃣ WHY DO WE NEED async / await?
-----------------------------

Before async/await, we used callbacks or .then():

Example without async/await:

db.query(query)
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.error(err);
  });

This can become messy and hard to read (callback hell).

With async/await, the same logic becomes cleaner:

try {
  const result = await db.query(query);
  console.log(result);
} catch (err) {
  console.error(err);
}

====================================================================
*/
/*
====================================================================
DETAILED EXPLANATION OF try / catch
====================================================================

-----------------------------
1️⃣ WHAT IS try / catch?
-----------------------------

try / catch is used for ERROR HANDLING in JavaScript.

It allows us to:
- Run code that might fail (inside try)
- Handle the error gracefully (inside catch)
- Prevent the entire program from crashing

Basic structure:

try {
  // Code that might throw an error
} catch (error) {
  // Code that runs if an error happens
}

--------------------------------------------------*/
/*
-----------------------------
2️⃣ WHAT DOES "try" DO?
-----------------------------

The try block is where you put code that MIGHT FAIL.

Examples of risky operations:
- Database queries
- API calls
- File reading
- Connecting to Redis
- Parsing JSON

Example:

try {
  const data = JSON.parse(invalidJson);
}

Here, JSON.parse might throw an error, so we wrap it in try.

--------------------------------------------------

-----------------------------
3️⃣ WHAT DOES "catch" DO?
-----------------------------

If ANY error occurs inside try:
- JavaScript immediately stops executing try block
- Jumps to catch block
- Passes the error as an argument

Example:

try {
  JSON.parse("invalid json");
} catch (error) {
  console.error("Something went wrong:", error);
}

The "error" object contains:
- error.message → what went wrong
- error.stack → where it happened

--------------------------------------------------

-----------------------------
4️⃣ FLOW OF EXECUTION (STEP-BY-STEP)
-----------------------------

Example:

try {
  console.log("Step 1");
  throw new Error("Boom 💥");
  console.log("Step 2"); // This will NEVER run
} catch (err) {
  console.log("Caught error:", err.message);
}

Execution:

Step 1 runs
Error occurs → jumps to catch
Step 2 is SKIPPED
Catch block runs

--------------------------------------------------

-----------------------------
5️⃣ WHY DO WE NEED try / catch?
-----------------------------

Without try/catch:

const data = JSON.parse("invalid json"); // CRASH 💥
console.log("Server continues");         // NEVER RUNS

With try/catch:

try {
  JSON.parse("invalid json");
} catch (e) {
  console.error("Invalid JSON");
}
console.log("Server continues"); // STILL RUNS ✅

So try/catch PREVENTS CRASHES.

--------------------------------------------------

-----------------------------
6️⃣ try / catch WITH async / await (VERY IMPORTANT)
-----------------------------

When using await, errors become exceptions, so we use try/catch.

Example:

async function fetchData() {
  try {
    const res = await fetch("https://api.example.com/data");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("API failed:", error);
    return null;
  }
}

Here:
- If fetch fails → jumps to catch
- If JSON parsing fails → jumps to catch
- Function still returns safely

--------------------------------------------------

-----------------------------
7️⃣ REAL-WORLD EXAMPLE (YOUR PROJECT)
-----------------------------

const startServer = async () => {
  try {
    await createJobsTable(); // might fail

    app.listen(PORT, () => {
      console.log("Server started");
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

Meaning:

- try → attempt to create table + start server
- catch → if anything fails, log error and stop program

--------------------------------------------------

-----------------------------
8️⃣ OPTIONAL: finally BLOCK
-----------------------------

You can also add finally:

try {
  // risky code
} catch (err) {
  // handle error
} finally {
  // always runs (success or failure)
}

Example:

try {
  await db.connect();
} catch (e) {
  console.error("DB error");
} finally {
  console.log("Cleanup done");
}

--------------------------------------------------

-----------------------------
9️⃣ ONE-LINE SUMMARY
-----------------------------

try = run risky code  
catch = handle errors safely  
finally = cleanup (optional)

====================================================================
*/
/*
====================================================================
HOW try/catch IS USED WITH (AND "REPLACES") PROMISE CHAINS
====================================================================

IMPORTANT IDEA:
--------------------------------------------------
try / catch does NOT replace async/await.
Instead, it WORKS WITH async/await to handle errors.

What we actually "replace" is:
    .then().catch()   →   async/await + try/catch
--------------------------------------------------

==========================
1️⃣ OLD WAY (Promise style)
==========================

function getData() {
  fetch("https://api.example.com/data")
    .then(res => res.json())
    .then(data => {
      console.log(data);      // success case
    })
    .catch(err => {
      console.error(err);     // error case
    });
}

Problems with this style:
- Hard to read
- Nested callbacks
- Complex error handling

--------------------------------------------------

==========================
2️⃣ NEW WAY (async/await + try/catch)
==========================

async function getData() {
  try {
    const res = await fetch("https://api.example.com/data"); 
    const data = await res.json();  // waits for JSON parsing
    console.log(data);              // success case
  } catch (err) {
    console.error(err);            // error case (same as .catch)
  }
}

How this maps:

.then(res => res.json())   →   await res.json()
.then(data => {...})       →   normal code after await
.catch(err => {...})       →   catch(err)

--------------------------------------------------

==========================
3️⃣ HOW try/catch WORKS WITH await
==========================

Rule:
Whenever an awaited Promise rejects,
JavaScript automatically throws an error
which is caught by catch.

Example:

async function example() {
  try {
    await Promise.reject("Failed");  // Promise fails
    console.log("This will NOT run");
  } catch (error) {
    console.log("Caught:", error);   // runs instead
  }
}

--------------------------------------------------

==========================
4️⃣ REAL EXAMPLE FROM YOUR PROJECT
==========================

Old Promise style:

createJobsTable()
  .then(() => {
    app.listen(PORT, () => console.log("Server started"));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

Replaced with async/await + try/catch:

const startServer = async () => {
  try {
    await createJobsTable();   // replaces .then()
    app.listen(PORT, () => console.log("Server started"));
  } catch (error) {            // replaces .catch()
    console.error(error);
    process.exit(1);
  }
};

--------------------------------------------------

==========================
5️⃣ ONE-LINE MAPPING
==========================

Promise style:
promise.then(...).catch(...)

async/await style:
try { await promise } catch (error) { ... }

====================================================================
*/
