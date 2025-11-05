import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
app.use(cors());
app.use(express.json());

// Initialise Stripe with the secret from the environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});


app.post('/api/stripe/create-account', async (req, res) => {
  const { email, nome, cpf } = req.body;
  // valida e cria account...
  const account = await stripe.accounts.create({ … });
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${origin}/connect/refresh`,
    return_url: `${origin}/connect/return`,
    type: 'account_onboarding',
  });
  res.json({ accountId: account.id, onboardingUrl: accountLink.url });
});


    // 2. Create the onboarding link (motoboy fills in bank details)
    const origin = process.env.PUBLIC_BASE_URL || 'https://stripe-motoboy-server.onrender.com';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/connect/refresh`,
      return_url: `${origin}/connect/return`,
      type: 'account_onboarding',
    });

    res.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar conta Stripe.' });
  }
});

// optional: small endpoints for the onboarding redirect URLs
app.get('/connect/refresh', (_req, res) => {
  res.send('Onboarding cancelado. Retorne ao app para tentar novamente.');
});
app.get('/connect/return', (_req, res) => {
  res.send('Onboarding concluído! Você pode fechar esta janela e voltar ao aplicativo.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
