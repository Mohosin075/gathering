# Stripe Webhook Signature Verification Fix

## Current Issue

```
❌ Webhook signature verification failed: No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe?
```

## Root Causes (In Order of Likelihood)

### 1. ⭐ WRONG WEBHOOK SECRET (Most Common)

**Check this first:**

- Go to Stripe Dashboard → Developers → Webhooks
- Find your webhook endpoint (should be `yourdomain.com/webhook`)
- Click on it and scroll to "Signing secret"
- Copy the secret that starts with `whsec_` (NOT the API key)
- Paste it in your `.env` file as `WEBHOOK_SECRET=whsec_xxxxx`

**⚠️ DO NOT confuse with:**

- API Secret Key (sk_live_xxx or sk_test_xxx)
- Publishable Key (pk_live_xxx or pk_test_xxx)
- API Key (different format)

### 2. 🔍 ENV VARIABLE ISSUES

Add these checks to your `.env` file:

```bash
# Verify NO spaces around the value
WEBHOOK_SECRET=whsec_xxxxx

# NOT like this:
WEBHOOK_SECRET= whsec_xxxxx  # ❌ Leading space
WEBHOOK_SECRET=whsec_xxxxx   # ❌ Trailing space
```

### 3. 🔗 STRIPE TEST vs LIVE MODE

- Are you testing in **Stripe Test Mode**? Use test webhook secret (whsec*test*...)
- Are you in **Production**? Use live webhook secret (whsec*live*...)
- Must match your API key mode (test or live)

### 4. 🌍 WEBHOOK ENDPOINT URL MISMATCH

- Stripe Dashboard → Developers → Webhooks
- Check that your endpoint URL matches where Stripe sends webhooks
- Should be: `https://yourdomain.com/webhook`
- NOT: `https://yourdomain.com/api/v1/payment/webhook`

### 5. 📱 FIREWALL/PROXY ISSUES

If using a third-party tool to test (Postman, curl, ngrok, etc.):

- The request body must be **exact binary data**, not JSON-encoded
- Use: `raw` body type in Postman, not `JSON`
- If using `curl`: `curl --data-binary @payload.json https://yoururl.com/webhook`

## Testing Steps

### Step 1: Verify Secret is Loaded Correctly

Run the test endpoint:

```bash
curl -X POST http://localhost:3000/webhook-test \
  -H "stripe-signature: test" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Check your server logs for:

```
🔬 WEBHOOK TEST - Diagnostic Information:
=========================================
✍️ Signature from header: test
🔑 Secret from ENV: whsec_xxxxx
📏 Body length: 16
📝 Body content: {"test": "data"}
=========================================
```

### Step 2: Use Stripe CLI for Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login to your account
stripe login

# Forward events to your local webhook
stripe listen --forward-to localhost:3000/webhook

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
```

### Step 3: Test from Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Find your endpoint
3. Click "Send test event"
4. Select event type (e.g., `payment_intent.succeeded`)
5. Check your server logs for success or error

## Solution Checklist

✅ **Do this:**

1. Open your `.env` file
2. Find `WEBHOOK_SECRET=` line
3. Copy the signing secret from Stripe Dashboard (whsec_xxxx)
4. Replace the entire value
5. Restart your server: `npm run start` or `yarn start`
6. Test with Stripe CLI or dashboard

✅ **Verify app.ts middleware order:**

```typescript
const app = express()
app.use(webhookApp) // ✅ BEFORE body parsers
app.use(express.json()) // ✅ AFTER webhookApp
app.use(express.urlencoded({ extended: true }))
// ... rest of middleware
```

✅ **Verify webhook.ts:**

```typescript
webhookApp.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // ✅ Raw body parser
  async (req, res) => {
    // ✅ Use req.body directly (it's already a Buffer)
  },
)
```

## Debug Output Key Points

When you see this in logs:

```
📦 Raw body is Buffer: true ✅
📏 Raw body size: 4060 bytes ✅
🔑 Webhook Secret: ✓ Set ✅
```

But still get verification error, then:

1. **Secret is wrong** - Check character by character in Stripe Dashboard
2. **Secret has whitespace** - Paste carefully, avoid spaces
3. **You're in wrong mode** - Check test vs live in dashboard

## Quick Fix Commands

```bash
# Option 1: Restart with new ENV
export WEBHOOK_SECRET=whsec_xxxxx  # Linux/Mac
set WEBHOOK_SECRET=whsec_xxxxx     # Windows CMD
$env:WEBHOOK_SECRET="whsec_xxxxx"  # Windows PowerShell

npm run start

# Option 2: Use Stripe CLI for testing (doesn't need correct secret)
stripe listen --forward-to localhost:3000/webhook
stripe trigger payment_intent.succeeded
```

## Still Not Working?

1. Check server logs for exact error message
2. Run the `/webhook-test` endpoint and paste the output
3. Verify in Stripe Dashboard that webhook is enabled
4. Check that endpoint shows "recent requests" with matching timestamps
5. Ensure `.env` file is being loaded (check other values like `PORT`, `DATABASE_URL`)

## Files Modified

- `src/webhook.ts` - Enhanced debugging
- `src/app.ts` - Fixed middleware order
- `WEBHOOK_DEBUG.md` - This file

---

**Last Updated:** November 28, 2025
