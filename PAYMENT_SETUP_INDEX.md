# Payment Setup - Complete Index

Start here to understand and implement payments in Proxey.

---

## 📖 Documentation Files

### For Quick Understanding
👉 **Start here:** [PAYMENT_IMPLEMENTATION_SUMMARY.md](./PAYMENT_IMPLEMENTATION_SUMMARY.md)
- High-level overview
- What gets implemented
- 5 phases of implementation
- Timeline and effort estimates

### For Implementation Order
👉 **[PAYMENT_SETUP_QUICK_START.md](./PAYMENT_SETUP_QUICK_START.md)**
- Detailed implementation phases (7 steps)
- Key files to modify
- Stripe setup instructions
- API endpoints summary
- Common issues & solutions
- Data flow diagrams

### For Complete Details
👉 **[PAYMENT_IMPLEMENTATION_GUIDE.md](./PAYMENT_IMPLEMENTATION_GUIDE.md)**
- Part 1: Client payments (save cards)
- Part 2: Provider payouts (bank accounts)
- Part 3: Checkout integration
- Testing checklist
- Production checklist

### For Copy & Paste Code
👉 **[PAYMENT_CODE_SNIPPETS.md](./PAYMENT_CODE_SNIPPETS.md)**
- Server endpoints (ready to copy)
- React components (ready to copy)
- Integration code (ready to copy)
- Environment variables

### For Visual Understanding
👉 **[PAYMENT_DATA_FLOW.md](./PAYMENT_DATA_FLOW.md)**
- 8 detailed ASCII diagrams
- Complete end-to-end flow
- Data storage locations
- Amount calculations
- State transitions

---

## 🚀 Quick Start (30 minutes)

