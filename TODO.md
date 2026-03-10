# WiFi Portal - Full Implementation TODO

## Phase 1: Setup & Dependencies
- [ ] 1. Install dependencies: prisma, @prisma/client, bcryptjs, jsonwebtoken, zod
- [ ] 2. Initialize Prisma with MySQL
- [ ] 3. Create Prisma schema with new models

## Phase 2: Database Schema
- [ ] 4. Update setup-database.sql with new tables: Plan, Device, Payment
- [ ] 5. Run migration to create tables
- [ ] 6. Seed initial plans data

## Phase 3: API Routes
- [ ] 7. POST /api/register - with bcrypt password hashing
- [ ] 8. POST /api/login - with JWT token authentication
- [ ] 9. GET /api/plans - returns all available plans
- [ ] 10. POST /api/subscribe - creates subscription after payment
- [ ] 11. GET /api/devices - returns user devices (protected)
- [ ] 12. POST /api/change-device - replace device MAC address (protected)

## Phase 4: Admin Features
- [ ] 13. Create /app/admin/page.jsx for plan management
- [ ] 14. Create API for admin to update plans
- [ ] 15. Create payment modal component

## Phase 5: Frontend Integration
- [ ] 16. Update plans page to use new API
- [ ] 17. Add payment modal to plans
- [ ] 18. Update device pages to use new API

