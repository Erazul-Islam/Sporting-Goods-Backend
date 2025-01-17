const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { default: mongoose } = require('mongoose');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    // origin: [
    //     ' http://localhost:5000',
    //     'https://food-wave-dba6f.firebaseapp.com'
    // ],
    credentials: true
}));
app.use(express.json())

const uri = "mongodb+srv://assignment2:I95rJoGW8fj7Ke6Z@taosif.sxba9qz.mongodb.net/product?retryWrites=true&w=majority&appName=Taosif";

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
        await client.connect();

        const productCollection = client.db('goods').collection('product')
        const cartCollection = client.db('goods').collection('cart');
        const orderCollection = client.db('goods').collection('orders')

        app.get('/products', async (req, res) => {
            const cursor = productCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/latest', async (req, res) => {
            const cursor = productCollection.find().sort({ createdAt: -1 }).limit(4);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ error: 'Invalid product ID' });
                }
                const query = { _id: new ObjectId(id) };
                const result = await productCollection.findOne(query);
                if (!result) {
                    return res.status(404).send({ error: 'Product not found' });
                }
                res.send(result);
            } catch (error) {
                console.error("Error getting product:", error);
                res.status(500).send({ error: 'An error occurred while fetching the product' });
            }
        });

        app.post('/cart', async (req, res) => {
            try {
                const item = req.body;
                const result = await cartCollection.insertOne(item);
                res.send(result);
            } catch (error) {
                console.error("Error adding item to cart:", error);
                res.status(500).send({ error: 'An error occurred while adding item to cart' });
            }
        });

        app.post('/orders', async (req, res) => {
            const item = req.body;
            const result = await orderCollection.insertOne(item)
            res.send(result)
        })

        app.post('/products', async (req, res) => {
            try {
                const item = req.body;
                const result = await productCollection.insertOne(item);
                res.send(result);
            } catch (error) {
                console.error("Error adding item to cart:", error);
                res.status(500).send({ error: 'An error occurred while adding item to cart' });
            }
        });

        app.get('/carts', async (req, res) => {
            const cursor = cartCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })



        app.get('/carts/:productId', async (req, res) => {
            const productId = req.params.productId
            const cartItem = await cartCollection.findOne({ productId })
            if (cartItem) {
                res.status(200).json({ cartItem })
            } else {
                res.status(200).json({ quantity: 0 })
            }
        })

        app.post('/cart', async (req, res) => {
            const { productId, quantity } = req.body;
            try {
                let cartItem = await cartCollection.findOne({ productId });
                if (cartItem) {
                    // Update quantity if product already in cart
                    cartItem.quantity = Math.min(cartItem.quantity + 1, cartItem.stock_quantity);
                } else {
                    // Add new product to cart
                    cartItem = new cartCollection(req.body);
                }
                await cartItem.save();
                res.status(200).send('Product added/updated successfully');
            } catch (error) {
                console.error(error);
                res.status(500).send('Server error');
            }
        });

        app.delete('/carts/:id', async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ error: 'Invalid product ID' });
                }
                const query = { _id: new ObjectId(id) };
                const result = await cartCollection.deleteOne(query);
                if (!result) {
                    return res.status(404).send({ error: 'Product not found' });
                }
                res.send(result);
            } catch (error) {
                console.error("Error getting product:", error);
                res.status(500).send({ error: 'An error occurred while fetching the product' });
            }
        });

        app.delete('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ error: 'Invalid product ID' });
                }
                const query = { _id: new ObjectId(id) };
                const result = await productCollection.deleteOne(query);
                if (!result) {
                    return res.status(404).send({ error: 'Product not found' });
                }
                res.send(result);
            } catch (error) {
                console.error("Error getting product:", error);
                res.status(500).send({ error: 'An error occurred while fetching the product' });
            }
        });

        app.put('/products/:_id', async (req, res) => {
            const productId = req.params._id;
            const updatedProductData = req.body;

            try {
                const filter = { _id: new ObjectId(productId) }
                const updateDoc = {
                    $set: {
                        name: updatedProductData.name,
                        category: updatedProductData.category,
                        stock_quantity: updatedProductData.stock_quantity,
                        brand: updatedProductData.brand,
                        description: updatedProductData.description,
                        price: updatedProductData.price,
                        image: updatedProductData.image
                    }
                };
                const result = await productCollection.updateOne(filter, updateDoc);
                if (result.modifiedCount === 1) {
                    res.json({ message: 'Product updated successfully' });
                } else {
                    res.status(404).json({ message: 'Product not found or not modified' });
                }
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Failed to update product' });
            }
        })

        await client.db("admin").command({ ping: 1 });
    } finally {
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})