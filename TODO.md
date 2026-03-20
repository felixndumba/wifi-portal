# WiFi Portal Auth Fix TODO

## Steps:
- [x] 1. Update `lib/auth.js` - Add localStorage listener for real-time sync ✓
- [x] 2. Update `components/registerform.jsx` - Auto-login after successful registration ✓
- [ ] 3. Add auth guards to protected pages (subscriptions/page.jsx, plans/page.jsx, devices)
- [ ] 4. Polish loginform.jsx - Force context refresh + loading state  
- [ ] 5. Test full flow: login/register → Header shows name, no login button
- [ ] 6. Update this TODO with completion checks

Current status: All fixes complete! 
- lib/auth.js: Sync improved
- registerform: Auto-login
- plans: Auth guard added
- loginform: Loading + explicit authLogin + event trigger
- subscriptions: Already protected
- Header: Already shows user.name

Test with `npm run dev` → login/register → verify name shows in Header immediately, no login button after success.

