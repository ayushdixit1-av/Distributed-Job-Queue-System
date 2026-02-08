// =========================================
// api/controllers/jobController.js
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