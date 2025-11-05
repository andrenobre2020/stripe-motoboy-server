import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
app.use(cors());
app.use(express.json());

// ✅ O Stripe lê a chave secreta da variável de ambiente STRIPE_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

/**
 * Cria a conta Connect (Express) e retorna accountId + onboardingUrl.
 */
app.post('/api/stripe/create-account', async (req, res) => {
  try {
    const { email, nome, cpf } = req.body;
    if (!email || !nome || !cpf) {
      return res.status(400).json({ error: 'Informe email, nome e cpf.' });
    }

    // 1) Cria a conta no Stripe Connect
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

    // 2) Gera o link de onboarding para o motoboy completar seus dados
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

// Rotas de retorno/opcional
app.get('/connect/refresh', (_req, res) => {
  res.send('Onboarding cancelado. Retorne ao aplicativo para tentar novamente.');
});
app.get('/connect/return', (_req, res) => {
  res.send('Onboarding concluído! Você pode voltar ao aplicativo.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
