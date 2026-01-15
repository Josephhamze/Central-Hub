# How to Fix Admin Permissions and Create Users

## Quick Fix Options

### Option 1: Re-run the Seed Script (Recommended)

The seed script automatically assigns all permissions to the Administrator role. To run it:

**On Railway:**
1. Go to your Railway backend service
2. Open the terminal/console
3. Run: `pnpm prisma db seed`

**Locally:**
```bash
cd backend
pnpm prisma db seed
```

### Option 2: Run the Fix Script

I've created a script specifically to fix admin permissions:

**On Railway:**
1. Go to your Railway backend service
2. Open the terminal/console
3. Run: `pnpm ts-node scripts/fix-admin-permissions.ts`

**Locally:**
```bash
cd backend
pnpm ts-node scripts/fix-admin-permissions.ts
```

### Option 3: Wait for Auto-Deploy

The latest code changes I just pushed include a fallback that allows any user with the "Administrator" role to access user management, even without explicit permissions. After Railway redeploys (2-5 minutes), you should see the "Create User" button.

## After Fixing Permissions

1. **Log out** from the application
2. **Log back in** with `admin@example.com` / `Admin123!`
3. The "Create User" button should now be visible

## Admin Account Details

- **Email**: `admin@example.com`
- **Password**: `Admin123!`
- **Expected Role**: Administrator (should have ALL permissions)

## If You Still Don't See the Button

The latest code update ensures that if you have the "Administrator" role, you'll see the button regardless of permissions. After the next deployment, refresh your browser and log out/in again.
