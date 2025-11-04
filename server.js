import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use a variável de ambiente no Render Dashboard:
// STRIPE_SECRET_KEY = sk_test_...
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

/**
 * Endpoint para criar uma conta Stripe Connect Express (motoboy)
 */
app.post('/api/stripe/create-account', async (req, res) => {
  try {
    const { email, nome, cpf } = req.body;

    if (!email || !nome || !cpf) {
      return res.status(400).json({ error: 'Informe email, nome e cpf.' });
    }

    const [firstName, ...rest] = nome.trim().split(' ');
    const lastName = rest.join(' ') || '.';

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
        first_name: firstName,
        last_name: lastName,
        email,
      },
      metadata: { cpf },
    });

    // Gera link de onboarding (opcional mas recomendado)
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      type: 'account_onboarding',
      refresh_url: 'https://stripe.com/reauth',
      return_url: 'https://stripe.com/success',
    });

    res.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    console.error('Stripe Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
