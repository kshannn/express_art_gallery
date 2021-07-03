const express = require('express')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId
const MongoUtil = require('./MongoUtil.js')
const dotenv = require('dotenv');
const {
    ObjectID
} = require('bson');
dotenv.config();

let app = express()

// Enable processing JSON data
app.use(express.json())
// Enable CORS
app.use(cors())

// SETUP END
async function main() {
    let db = await MongoUtil.connect(process.env.MONGO_URL, 'artgallery')

    // ==================== CREATE ====================

    // CREATE: ART POST
    app.post('/create/artpost', async (req, res) => {

        try {

            let {
                poster_name,
                image,
                art_title,
                art_type,
                art_subject,
                art_description,
                statistics
            } = req.body

            // If undefined
            art_subject = art_subject || []

            // If not array
            art_subject = Array.isArray(art_subject) ? art_subject : [art_subject]

            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').insertOne({
                post_date: new Date(),
                poster_name,
                image,
                art_title,
                art_type,
                art_subject,
                art_description,
                statistics,
                reviews: []
            })

            res.status(200)
            res.send(results)
        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // CREATE REVIEW
    app.post('/art_gallery/:id/create/review', async (req, res) => {
        try {
            let db = MongoUtil.getDB()

            let {
                reviewer_name,
                review
            } = req.body

            let results = await db.collection('artposts').updateOne({
                '_id': ObjectId(req.params.id)
            }, {
                '$push': {
                    'reviews': {
                        id: new ObjectId(),
                        review_date: new Date(),
                        reviewer_name,
                        review
                    }
                },
                "$inc": {
                    'statistics.review_count': 1
                }
            })

            res.status(200)
            res.send(results)

        } catch (e) {
            console.log(e);
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // ==================== READ ====================

    // READ: ALL ART 
    app.get('/art_gallery', async (req, res) => {
        try {
            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').find().sort({
                post_date: -1
            }).toArray()

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // FILTER - READ: SEARCH ART OR ARTIST
    app.get('/art_gallery/search', async (req, res) => {
        try {
            let searchTerm = req.query.q
            let criteria = {}
            let criteria2 = {}

            if (searchTerm) {
                criteria['art_title'] = {
                    '$regex': searchTerm,
                    '$options': 'i'
                }
                criteria2['poster_name'] = {
                    '$regex': searchTerm,
                    '$options': 'i'
                }
            }

            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').find({
                '$or': [criteria, criteria2]
            }).toArray()

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })


    // FILTER - COMBINED FILTER FOR ART TYPE AND ART SUBJECT
    app.get('/art_gallery/combinedFilter', async (req, res) => {
        try {
            let criteria = {}

            if (req.query.art_type) {
                criteria['art_type'] = req.query.art_type
            }

            if (req.query.art_subject) {
                criteria['art_subject'] = {
                    '$all': req.query.art_subject.split(",")
                }
            }

            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').find({
                '$and': [criteria]
            }).toArray()

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // READ: OTHER ARTS
    app.get('/art_gallery/other/:id', async (req, res) => {
        try {
            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').find({
                '_id': {
                    '$nin': [ObjectId(req.params.id)]
                }
            }).limit(12).toArray();

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // READ: ONE ART
    app.get('/art_gallery/:id', async (req, res) => {
        try {
            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').findOne({
                '_id': ObjectId(req.params.id)
            })

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // READ: ALL REVIEWS FOR ONE ART POST
    app.get('/art_gallery/:id/review_list', async (req, res) => {
        try {
            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').find({
                '_id': ObjectId(req.params.id)
            }).project({
                'reviews': 1
            }).toArray()

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })



    // ==================== UPDATE ====================

    // UPDATE: ART POST
    app.put('/artpost/edit/:id', async (req, res) => {
        try {
            let {
                poster_name,
                image,
                art_title,
                art_type,
                art_subject,
                art_description,
            } = req.body
            let {
                review_count,
                like_count
            } = req.body.statistics

            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').updateOne({
                '_id': ObjectId(req.params.id)
            }, {
                '$set': {
                    'post_date': new Date(),
                    poster_name,
                    image,
                    art_title,
                    art_type,
                    art_subject,
                    art_description,
                    statistics: {
                        review_count,
                        like_count
                    }
                }
            })

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // UPDATE: REVIEW

    app.put('/review/edit/:id', async (req, res) => {
        try {
            let {
                reviewer_name,
                review
            } = req.body

            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').updateOne({
                'reviews': {
                    '$elemMatch': {
                        'id': ObjectId(req.params.id)
                    }
                }
            }, {

                '$set': {
                    'reviews.$.review_date': new Date(),
                    'reviews.$.reviewer_name': reviewer_name,
                    'reviews.$.review': review
                }
            })

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // UPDATE: LIKE COUNT
    app.post('/:artid/like', async (req, res) => {
        try {
            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').updateOne({
                '_id': ObjectId(req.params.artid)
            }, {
                '$inc': {
                    'statistics.like_count': 1
                }
            })

            res.status(200)
            res.send("Success")

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // ==================== DELETE ====================

    // DELETE: ART POST
    app.delete('/artpost/delete/:id', async (req, res) => {
        try {
            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').deleteOne({
                '_id': ObjectId(req.params.id)
            })

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }
    })

    // DELETE: REVIEW
    app.delete('/review/delete/:id', async (req, res) => {
        try {
            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').updateOne({
                'reviews': {
                    '$elemMatch': {
                        'id': ObjectId(req.params.id)
                    }
                }
            }, {
                '$pull': {
                    'reviews': {
                        'id': ObjectId(req.params.id)
                    }
                },
                '$inc': {
                    'statistics.review_count': -1
                }

            })
            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
        }

    })

}

main();

app.listen(process.env.PORT, () => {
    console.log('Server started')
})