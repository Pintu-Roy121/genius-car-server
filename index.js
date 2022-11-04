const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const PORT = process.env.port || 5000;

const app = express();

// middlewares ..........
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.geiv5ao.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: "UnAuthorized Access" });
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
        if (error) {
            return res.status(401).send({ message: "UnAuthorized Access" });
        }
        // console.log(decoded);
        req.decoded = decoded;
        next();

    })
}

const run = async () => {
    try {
        const serviceCollection = client.db('geniusCar').collection('servies');
        const orderCollection = client.db('geniusCar').collection('orders');


        // jwt token api ...............
        // app.post('/jwt', (req, res) => {
        //     const user = req.body;
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        //     res.send({ token })
        // })

        app.post('/jwt', (req, res) => {
            const user = req.body;

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

            res.send({ token });
        })

        // Get all services .............................
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);

            const services = await cursor.toArray();
            res.send(services);
        })

        // get specific service..............................
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const service = await serviceCollection.findOne(query);
            res.send(service)

        })


        //Order read(get) and write(post) Orders or save order in data base........
        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            // console.log(req.query);

            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'UnAuthorized Access' })
            }

            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })


        app.post('/orders', verifyJWT, async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // update data..........................................

        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: status
                },
            }
            const result = await orderCollection.updateOne(filter, updateDoc)
            res.send(result);
        })
        // Delete the data form db.................................
        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })


    }
    finally {

    }


}
run().catch(error => console.log(error))





app.get('/', (rea, res) => {
    res.send('Genius Car server is working')
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

// const app.listen