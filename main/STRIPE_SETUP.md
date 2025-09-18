# Stripe Payment Integration Setup Guide

## Quick Start

1. **Install Stripe CLI** (for local webhook testing):

   ```bash
   # On Linux/macOS
   curl -s https://packages.stripe.com/api/security/keypairs/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
   echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
   sudo apt update
   sudo apt install stripe
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   ```

3. **Get your Stripe keys** from https://dashboard.stripe.com/test/apikeys:

   - Replace `STRIPE_SECRET_KEY` with your Secret key (starts with `sk_test_`)
   - Replace `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` with your Publishable key (starts with `pk_test_`)

4. **Start the development server**:

   ```bash
   npm run dev
   ```

5. **In a new terminal, set up webhook forwarding**:

   ```bash
   # Login to Stripe CLI (follow the prompts)
   stripe login

   # Forward webhooks to your local server
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

6. **Copy the webhook secret** from the Stripe CLI output and update your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
   ```

## Testing the Payment Flow

1. **Add products to cart** and proceed to checkout
2. **Use Stripe test card numbers**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Authentication: `4000 0025 0000 3155`
3. **Use any future expiry date** (e.g., 12/25)
4. **Use any 3-digit CVC** (e.g., 123)
5. **Use any ZIP code** (e.g., 12345)

## Environment Variables Explained

- `NEXT_PUBLIC_SITE_URL`: Your site's base URL (localhost for development)
- `STRIPE_SECRET_KEY`: Server-side Stripe key (never expose to client)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Client-side Stripe key (safe to expose)
- `STRIPE_WEBHOOK_SECRET`: Validates webhook authenticity

## Production Setup

1. **Update environment variables** with production values:

   - Use live Stripe keys from https://dashboard.stripe.com/apikeys
   - Set `NEXT_PUBLIC_SITE_URL` to your production domain
   - Configure webhook endpoint in Stripe Dashboard at your domain

2. **Configure webhook endpoint** in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`

## Troubleshooting

### "Invalid URL" Error

- Ensure `NEXT_PUBLIC_SITE_URL` is set correctly
- For local development, use `http://localhost:3000`
- For production, use your full HTTPS domain

### Webhook Not Receiving Events

- Ensure Stripe CLI is running with `stripe listen`
- Check that webhook secret matches the CLI output
- Verify the webhook endpoint is accessible

### Payment Not Processing

- Check Stripe Dashboard logs for detailed error messages
- Ensure test mode is enabled during development
- Verify all required environment variables are set

## Support

- Stripe Documentation: https://stripe.com/docs
- Test Cards: https://stripe.com/docs/testing#cards
- Webhook Testing: https://stripe.com/docs/webhooks/test
