import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
app.use(cors()); // em produção, prefira: cors({ origin: ['seu-app://','http://localhost:19006'] })
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

/**
 * Cria a conta Connect (Express) e já retorna o onboardingUrl.
 */
app.post('/api/stripe/create-account', async (req, res) => {
  try {
    const { email, nome, cpf } = req.body;
    if (!email || !nome || !cpf) {
      return res.status(400).json({ error: 'Informe email, nome e cpf.' });
    }

    // 1) Cria conta
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

    // 2) Cria link de onboarding
    const origin = process.env.PUBLIC_BASE_URL || 'https://stripe-motoboy-server.onrender.com';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/connect/refresh`, // pode ser uma rota estática no Render
      return_url: `${origin}/connect/return`,   // idem
      type: 'account_onboarding',
    });

    return res.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    console.error('Stripe:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar conta Stripe.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
