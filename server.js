import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();

// Habilita CORS e JSON
app.use(cors());
app.use(express.json());

// ✅ Usa a variável de ambiente corretamente
const stripe = new Stripe(process.env.sk_test_51SOWHBAiwsPsBAXgUnnVViLldqZ5rC2PO05yLicCT4KA8hgwQRsceU33WrQOsDtXu7s0yTnr665FU3ewH2jkdldg00Xq4zVTZT, {
  apiVersion: '2024-06-20',
});

/**
 * Cria a conta Connect (Express) e retorna o onboardingUrl.
 */
app.post('/api/stripe/create-account', async (req, res) => {
  try {
    const { email, nome, cpf } = req.body;

    if (!email || !nome || !cpf) {
      return res.status(400).json({ error: 'Informe email, nome e cpf.' });
    }

    // 1️⃣ Cria conta no Stripe Connect
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

    // 2️⃣ Cria link de onboarding
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

// Rotas auxiliares (para evitar erro no onboarding da Stripe)
app.get('/connect/refresh', (_req, res) => {
  res.send('Onboarding cancelado. Retorne ao app para tentar novamente.');
});
app.get('/connect/return', (_req, res) => {
  res.send('Onboarding concluído com sucesso! Você pode fechar esta aba.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
