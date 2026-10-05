// Vercel serverless function: creates a Stripe Checkout session for a booking.
// Junior: add STRIPE_SECRET_KEY in Vercel → Settings → Environment Variables.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { amount_cents, tinter_name, service_name, booking_id, customer_email, success_url, cancel_url } = req.body || {};
  if (!amount_cents || amount_cents < 50) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customer_email || undefined,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amount_cents,
          product_data: {
            name: `${service_name || 'Window tint'} — ${tinter_name || 'TintConnect'}`,
            description: `Booking ${booking_id || ''} · TintConnect escrow — released to your tinter on completion`,
          },
        },
        quantity: 1,
      }],
      metadata: { booking_id: booking_id || '', tinter_name: tinter_name || '' },
      success_url: success_url,
      cancel_url: cancel_url,
    });
    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
