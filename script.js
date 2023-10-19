import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';

const app = express();
const port = 5500;

const users = {
    "admin": 'password',
};

app.use(bodyParser.json());

const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'Kitty1228',
    database: 'VerifiedAddresses',
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the MySQL database:', err.message);
    } else {
        console.log('Connected to the MySQL database');
        connection.release();
    }
});

app.post('/verify-address', (req, res) => {
    const { AddressLine1, City, State, Zipcode } = req.body;

    // Initialize queryParams and whereClause
    const queryParams = [];
    const whereClause = [];

    const mySqlQuery = `
        SELECT * FROM CustomerData
        WHERE (
            Zipcode LIKE ? OR 
            Zipcode LIKE ? OR 
            Zipcode LIKE ? OR 
            Zipcode LIKE ?
        ) AND ${whereClause.join(' AND ')}
    `;

    const zip1 = `${Zipcode.substr(0, 5)}%`;
    const zip2 = `%${Zipcode.substr(1, 4)}`;
    const zip3 = `${Zipcode.substr(0, 6)}%`;
    const zip4 = `%${Zipcode.substr(2, 4)}`;

    queryParams.push(zip1, zip2, zip3, zip4);

    if (AddressLine1) {
        whereClause.push('AddressLine1 = ?');
        queryParams.push(AddressLine1);
    }

    if (City) {
        whereClause.push('City = ?');
        queryParams.push(City);
    }

    if (State) {
        whereClause.push('State = ?');
        queryParams.push(State);
    }

    if (whereClause.length === 0) {
        res.status(400).json({ error: 'No verification parameters provided' });
        return;
    }

    const sql = `SELECT * FROM CustomerData WHERE ${whereClause.join(' AND ')}`;

    db.query(mySqlQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (results.length > 0) {
                res.json({ isValid: true });
            } else {
                res.json({ isValid: false, suggestions: ["suggestion1", "suggestion2"] });
            }
        }
    });
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

