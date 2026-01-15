# How to Assign Administrator Role to Your Account

## Quick Method: Run the Script

I've created a script to assign the Administrator role (which has ALL permissions) to your account.

### On AWS EC2 Backend:

1. SSH into your EC2 instance
2. Navigate to the backend directory
3. Run:
   ```bash
   docker-compose exec backend pnpm ts-node scripts/assign-admin-to-user.ts your-email@example.com
   ```

### Locally:

```bash
cd backend
pnpm ts-node scripts/assign-admin-to-user.ts your-email@example.com
```

## What This Does:

1. Finds your user account by email
2. Assigns the "Administrator" role to your account
3. Ensures the Administrator role has ALL permissions
4. You'll then have full access to everything

## After Running:

1. **Log out** from the application
2. **Log back in** with your account
3. You should now see all create buttons and have full access

## Alternative: Manual SQL (if you have database access)

If you prefer to do it manually via SQL:

```sql
-- Get your user ID
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Get Administrator role ID
SELECT id, name FROM roles WHERE name = 'Administrator';

-- Assign role (replace USER_ID and ROLE_ID with actual values)
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES ('USER_ID', 'ROLE_ID', NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;
```

## Verify It Worked:

After logging back in, you should:
- See "Create User" button on User Management page
- See "Create Role" button on Roles Management page
- Have access to all other management pages
- See all create buttons throughout the application
