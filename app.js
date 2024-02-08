const express = require('express')
const {connectToDB, getDb} = require('./db')

// init app and middleware
const app = express()

let db
// db connection
connectToDB((err) => {
    if(!err) {
        app.listen(3000, () => {
            console.log("App listening on port 3000");
        })
        
        db = getDb()
    } else {
        console.log(err);
    }
})



app.get('/books', (req, resp) => {
    let books = []
    db.collection("books")
        .find()
        .sort({author: 1}) // returns a cursor, on which we use a cursor method
        .forEach((book) => books.push(book)) // asynchronous function where we attach a then to perform an operation when the operation succeeds
        .then(() => {
            resp.status(200).json(books)
        }).catch((err) => {
            resp.status(500).json({error: 'Could not fetch the documents'})
        })

})