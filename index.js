const express = require('express')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId
const MongoUtil = require('./MongoUtil.js')
const dotenv = require('dotenv');
dotenv.config();

let app = express()

// Enable processing JSON data
app.use(express.json())
// Enable CORS
app.use(cors())

// SETUP END
async function main () {
    let db = await MongoUtil.connect(process.env.MONGO_URL, 'sample_artgallery')


    // CREATE
    app.post('/create_art_post', async (req,res) => {
        
        try {
            let art_type = req.body.art_type
            let art_subject = req.body.art_subject
            let date = req.body.date
            let db = MongoUtil.getDB()
            let result = await db.collection('artpost').insertOne({
                'art_type':art_type,
                'art_subject':art_subject,
                'date':new Date(date)
            })
            res.status(200)
            res.send(result)
        } catch (e) {
            res.send(500)
            res.send('Unexpected internal server error')
            console.log(e)
        }

    })



}

main();



app.listen(3000,() => {
    console.log('Server started')
})