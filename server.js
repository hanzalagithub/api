require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use the secret key from the .env file
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));


// Mongoose Schema and Model for GPS Location
const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Location = mongoose.model('Location', locationSchema);

// Stripe Payment Endpoint
app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency, // Usually "usd" or "eur"
      payment_method_types: ['card'],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// GPS Location Posting Endpoint
app.post('/api/location', async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    // Update the latest location or create it if it doesn't exist
    const updatedLocation = await Location.findOneAndUpdate(
      {}, // Match any document (since there should only be one)
      { latitude, longitude, timestamp: Date.now() }, // Update fields
      { upsert: true, new: true } // Create a new document if none exists
    );

    res.status(200).json({ 
      message: 'Location updated successfully', 
      data: updatedLocation 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Test Route
app.get('/', (req, res) => res.send('Server is running!'));
app.get('/bike-location', async (req, res) => {
  try {
    const location = await Location.findOne().sort({ createdAt: -1 }); // Assuming a timestamp field for sorting
    if (location) {
      res.json({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } else {
      res.status(404).send({ error: 'No bike location found' });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`));
