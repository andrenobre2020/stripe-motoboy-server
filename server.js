import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Stripe client using the secret key from environment variables
// IMPORTANT: never expose your secret key in client-side code. It should only be used server-side.
const stripe = new Stripe(process.env.sk_test_51SOWHBAiwsPsBAXgUnnVViLldqZ5rC2PO05yLicCT4KA8hgwQRsceU33WrQOsDtXu7s0yTnr665FU3ewH2jkdldg00Xq4zVTZT, {
  apiVersion: '2024-06-20',
});

/**
 * Endpoint to create a Stripe Connect Express account for a motoboy.
 * Expects `email`, `nome`, and `cpf` in the request body.
 * Returns the created account's ID on success.
 */
app.post('/api/stripe/create-account', async (req, res) => {
  try {
    const { email, nome, cpf } = req.body;

    // Basic validation
    if (!email || !nome || !cpf) {
      return res.status(400).json({ error: 'Informe email, nome e cpf.' });
    }

    // Create the Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      individual: {
        first_name: nome.split(' ')[0],
        last_name: nome.split(' ').slice(1).join(' ') || '.',
        email,
      },
      metadata: { cpf },
    });

    res.json({ accountId: account.id });
  } catch (err) {
    console.error('Stripe:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar conta Stripe.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
