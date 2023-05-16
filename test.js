'use strict'

// Import express
const express = require('express');
const https = require('https');
const fs = require('fs');
// Import client sessions
const sessions = require('client-sessions');

// The body parser
const bodyParser = require("body-parser");

// The mysql library
const mysql = require('mysql');

// Instantiate an express app
const app = express();
const bcrypt = require('bcrypt');

// Set the view engine
app.set('view engine', 'ejs');

// Connect to the database
const mysqlConn = mysql.createConnection({
    host: "localhost",
    user: "appaccount",
    password: "apppass",
    multipleStatements: true

});


// Needed to parse the request body
// Note that in version 4 of express, express.bodyParser() was
// deprecated in favor of a separate 'body-parser' module.
app.use(bodyParser.urlencoded({ extended: true }));

// The session settings middleware	
app.use(sessions({
    cookieName: 'session',
    secret: 'random_string_goes_here',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

// The default page
// @param req - the request
// @param res - the response
app.get("/", function (req, res) {

    // Is this user logged in?
    let userName;
    let sessionId = req.session.username;
    if (!sessionId) {
        res.render('loginpage');
    }
    const query = 'USE users;SELECT username from appusers where session = ?';
    const values = [sessionId];

    mysqlConn.query(query, values, (err, qResult) => {
        if (err) {
            console.error('Error executing the select query: ', err);
            return;
        }

        console.log('Successfully checked session id from the database');

        let result = qResult[1];
        console.log(result);
        if (result.length > 0) {
            userName = result[0]['username'];
        }

    });
    if (userName) {
        // Yes!
        res.redirect('/dashboard');
    }
    else {
        // No!
        res.render('loginpage');
    }

});

// The login page
// @param req - the request
// @param res - the response
app.get('/dashboard', function (req, res) {
    // Is this user logged in? Then show the dashboard
    let sessionId = req.session.username;
    let userName;
    if (!sessionId) {
        res.redirect('/');
    }
    const query = 'USE users;SELECT username from appusers where session = ?';
    const values = [sessionId];

    mysqlConn.query(query, values, (err, qResult) => {
        if (err) {
            console.error('Error executing the select query: ', err);
            return;
        }

        console.log('Successfully checked session id from the database');

        let result = qResult[1];
        console.log(result);
        if (result.length > 0) {
            userName = result[0]['username'];
        }
        if (userName) {
            res.render('dashboard', { username: userName });

        }
        //Not logged in! Redirect to the mainpage
        else {
            res.redirect('/');
        }
    });


});

// The login script
// @param req - the request
// @param res - the response
app.post('/login', function (req, res) {

    // Get the username and password data from the form
    let userName = req.body.username;
    let password = req.body.password;


    // Construct the query
    let query = "USE users; SELECT username,password from appusers where username='" + userName + "' AND password='" + password + "'";
    console.log(query);


    // Query the DB for the user
    mysqlConn.query(query, function (err, qResult) {


        if (err) throw err;
        console.log('-----');
        console.log(qResult[0]);
        console.log(qResult[1]);

        // Does the password match?
        let match = false;

        // Go through the results of the second query
        for (let account of qResult[1]) {
            let auth = false;
            let saltRounds = 10;
            bcrypt.hash(account['password'], saltRounds, function (err, hash) {

                // ONCE THE PASSWORD IS GENERATED, verify it
                console.log(hash)

                // Compare the password using a hash    
                bcrypt.compare(account['password'], hash, function (err, res) {

                    // Check if the passwords match
                    if (res == true) auth = true;
                });
            });

            if (account['username'] == userName && auth) {
                console.log("Match!");

                // We have a match!
                match = true;

                //break;

            }
        };

        // Login succeeded! Set the session variable and send the user
        // to the dashboard
        if (match) {
            req.session.username = userName
            // adding the session id to the database
            const insertQuery = 'UPDATE appusers SET session = ? where username = ?';
            const values = [userName, userName];
            mysqlConn.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Error executing the query: ', err);
                    return;
                }

                console.log('Added session id to the database');
            });

            res.redirect('/dashboard');
        }
        else {
            // If no matches have been found, we are done
            res.send("<b>Wrong</b>");
        }
    });



    /**
    if(correctPass && correctPass === password)
    {
        // Set the session
        req.session.username = userName;

        res.redirect('/dashboard');
    }
    else
    {
        res.send("Wrong!");
    }
	
    res.send("Wrong");

**/
});


// The logout function
// @param req - the request
// @param res - the response
app.get('/logout', function (req, res) {
    let userName = req.session.username;
    // Kill the session
    req.session.reset();
    // removing the session id from the database
    const query = 'UPDATE appusers SET session = null where username = ?';
    const values = [userName];
    mysqlConn.query(query, values, (err, result) => {
        if (err) {
            console.error('Error executing the query: ', err);
            return;
        }

        console.log('Removed session id from the database');
    });


    res.redirect('/');
});
app.post('/register', function (req, res) {
    let userName = req.body.username;
    let password = req.body.password;
    let saltRounds = 10;
    bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            // Store hash in your password DB.
            console.log(hash);
            const query = 'USE users; INSERT INTO appusers(username, password) VALUES (?, ?)';
            const values = [userName, hash];
            mysqlConn.query(query, values, (err, result) => {
                if (err) {
                    console.error('Error executing the query: ', err);
                    return;
                }

                console.log('Insert the table');
            });
        });
    });



    res.render('loginpage');

});

app.get('/register', function (req, res) {

    res.render('register');
});

let privateKey = fs.readFileSync('./mykey.key', 'utf8');
let certificate = fs.readFileSync('./mycert.crt', 'utf8');
let credentials = { key: privateKey, cert: certificate };

// Wrap the express communications inside https
let httpsServer = https.createServer(credentials, app);
httpsServer.listen(3000);


