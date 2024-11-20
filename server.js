require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use the secret key from the .env file
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,  // Amount in cents
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
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`));
