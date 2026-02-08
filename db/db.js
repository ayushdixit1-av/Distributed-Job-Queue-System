//db/db.js


//We import the 'pg' package which is the official PostgreSQL client for Node.js

import pkg from 'pg';

//we extract the 'Pool' class from the 'pg' package. The 'Pool' class is used to manage a pool of connections to the PostgreSQL database.
const { Pool } = pkg;

//dotenv allows us to read environment variables from a .env file. This is useful for keeping sensitive information like database credentials out of our source code.
import dotenv from 'dotenv';

//Load environment variables from a .env file into process.env
//This allows us to access our database credentials and other configuration settings from the environment variables.
//The .env file should be located in the root directory of our project and contain key-value pairs for our configuration settings.
//after this , process.env.DATABSE_URL will contain the value of the DATABSE_URL variable defined in the .env file
dotenv.config();

//----------------------
//CREATE A CONNECTION POOL
//----------------------


// A "Data Pool" (also called Connection Pool) is a set of pre-made database connections
// that your application keeps ready to use.

// Instead of:
// 1. Opening a new database connection for every request
// 2. Running the query
// 3. Closing the connection

// The pool does this:
// - Creates some connections in advance
// - Keeps them idle and ready
// - Gives one connection when needed
// - Takes it back after the query is done

const pool = new Pool({
    //This is yout PostgreSQL connection string
    //Example: postgresql://username:password@host:5432/dbname
    connectionString: process.env.DATABASE_URL,
    // process = Node.js built-in global object for the running program

    // env = environment variables stored for that program

    // process.env = an object that holds all environment variables

    // process.env.X = value of environment variable named X

    // Used to store secrets like passwords, API keys, DB URLs safely

    //SSL is required for most cloud-hosted databases(Neon, Render, Railway, etc.)
    // SSL = encryption that keeps communication between your app and database secure
    ssl:{
        rejectUnauthorized: false,
        //Setting this to false allows connection to cloud DBs
        //even if they don't have a locally trusted SSL certificate
    },
    //Maximum number of connections in the pool
    //At most 10 queries can use the DB at a same time 
    max:10,

    //if a connection is idle(unused) for 30 seconds, close it
    idleTimeoutMillis:30000,

    //if connection is not enstablished within 2 seconds, throw an error
    connectionTimeoutMillis:2000

});
//----------------------------------------
//EVENT LISTENERS (For debugging and reliablity)
//----------------------------------------
// EVENT LISTENERS = functions that "listen" for specific events in your program

// They wait for something to happen (like an error, connection, or message)

// When that event occurs, the listener automatically runs its function

// Used for debugging and reliability (to track errors, connections, etc.)

// Example idea:
// If database connects -> run a message
// If connection fails -> run error handler

// This runs when the database successfully connects
pool.on("connect",() => {
    console.log("Successfully connected to the database");
})
// pool.on = method to attach an event listener to the connection pool  

// "connect" = name of the event (triggered when DB connection is established)  

// () => { } = callback function that runs when the event happens  

// console.log(...) = prints a message in the terminal for confirmation  

//This runs if there is any unexpected databse error
pool.on("error",(err) => {
    console.error("Unexpected PG error:",err);
})
// pool.on = attach an event listener to the connection pool  

// "error" = event triggered when a database error occurs  

// (err) => { } = callback function that receives the error object  

// err = contains details of what went wrong  

// console.error = prints the error message in red for debugging  
//why in previous nothing was recieved?
// Because the "connect" event does NOT pass any data by default  

// It only tells you that a connection happened — not *what* happened  

// That’s why the callback had no parameters: () => {}  

// While "error" event sends an error object (err), so we receive it  

// Simple rule:
// connect → just a signal (no data)
// error → sends details (err object)
//stop the server if DB fails
// Because without DB, our app cannot function properly
process.exit(1);
// process.exit(1) = immediately stop the Node.js process with an error code (1 means error)  
// This is a safety measure to prevent the app from running in a broken state without DB access  
// It signals to the hosting environment that the app failed to start properly  
// The hosting platform can then attempt to restart it or alert the developer

// --------------------------------------------------
// EXPORT POOL
// --------------------------------------------------
// We export the pool so other files can use it:
// - api/models/Job.js
// - api/controllers/jobController.js
// - worker/worker.js
export default pool;