### Step 1: Get Stripe Keys (5 minutes)
1. Go to [stripe.com/dashboard](https://stripe.com/dashboard)
2. Click **Developers** > **API keys**
3. Copy `pk_test_*` (publishable key)
4. Copy `sk_test_*` (secret key)

### Step 2: Add Environment Variables (5 minutes)
**In `server/.env`:**
```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

**In `client/.env`:**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### Step 3: Set Up Webhook (5 minutes)
1. Go to [stripe.com/dashboard](https://stripe.com/dashboard)
2. **Developers** > **Webhooks**
3. **Add endpoint**: `http://localhost:3001/webhook`
4. **Select events**: `charge.succeeded`
5. Copy webhook secret (`whsec_*`)
6. Add to `server/.env` as `STRIPE_WEBHOOK_SECRET`

### Step 4: Start Implementing (15 minutes)
Follow the implementation order in [PAYMENT_SETUP_QUICK_START.md](./PAYMENT_SETUP_QUICK_START.md)

---

## 📋 Implementation Checklist

### Phase 1: Server Endpoints
- [ ] Add client payment endpoints (3 endpoints)
- [ ] Add provider payment endpoints (4 endpoints)
- [ ] Add charge endpoint
- [ ] Update webhook for transfers
- [ ] Test all endpoints with Postman

### Phase 2: Client Components
- [ ] Create PaymentMethodForm component
- [ ] Add to OnboardingPage (Step 3)
- [ ] Test saving a card
- [ ] Verify in Stripe dashboard

### Phase 3: Provider Components
- [ ] Update ProviderOnboardingPage (Step 5)
- [ ] Test connecting bank account
- [ ] Verify in Stripe dashboard

### Phase 4: Booking Checkout
- [ ] Fetch saved payment methods
- [ ] Show payment method selector
- [ ] Implement /api/charge flow
- [ ] Test full payment flow

### Phase 5: Testing
- [ ] Test client card saving (Step 3)
- [ ] Test provider bank connection (Step 5)
- [ ] Test booking payment with saved card
- [ ] Verify automatic transfer to provider
- [ ] Check payout timeline

---

## 🧪 Test Scenarios

### Test Card Numbers
```
4242 4242 4242 4242 - Success
4000 0000 0000 0002 - Decline
4000 0025 0000 3155 - 3D Secure
```

### Test Bank Account
Stripe shows test account numbers on the onboarding form

### Test Flow
1. Sign up as client
2. Go to onboarding Step 3
3. Add test card (4242...)
4. Complete onboarding
5. Sign up as provider (separate account)
6. Go to onboarding Step 5
7. Connect test bank account
8. Create booking and pay
9. Check Stripe dashboard for transfer

---

## 🔍 What Each File Does

| File | Purpose | Read When |
|------|---------|-----------|
| PAYMENT_IMPLEMENTATION_SUMMARY.md | Overview & big picture | You want to understand what's being built |
| PAYMENT_SETUP_QUICK_START.md | Implementation roadmap | You're ready to start building |
| PAYMENT_IMPLEMENTATION_GUIDE.md | Complete reference | You need detailed explanations |
| PAYMENT_CODE_SNIPPETS.md | Copy & paste code | You're actually coding |
| PAYMENT_DATA_FLOW.md | Visual diagrams | You want to see how data flows |
| PAYMENT_SETUP_INDEX.md | This file | You need to find things |

---

## 💻 Files You'll Modify

```
server/
├── server.js ..................... Add 8 endpoints + webhook update
└── .env ......................... Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

client/
├── src/
│  ├── components/
│  │  └── payment/
│  │     ├── PaymentMethodForm.jsx ... CREATE NEW
│  │     └── PaymentMethodForm.css ... CREATE NEW
│  ├── pages/
│  │  ├── OnboardingPage.jsx ....... Add Step 3 payment form
│  │  ├── ProviderOnboardingPage.jsx  Add Step 5 bank connection
│  │  └── BookingConfirmPage.jsx ... Show saved cards + charge
│  └── .env ....................... Add REACT_APP_STRIPE_PUBLISHABLE_KEY
```

---

## 🔑 Key Concepts

### For Clients
- **SetupIntent**: Stripe API call to start saving a card
- **Payment Method**: Saved card reference (ID only)
- **Charge**: Taking money from a saved card
- **Customer**: Stripe customer linked to user account

### For Providers
- **Connected Account**: Stripe account for receiving payouts
- **Express Account**: Stripe hosts the onboarding form
- **Account Link**: URL to Stripe's hosted verification form
- **Transfer**: Moving money from your account to provider's

### For Platform
- **Webhook**: Real-time event from Stripe (payment confirmed)
- **Fee Split**: 20% for you, 80% for provider (customizable)
- **Payout Schedule**: When provider gets their money (1-2 days)
- **PCI Compliance**: Stripe handles compliance, you don't touch cards

---

## ⏱️ Timeline

- **Setup (Stripe keys)**: 10 minutes
- **Server endpoints**: 30 minutes
- **Client components**: 20 minutes
- **Onboarding integration**: 30 minutes
- **Checkout integration**: 20 minutes
- **Testing**: 30 minutes
- **Total**: ~2-3 hours

---

## ❓ Common Questions

**Q: Do I need to store credit card data?**
A: No! Stripe stores it securely. You only store the PaymentMethod ID.

**Q: How do providers get paid?**
A: Automatically after each booking via webhook → transfer → payout

**Q: How long until provider gets money?**
A: 1-2 business days after booking is paid

**Q: Can I change the fee split?**
A: Yes! The code uses 80/20, but you can change it to any percentage

**Q: What if payment fails?**
A: Webhook won't trigger, no transfer created. Client sees error message.

**Q: Can clients delete saved cards?**
A: Yes! There's a DELETE endpoint to remove cards from Stripe

**Q: What about refunds?**
A: You'll need to add a refund endpoint (not included in this guide)

**Q: Is it PCI compliant?**
A: Yes! Stripe handles all compliance. You never touch card data.

---

## 📱 What Users See

### Client Onboarding
```
Step 1: Add Profile Photo
Step 2: Contact Information
Step 3: [NEW] Save Payment Method  ← Card input form appears
  "Add a card to make bookings faster"
  [Card input field]
  "Save this card for future bookings"
  [Save button]

✓ Complete
```

### Provider Onboarding
```
Step 1: Business Information
Step 2: Profile Photo
Step 3: Add Services
Step 4: Set Availability
Step 5: [NEW] Connect Bank Account  ← Button redirects to Stripe
  "We'll deposit your earnings here"
  [Connect Bank Account button]
  → Opens Stripe form (new window)
  → Provider enters bank details
  → Stripe verifies
  → Redirected back

✓ Complete
```

### Booking Checkout
```
SELECT PAYMENT METHOD:
⦿ Visa ending in 4242 (exp. 12/25)
○ Amex ending in 3005 (exp. 08/26)

[Pay $90 button]
```

---

## 🎯 Success Criteria

You'll know it's working when:

- [ ] Client can save a card during onboarding
- [ ] Saved card appears in Stripe dashboard
- [ ] Provider can connect bank account during onboarding
- [ ] Provider account shows verified in Stripe
- [ ] Client can pay for booking with saved card
- [ ] Webhook confirms payment in server logs
- [ ] Transfer appears in Stripe dashboard
- [ ] Provider receives payout in bank account

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "publishable key not set" | Add `REACT_APP_STRIPE_PUBLISHABLE_KEY` to `client/.env` |
| Payment form not rendering | Check `@stripe/react-stripe-js` is installed |
| Card saves but no charge | Verify `customerId` is saved to profile |
| No payout to provider | Check `stripeAccountId` is in webhook metadata |
| Webhook not triggering | Test with `stripe listen --forward-to localhost:3001/webhook` |
| Transfer fails | Verify provider's Stripe account status in dashboard |

---

## 📚 Additional Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Payment Methods**: https://stripe.com/docs/payments/save-and-reuse
- **Stripe Connect**: https://stripe.com/docs/connect
- **React Stripe**: https://stripe.com/docs/stripe-js/react
- **Stripe Testing**: https://stripe.com/docs/testing

---

## 🎉 You're Ready!

1. Read [PAYMENT_IMPLEMENTATION_SUMMARY.md](./PAYMENT_IMPLEMENTATION_SUMMARY.md) (10 min)
2. Get Stripe keys (5 min)
3. Follow [PAYMENT_SETUP_QUICK_START.md](./PAYMENT_SETUP_QUICK_START.md) phases (2-3 hours)
4. Copy code from [PAYMENT_CODE_SNIPPETS.md](./PAYMENT_CODE_SNIPPETS.md)
5. Test everything
6. Go live!

Questions? Check [PAYMENT_DATA_FLOW.md](./PAYMENT_DATA_FLOW.md) for diagrams or [PAYMENT_IMPLEMENTATION_GUIDE.md](./PAYMENT_IMPLEMENTATION_GUIDE.md) for details.
