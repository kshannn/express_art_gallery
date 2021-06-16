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
async function main() {
    let db = await MongoUtil.connect(process.env.MONGO_URL, 'artgallery')

    // ==================== CREATE ====================
    // CREATE: ART POST
    app.post('/create/artpost', async (req, res) => {
        try {

            let {
                post_date,
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

            // If undefined
            art_subject = art_subject || []

            // If not array
            art_subject = Array.isArray(art_subject) ? art_subject : [art_subject]

            let db = MongoUtil.getDB()
            let results = await db.collection('artposts').insertOne({
                post_date,
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
            })

            res.status(200)
            res.send(results)
        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
            console.log(e)
        }
    })

    // CREATE REVIEW
    app.post('/art_gallery/:id/create/review', async (req, res) => {
        try {
            let db = MongoUtil.getDB()

            let {
                reviewer_name,
                liked_post,
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
                        liked_post,
                        review
                    }
                }
            })

            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
            console.log(e)
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

    // READ: ONE ART
    app.get('/art_gallery/:id', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').findOne({
            '_id': ObjectId(req.params.id)
        })

        res.status(200)
        res.send(results)
    })

    // READ: ALL REVIEWS FOR ONE ART POST (To be edited)
    // app.get('/art_gallery/:id/review_list', async (req, res) => {
    //     let db = MongoUtil.getDB()
    //     let results = await db.collection('reviews').find({
    //         'art_id': ObjectId(req.params.id)
    //     }).sort({
    //         review_date: -1
    //     }).toArray()


    //     res.status(200)
    //     res.send(results)
    // })

    // REVISED READ: ALL REVIEWS FOR ONE ART POST
    app.get('/art_gallery/:id/review_list', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').find({
            '_id': ObjectId(req.params.id)
        }, {
            'reviews': 1
        }).toArray()


        res.status(200)
        res.send(results)
    })


    // *** Muted out until filter/search
    // READ: SEARCH ART
    // app.get('/art_gallery', async (req, res) => {
    //     let art = req.query.search // this "search" doesn't matter, you can put anything you want
    //     let criteria = {}

    //     if (art) {
    //         criteria['art'] = {
    //             '$regex': art,
    //             '$options': 'i'
    //         }
    //     }

    //     let db = MongoUtil.getDB()
    //     let results = await db.collection('artposts').find(criteria).sort({
    //         post_date: -1
    //     }).toArray()

    //     res.status(200)
    //     res.send(results)
    // })


    // *** Muted out until filter/search
    // READ: SEARCH REVIEW
    // app.get('/review_list', async (req, res) => {
    //     let review = req.query.search


    //     let criteria = {}

    //     if (review) {
    //         criteria['review'] = {
    //             '$regex': review,
    //             '$options': 'i'
    //         }
    //     }

    //     let db = MongoUtil.getDB()
    //     let results = await db.collection('reviews').find(criteria).toArray()

    //     res.status(200)
    //     res.send(results)
    // })




    // UPDATE: ART POST
    app.put('/artpost/edit/:id', async (req, res) => {
        console.log(req.body)
        let {
            post_date, // can take this out
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
    app.put('/edit_review/:id', async (req, res) => {
        let review_date = req.body.review_date
        let reviewer_name = req.body.reviewer_name
        let liked_post = req.body.liked_post
        let review = req.body.review

        let db = MongoUtil.getDB()
        let results = await db.collection('reviews').updateOne({
            '_id': ObjectId(req.params.id)
        }, {
            '$set': {
                'review_date': new Date(review_date),
                'reviewer_name': reviewer_name,
                'liked_post': liked_post,
                'review': review
            }
        })

        res.status(200)
        res.send(results)
    })


    // DELETE: ART POST
    app.delete('/delete_artpost/:id', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').deleteOne({
            '_id': ObjectId(req.params.id)
        })
        res.status(200)
        res.send(results)
    })

    // DELETE: REVIEW
    app.delete('/delete_review/:id', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('reviews').deleteOne({
            '_id': ObjectId(req.params.id)
        })
        res.status(200)
        res.send(results)
    })

}

main();



app.listen(3000, () => {
    console.log('Server started')
})