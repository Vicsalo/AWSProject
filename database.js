// Required modules to meet project requirements
import express from 'express';
import mysql from 'mysql2'; // Imports the 'mysql2' module
import bodyParser from 'body-parser';

// Allows for basic AUTH
import basicAuth from 'express-basic-auth';
const app = express();
const port = 3000;

// Define user
const users = {
    admin: 'password',
  };

// Configures the Basic Authentication middleware
app.use(basicAuth({ users, unauthorizedResponse: 'Unauthorized' }));


// Creating a MySQL connection
// Pool allows for multiple databases to be set up if needed
const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'Kitty1228',
    database: 'VerifiedAddresses',
});

// Connecting to the database
// Will display an error message if no connection can be established
// Will output a successful connection statement if a connection is made
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the MySQL database:', err.message);
    } else {
        console.log('Connected to the MySQL database');
        // Releases the connection when it's done
        connection.release();
    }
});

// Middleware to parse JSON data
app.use(bodyParser.json());

// Defining the API route that expects the parameters "Zipcode, AddressLine1, AddressLine2, City, and State" in that order
app.get('/verify-address', (req, res) => {
    const { Zipcode, AddressLine1, AddressLine2, City, State } = req.query;

    // Initialize queryParams and whereClause
    const queryParams = [];
    const whereClause = [];

    // Defines the SQL query below queryParams and whereClause
    const mySqlQuery = `
        SELECT * FROM CustomerData
        WHERE (
            Zipcode LIKE ? OR 
            Zipcode LIKE ? OR 
            Zipcode LIKE ? OR 
            Zipcode LIKE ?
        ) AND ${whereClause.join(' AND ')}
    `;

    // Since Zipcode's data type in the db is VARCHAR(11)
    const zip1 = `${Zipcode.substr(0, 5)}%`; // Zip code + 4 (e.g., 12345%)
    const zip2 = `%${Zipcode.substr(1, 4)}`; // Partial match on last 4 digits (e.g., %2345)
    const zip3 = `${Zipcode.substr(0, 6)}%`; // Zip code + 4 (e.g., 123456%)
    const zip4 = `%${Zipcode.substr(2, 4)}`; // Partial match on last 4 digits (e.g., %3456)

    // Push these four patterns into the queryParams array
    queryParams.push(zip1, zip2, zip3, zip4);

// Checks for matching AddressLine1 in CustomerData table
if (AddressLine1) {
    whereClause.push('AddressLine1 = ?');
    queryParams.push(AddressLine1);
}
// Checks for matching AddressLine2 in CustomerData table
if (AddressLine2) {
    whereClause.push('AddressLine2 = ?');
    queryParams.push(AddressLine2);
}

// Checks for matching City in CustomerData table
if (City) {
    whereClause.push('City = ?');
    queryParams.push(City);
}
// Checks for matching State in CustomerData table
if (State) {
    whereClause.push('State = ?');
    queryParams.push(State);
}
// Displays an error message if no parameters are enetered for verification
if (whereClause.length === 0) {
    res.status(400).json({ error: 'No verification parameters provided' });
    return;
}

// The MySQL query that includes the WHERE clause based on the provided parameters. and pulls data from the CustomerData table
const sql = `SELECT * FROM CustomerData WHERE ${whereClause.join(' AND ')}`;

// Creates a query in the db for matching records based on the parameters provided
// Displays error message if unable to connect
// Displays whether the address is verified or not
// Executes the query on the database
db.query(mySqlQuery, queryParams, (err, results) => {
    if (err) {
        console.error('Error querying the database:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    } else {
        if (results.length > 0) {
            // Address is verified
            res.json({ message: 'Address is verified' });
        } else {
            // Address is not verified
            res.json({ message: 'Address is not verified' });
        }
    }
});
});

// Starts the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});