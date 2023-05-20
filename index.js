const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pegfxox.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const toyCollection = client.db('toyDB').collection('services')

        const indexkeys = { name: 1 }
        const indexOptions = { name: "name" }

        const result = await toyCollection.createIndex(indexkeys, indexOptions)

        app.get('/toySearch/:text', async (req, res) => {
            const searchText = req.params.text
            const result = await toyCollection.find({name:{$regex: searchText, $options: "i"}}).toArray()

            res.send(result)
        })

        // Post item to database 

        app.post('/upload', async (req, res) => {
            const data = req.body;
            data.createdAt = new Date()
            const result = await toyCollection.insertOne(data);
            res.send(result);
        })

        // Get item by subcategory

        app.get('/alltoys/:text', async (req, res) => {

            if (req.params.text === 'classicCars' || req.params.text === 'racingCars' || req.params.text === 'fireTrucks') {
                const result = await toyCollection.find({ subcategory: req.params.text }).toArray();
                return res.send(result);
            }
            const result = await toyCollection.find({}).toArray();
            res.send(result);

        })

        // Get Single item by Email OR My toys

        app.get('/alltoys', async (req, res) => {
            let query = {}
            if (req.query?.sellerEmail) {
                query = { sellerEmail: req.query.sellerEmail }
            }
            // console.log(query);
            const result = await toyCollection.find(query).sort({ createdAt: -1 }).toArray();
            res.send(result);
        })

        // Get single item by Id 

        app.get('/singletoy/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const data = await toyCollection.findOne(filter);
            res.send(data);
        })

        // Update Item 

        app.patch('/update/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body
            const filter = { _id: new ObjectId(id) }
            const doc = {
                $set: { ...updatedData }
            }
            const result = await toyCollection.updateOne(filter, doc)
            res.send(result)
        })


        // Delete Item 

        app.delete('/sigletoy/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(filter);
            res.send(result);
        })







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Toy is running')
})
app.listen(port, () => {
    console.log(`ToyPlanet is running on port ${port}`);
})