import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
app.use(cors());
app.use(express.json());

// Leia a chave secreta da env var STRIPE_SECRET_KEY
const stripe = new Stripe(process.env.pk_test_51SOWHBAiwsPsBAXgSbuwDjOzb3MDR3QRJmacQv3J1NM1oscTzSkFt7nRTY9zPVbYXGL1fo1DMUiFSamXB1uD1wVj006IdI6nYc, {
  apiVersion: '2024-06-20',
});

/**
 * Cria a conta Connect (Express) e retorna accountId + onboardingUrl
 */
app.post('/api/stripe/create-account', async (req, res) => {
  try {
    const { email, nome, cpf } = req.body;
    if (!email || !nome || !cpf) {
      return res.status(400).json({ error: 'Informe email, nome e cpf.' });
    }

    // 1) Cria a conta Connect
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

    // 2) Gera o link de onboarding para o motoboy completar os dados
    const origin = process.env.PUBLIC_BASE_URL || 'https://stripe-motoboy-server.onrender.com';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/connect/refresh`,
      return_url: `${origin}/connect/return`,
      type: 'account_onboarding',
    });

    res.json({ accountId: account.id, onboardingUrl: accountLink.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar conta Stripe.' });
  }
});

app.get('/connect/refresh', (_req, res) => {
  res.send('Onboarding cancelado. Retorne ao aplicativo para tentar novamente.');
});
app.get('/connect/return', (_req, res) => {
  res.send('Onboarding concluído! Você pode fechar esta janela e voltar ao aplicativo.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
