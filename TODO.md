## TODO
- [ ] Update payment modal in `app/plans/page.jsx` to collect mobile number for M-Pesa
- [ ] Add M-Pesa STK Push initiation endpoint (sandbox keys) `POST /api/payments/mpesa/stkpush`
- [ ] Add M-Pesa callback endpoint `POST /api/payments/mpesa/callback`
- [ ] Add M-Pesa helper/service `lib/mpesa.js` (OAuth token + password generation)
- [ ] Wire `handlePayNow` in `app/plans/page.jsx` to call STK Push API and return `checkoutRequestId`
- [ ] (Demo) Store payment reference for matching callback -> subscription/payment (if applicable)

- [ ] Run local dev server and manually verify STK push initiation + callback handling logs

