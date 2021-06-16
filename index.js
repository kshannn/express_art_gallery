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

    // REVISED: CREATE: ART POST
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
                review_count,
                like_count
            } = req.body

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
                review_count,
                like_count
            })

            res.status(200)
            res.send(results)
        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
            console.log(e)
        }
    })

    // CREATE: ART POST
    // app.post('/create_art_post', async (req, res) => {

    //     try {
    //         let post_date = req.body.post_date
    //         let poster_name = req.body.poster_name
    //         let image = req.body.image
    //         let art_title = req.body.art_title
    //         let art_type = req.body.art_type
    //         let art_subject = req.body.art_subject
    //         let art_description = req.body.art_description
    //         let review_count = req.body.review_count
    //         let like_count = req.body.like_count
    //         let db = MongoUtil.getDB()
    //         let results = await db.collection('artposts').insertOne({
    //             'post_date': post_date,
    //             'poster_name': poster_name,
    //             'image': image,
    //             'art_title': art_title,
    //             'art_type': art_type,
    //             'art_subject': art_subject,
    //             'art_description': art_description,
    //             'review_count': review_count,
    //             'like_count': like_count
    //         })
    //         res.status(200)
    //         res.send(results)
    //     } catch (e) {
    //         res.status(500)
    //         res.send('Unexpected internal server error')
    //         console.log(e)
    //     }

    // })


    // CREATE: REVIEW
    app.post('/create/review', async (req, res) => {
        try {
            let {
                art_id,
                review_date,
                reviewer_name,
                liked_post,
                review
            } = req.body
            // let art_id = req.body.art_id
            // let review_date = req.body.review_date
            // let reviewer_name = req.body.reviewer_name
            // let liked_post = req.body.liked_post
            // let review = req.body.review
            let db = MongoUtil.getDB()
            let results = await db.collection('reviews').insertOne({
                art_id,
                'review_date': new Date(review_date),
                reviewer_name,
                liked_post,
                review
            })
            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
            console.log(e)
        }
    })

    // REVISED CREATE: REVIEW

    app.post('/art_gallery/:id/create/review', async (req, res) => {
        try {
            let db = MongoUtil.getDB()

            let selectedArt = await db.collection('artposts').findOne({
                '_id': ObjectId(req.params.id)
            })
        

            let {
                reviewer_name,
                liked_post,
                review
            } = req.body
            art_id = selectedArt._id
        
           
            let results = await db.collection('reviews').insertOne({
                art_id,
                'review_date': new Date(),
                reviewer_name,
                liked_post,
                review
            })
            res.status(200)
            res.send(results)

        } catch (e) {
            res.status(500)
            res.send('Unexpected internal server error')
            console.log(e)
        }
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

    // REVISED READ: ALL ART
    app.get('/art_gallery', async (req, res) => {

        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').find().sort({
            post_date: -1
        }).toArray()

        res.status(200)
        res.send(results)
    })

    // REVISED READ: ONE ART
    app.get('/art_gallery/:id', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').findOne({
            '_id': ObjectId(req.params.id)
        })

        res.status(200)
        res.send(results)
    })

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

    // REVISED READ: ALL REVIEWS FOR ONE ART POST
    app.get('/art_gallery/:id/review_list', async (req, res) => {
        let db = MongoUtil.getDB()
        let results = await db.collection('reviews').find({
            'art_id':ObjectId(req.params.id)
        }).toArray()

        res.status(200)
        res.send(results)
    })


    // UPDATE: ART POST
    app.put('/edit_artpost/:id', async (req, res) => {
        let post_date = req.body.post_date
        let poster_name = req.body.poster_name
        let image = req.body.image
        let art_title = req.body.art_title
        let art_type = req.body.art_type
        let art_subject = req.body.art_subject
        let art_description = req.body.art_description
        let review_count = req.body.review_count
        let like_count = req.body.like_count

        let db = MongoUtil.getDB()
        let results = await db.collection('artposts').updateOne({
            '_id': ObjectId(req.params.id)
        }, {
            '$set': {
                'post_date': new Date(post_date),
                'poster_name': poster_name,
                'image': image,
                'art_title': art_title,
                'art_type': art_type,
                'art_subject': art_subject,
                'art_description': art_description,
                'review_count': review_count,
                'like_count': like_count
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