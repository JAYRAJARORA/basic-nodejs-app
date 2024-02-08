const {MongoClient} = require('mongodb')

let dbConnection
let uri = 'mongodb+srv://jayrajarora:Jayraj123@cluster0.ffiecon.mongodb.net/?retryWrites=true&w=majority'
module.exports = {
    connectToDB: (cb) => {
        MongoClient.connect(uri)
            .then((client) => {
                dbConnection = client.db()
                return cb()
            })
            .catch((err) => {
                console.log(err)
                return cb(err)
            })

    },
    getDb: () => dbConnection
}