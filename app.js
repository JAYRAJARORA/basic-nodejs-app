const express = require('express')
const {connectToDB, getDb} = require('./db')
const { ObjectId } = require('mongodb')

// init app and middleware
const app = express()
// convert the json sent to be used by the request handler functions
app.use(express.json())

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

    // current page
    let page = req.query.page || 0
    let booksPerPage = 3

    let books = []
    db.collection("books")
        .find()
        .sort({author: 1}) // returns a cursor, on which we use a cursor method
        .skip(page * booksPerPage)
        .limit(booksPerPage)
        .forEach((book) => books.push(book)) // asynchronous function where we attach a then to perform an operation when the operation succeeds
        .then(() => {
            resp.status(200).json(books)
        }).catch((err) => {
            resp.status(500).json({error: 'Could not fetch the documents'})
        })

})

app.get('/books/:id', (req, resp) => {

    if(ObjectId.isValid(req.params.id)) {
        db.collection('books').findOne({
            _id: new ObjectId(req.params.id)
        }).then((doc) => {
            resp.status(200).json(doc)
        }).catch((err) => {
            resp.status(500).json({error: "Could not fetch the document"})
        })
    } else {
        resp.status(500).json("Not a valid document Id")   
    }

})


app.post('/books', (req, resp) => {
    const book = req.body

    db.collection('books').insertOne(book)
        .then(result => {
            resp.status(201).json(result)
        }).catch(error => {
            resp.status(500).json('Could not insert the json document')
        })
})

app.delete('/books/:id', (req, resp) => {

    if(ObjectId.isValid(req.params.id)) {
        db.collection('books').deleteOne({
            _id: new ObjectId(req.params.id)
        }).then((result) => {
            resp.status(200).json(result)
        }).catch((err) => {
            resp.status(500).json({error: "Could not delete the document"})
        })
    } else {
        resp.status(500).json("Not a valid document Id")   
    }

})

app.patch('/books/:id', (req, resp) => {
    const updates = req.body

    if(ObjectId.isValid(req.params.id)) {
        db.collection('books').updateOne({_id: new ObjectId(req.params.id)}, {
            $set: updates
        }).then((result) => {
            resp.status(200).json(result)
        }).catch((err) => {
            resp.status(500).json({error: "Could not update the document"})
        })
    } else {
        resp.status(500).json("Not a valid document Id")   
    }

})