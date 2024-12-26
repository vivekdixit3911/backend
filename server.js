const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
const dbURI = 'mongodb+srv://vivekdixit48313:qFdxS2B48dXF7tw9@cluster0.3ezhi.mongodb.net/BusinessMS?retryWrites=true&w=majority';
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB', err));

// Item schema and model
const itemSchema = new mongoose.Schema({
  itemId: String,
  itemName: String,
  quantity: Number,
  cost: Number,
  selling: Number
});

const Item = mongoose.model('Item', itemSchema);

// Sale schema and model
const saleSchema = new mongoose.Schema({
  itemId: String,
  itemName: String,
  quantitySold: Number,
  priceSoldAt: Number,
  date: { type: Date, default: Date.now }
});

const Sale = mongoose.model('Sale', saleSchema);

// Routes
app.post('/add-item', (req, res) => {
  const newItem = new Item({
    itemId: req.body['item-id'],
    itemName: req.body['item-name'],
    quantity: req.body.quantity,
    cost: req.body.cost,
    selling: req.body.selling
  });

  newItem.save()
    .then(() => res.json({ message: 'Data saved successfully!' }))
    .catch((err) => res.status(400).json({ error: err.message }));
});

app.get('/get-items', (req, res) => {
  Item.find()
    .then(items => {
      const totalCost = items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
      res.json({ items, totalCost });
    })
    .catch(err => res.status(400).json({ error: err.message }));
});

app.post('/add-sale', (req, res) => {
  const { itemId, itemName, quantitySold, priceSoldAt } = req.body;

  Item.findOne({ itemId })
    .then(item => {
      if (!item) {
        throw new Error('Item not found');
      }
      if (item.quantity < quantitySold) {
        throw new Error('Insufficient stock');
      }
      item.quantity -= quantitySold;
      return item.save();
    })
    .then(() => {
      const newSale = new Sale({
        itemId,
        itemName,
        quantitySold,
        priceSoldAt
      });
      return newSale.save();
    })
    .then(() => res.json({ message: 'Sale recorded successfully!' }))
    .catch((err) => res.status(400).json({ error: err.message }));
});

app.get('/get-sales', (req, res) => {
  Sale.find()
    .then(sales => {
      res.json(sales);
    })
    .catch(err => res.status(400).json({ error: err.message }));
});

// Check if port 3000 is in use
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is already in use. Trying another port...`);
    server.listen(0, () => {
      const newPort = server.address().port;
      console.log(`Server is running on http://localhost:${newPort}`);
    });
  } else {
    console.error(err);
  }
});
