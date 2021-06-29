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

        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').find().sort({
            post_date: -1
        }).toArray()

        res.status(200)
        res.send(results)
    })

    // FILTER - READ: SEARCH ART OR ARTIST
    app.get('/art_gallery/search', async (req, res) => {
        let searchTerm = req.query.q // this "search" doesn't matter, you can put anything you want
        let criteria = {}
        let criteria2 = {}

        if (searchTerm) {
            criteria['art_title'] = {
                '$regex': searchTerm,
                '$options': 'i'
            }
            criteria2['poster_name']= {
                '$regex': searchTerm,
                '$options': 'i'
            }
        }

        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').find({
            '$or':[criteria,criteria2]
        }).toArray()

        res.status(200)
        res.send(results)
    })


    // FILTER - COMBINED FILTER FOR ART TYPE AND ART SUBJECT
    app.get('/art_gallery/combinedFilter', async (req,res)=> {
        let criteria = {}

        if(req.query.art_type){
            criteria['art_type'] = req.query.art_type
        }

        if(req.query.art_subject){
            criteria['art_subject'] = {
                '$all':req.query.art_subject.split(",") 
            }
        }     

        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').find({
            '$and':[criteria]
        }).toArray()

        res.status(200)
        res.send(results)
    })


    // READ: OTHER ART
    app.get('/art_gallery/other/:id', async (req,res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').find({
            '_id': {
                '$ne': ObjectId(req.params.id)
            }
        }).toArray();

        res.status(200)
        res.send(results)
    })
    

    // READ: ONE ART
    app.get('/art_gallery/:id', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').findOne({
            '_id': ObjectId(req.params.id)
        })

        res.status(200)
        res.send(results)
    })

    // READ: ALL REVIEWS FOR ONE ART POST
    app.get('/art_gallery/:id/review_list', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').find({
            '_id': ObjectId(req.params.id)
        }).project({
            'reviews': 1
        }).toArray()


        res.status(200)
        res.send(results)
    })

    

    // ==================== UPDATE ====================

    // UPDATE: ART REVIEW COUNT
    app.put('/artpost/updateReviewCount/:id', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').updateOne({
            '_id': ObjectId(req.params.id)
        }, {
            '$set': {
                'statistics.review_count': req.body.statistics.review_count
            }
        })

        res.status(200)
        res.send(results)
    })


    // UPDATE: ART POST
    app.put('/artpost/edit/:id', async (req, res) => {

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
    })


    // UPDATE: REVIEW

    app.put('/review/edit/:id', async (req, res) => {

        let {
            reviewer_name,
            liked_post,
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
                'reviews.$.liked_post': liked_post,
                'reviews.$.review': review
            }
        })

        res.status(200)
        res.send(results)
    })

    // ==================== DELETE ====================

    // DELETE: ART POST
    app.delete('/artpost/delete/:id', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').deleteOne({
            '_id': ObjectId(req.params.id)
        })
        res.status(200)
        res.send(results)
    })

    // DELETE: REVIEW
    app.delete('/review/delete/:id', async (req, res) => {
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
            '$inc':{
                'statistics.review_count': -1
            }
    
        })
        res.status(200)
        res.send(results)
    })
    
}

main();


app.listen(3000, () => {
    console.log('Server started')
})