//What api/models/Job.js will do (in points)

//This file will:

//Define the Job table structure

//What columns your jobs table will have.

//Create the table in PostgreSQL (if not exists)

//So you don’t have to manually create it every time.

//Provide helper functions like:

//createJob()

//getJobById()

//updateJobStatus()

//Act as a bridge between  app and database for job-related operations.
//Job table should contain 

// jobs table will have fields like:

//Column	Purpose
//id	unique job id
//type	email / image / report
//payload	job data (JSON)
//status	pending / processing / completed / failed
//created_at	when job was created
//updated_at	when job was last updated
// =========================================
// api/models/Job.js
// =========================================
// import = bring code from another file into this file  

// db = the name we are giving to the imported module (can be anything)  

// "../../db/db.js" = relative path where your database file exists  

// Meaning: we are using the same database connection (pool) from db.js here  
// ".." = go one folder up from the current file  
// "../.." = go two folders up  
// "db/db.js" = then go into the 'db' folder and use the file 'db.js'  

// So "../../db/db.js" = move up two levels, then open db/db.js  
import db from "../../db/db.js";
// --------------------------------------------------
// CREATE JOBS TABLE (IF NOT EXISTS)
// --------------------------------------------------
// PURPOSE:
// - This section ensures that the required "jobs" table exists in PostgreSQL.
// - If the table is missing, this function will create it automatically.
// - This prevents runtime errors when the app starts with a fresh database.
// =====================================================
export const createJobsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

// export = make this function available to other files  

// const createJobsTable = async () => { } = an asynchronous function--> An asynchronous function is a function that does NOT block the program from running  

// It allows other code to execute while it waits (for DB call, API call, file read, etc.)  

// Marked using the keyword 'async'  

// Usually used with 'await' to pause only that function, not the whole program   

// async = allows using 'await' for database operations  

// query = SQL command stored as a template string (` `)  

// CREATE TABLE IF NOT EXISTS jobs = create table only if it doesn't already exist  

// id SERIAL PRIMARY KEY = auto-incrementing unique job id  

// type VARCHAR(50) NOT NULL = job type (must be provided)  

// payload JSONB NOT NULL = job data stored in JSON format  

// status VARCHAR(20) DEFAULT 'pending' = job status, default is 'pending'  

// created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP = auto stores creation time  

// updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP = auto stores last update time  


  try {
    await db.query(query);
    console.log("✅ Jobs table is ready");
  } catch (error) {
    console.error("❌ Error creating jobs table:", error);
    process.exit(1);
  }
// try = attempt to run the database query safely  

// await db.query(query) = send the SQL to PostgreSQL and wait for it to finish  

// console.log(...) = print success message if table is created  

// catch(error) = runs only if something goes wrong  

// error = contains details of the failure  

// process.exit(1) = stop the program because table creation failed  

};

// --------------------------------------------------
// CREATE A NEW JOB
// --------------------------------------------------
// PURPOSE:
// - This function is responsible for inserting a new job into PostgreSQL.
// - It sets default status = "pending".
// - It returns the newly created job so the API can send it back to the client.
// =====================================================

export const createJobInDB = async (type, payload) => {
  const query = `
    INSERT INTO jobs (type, payload, status)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [type, payload, "pending"];

  const result = await db.query(query, values);
  return result.rows[0];
};

// export = make this function usable in other files  

// async = this function will perform a database operation  

// (type, payload) = inputs needed to create a job  

// query = SQL command to insert a new job  

// $1, $2, $3 = placeholders to prevent SQL injection  

// values = actual data that replaces $1, $2, $3  

// await db.query(query, values) = send data to PostgreSQL and wait for result  

// RETURNING * = return the newly created job row  

// result.rows[0] = first (and only) inserted job  

// return result.rows[0] = send the created job back to

// =====================================================
// SECTION 3: GET JOB BY ID
// =====================================================
// PURPOSE:
// - Fetches a job from the database using its unique ID.
// - Used by:
//   1) API → to check job status
//   2) Worker → to read job details before processing
// =====================================================

// This is an async function because it involves a database call
// It takes a job 'id' as input
export const getJobById = async (id) => {

  // SQL query written as a template string
  // $1 is a placeholder to prevent SQL injection
  const query = `
    SELECT * FROM jobs WHERE id = $1;
  `;

  // Execute the query on the database
  // [id] is passed as a parameter to replace $1
  const result = await db.query(query, [id]);

  // result.rows is an array containing all matched records
  // result.rows[0] returns the first matching job
  // If no job exists with this id, rows[0] will be undefined
  return result.rows[0];
};


// =====================================================
// SECTION 4: UPDATE JOB STATUS
// =====================================================
// PURPOSE:
// - Allows the system (mainly the worker) to update job status.
// - Possible statuses:
//   - "processing"
//   - "completed"
//   - "failed"
// - Also updates the "updated_at" timestamp automatically.
// =====================================================

// Async because this function talks to the database
// It takes two inputs: job 'id' and new 'status'
export const updateJobStatus = async (id, status) => {

  // SQL query to update the job's status
  // $1 -> new status
  // $2 -> job id
  const query = `
    UPDATE jobs
    SET status = $1,                 -- update the status column
        updated_at = CURRENT_TIMESTAMP  -- automatically set current time
    WHERE id = $2                   -- apply update only to this job id
    RETURNING *;                    -- return the updated row
  `;

  // Execute the query with values [status, id]
  // status replaces $1, id replaces $2
  const result = await db.query(query, [status, id]);

  // result.rows contains all returned rows
  // result.rows[0] is the updated job object
  // If no job with this id exists, this will be undefined
  return result.rows[0];
};


