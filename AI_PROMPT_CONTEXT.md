# AI Prompt Context — Operations Control Panel

> **Purpose**: This file documents the architecture, design system, and conventions of the Operations Control Panel. Feed this file to AI assistants (Cursor, Claude, ChatGPT) when developing new modules or features to ensure consistency.

---

## 1. Project Overview

### Purpose
The Operations Control Panel (OCP) is a **production-grade, standalone web application** designed as a foundational platform for comprehensive operations management systems. It provides:

- Premium, Apple-grade UI/UX
- Authentication with JWT + refresh tokens
- Role-based access control (RBAC)
- Theme system (Light / Dark / System)
- Modular, extensible architecture

### Current State
The platform is in **core skeleton state** — all infrastructure, authentication, RBAC, and UI shell are implemented. Module pages are placeholders ready for business logic implementation.

### Architectural Philosophy
- **Separation of concerns**: Clear boundaries between frontend, backend, and database layers
- **No business logic in skeleton**: All modules are structural placeholders
- **No mock data**: Only system entities (users, roles, permissions) exist
- **Premium UI as requirement**: Design quality is non-negotiable
- **Extensibility first**: Architecture supports modular feature additions

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| React Router | 7.x | Routing |
| TailwindCSS | 3.x | Styling with custom tokens |
| TanStack Query | 5.x | Server state management |
| Axios | 1.x | HTTP client |
| Lucide React | Latest | Icon system |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| NestJS | 10.x | Framework |
| TypeScript | 5.x | Type safety |
| Prisma | 6.x | ORM |
| PostgreSQL | 16+ | Database |
| Passport JWT | 4.x | Authentication |
| Swagger | 8.x | API documentation |

### Authentication Model
- **JWT Access Tokens**: Short-lived (15 minutes default)
- **Refresh Tokens**: Long-lived (7 days default), stored in database
- **Token rotation**: New refresh token issued on each refresh
- **Automatic refresh**: Frontend handles 401 responses automatically

### Theme System
- **CSS Variables**: All colors defined as CSS custom properties
- **Three modes**: `light`, `dark`, `system`
- **Persisted preference**: Stored in `localStorage` and synced to user profile
- **Smooth transitions**: 200ms transition on theme changes
- **System detection**: Responds to `prefers-color-scheme` media query

---

## 3. Global Design System

### Design Philosophy
The UI follows an **Apple-grade design philosophy**:
- **Minimal**: Remove everything unnecessary
- **Precise**: Exact spacing, consistent alignment
- **Calm**: Soft colors, subtle shadows, no visual noise
- **Premium**: Every element feels intentional and polished
- **Consistent**: Same patterns everywhere

### Layout Rules
```
┌─────────────────────────────────────────────────────┐
│ Header (h-16, sticky, blur backdrop)                │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Main Content                             │
│ w-64     │ p-6, max-w-7xl                           │
│ (or 72px │                                          │
│ collapsed)│                                         │
│          │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

- **Sidebar**: 256px expanded, 72px collapsed
- **Header**: 64px height, sticky, backdrop-blur
- **Content**: 24px padding, max-width 1280px (7xl)
- **Content area**: Scrollable independently

### Typography Scale
```css
text-2xs:  0.625rem (10px)  /* Smallest labels */
text-xs:   0.75rem  (12px)  /* Badges, hints */
text-sm:   0.8125rem (13px) /* Secondary text */
text-base: 0.875rem (14px)  /* Body text */
text-lg:   1rem     (16px)  /* Section headers */
text-xl:   1.125rem (18px)  /* Card titles */
text-2xl:  1.25rem  (20px)  /* Page titles */
text-3xl:  1.5rem   (24px)  /* Hero text */
```

**Font Family**: SF Pro Display/Text (Apple), with Segoe UI, Roboto fallbacks

### Spacing System
Base unit: 4px (0.25rem)

| Class | Value | Use Case |
|-------|-------|----------|
| `p-1` | 4px | Tight icon buttons |
| `p-2` | 8px | Small buttons, badges |
| `p-3` | 12px | Medium elements |
| `p-4` | 16px | Cards padding (small) |
| `p-6` | 24px | Cards padding (standard) |
| `p-8` | 32px | Cards padding (large) |
| `gap-2` | 8px | Tight element groups |
| `gap-4` | 16px | Standard gaps |
| `gap-6` | 24px | Section gaps |

### Color Token Strategy

All colors use CSS variables for theme switching:

```css
/* Backgrounds */
--bg-primary      /* Main app background */
--bg-secondary    /* Page background */
--bg-tertiary     /* Card backgrounds, inputs */
--bg-elevated     /* Floating elements */
--bg-hover        /* Hover states */
--bg-active       /* Active/pressed states */

/* Text */
--text-primary    /* Main text */
--text-secondary  /* Supporting text */
--text-tertiary   /* Muted text */
--text-muted      /* Disabled/placeholder */
--text-inverse    /* Text on dark backgrounds */

/* Borders */
--border-default  /* Standard borders */
--border-subtle   /* Barely visible borders */
--border-strong   /* Emphasized borders */

/* Accents */
--accent-primary       /* Primary action color */
--accent-primary-hover /* Primary hover state */
--accent-secondary     /* Secondary action color */

/* Status */
--status-success    /* Success state */
--status-success-bg /* Success background */
--status-warning    /* Warning state */
--status-warning-bg /* Warning background */
--status-error      /* Error state */
--status-error-bg   /* Error background */
--status-info       /* Info state */
--status-info-bg    /* Info background */
```

### Light/Dark Mode Behavior
- **Light**: Whites and grays, subtle shadows
- **Dark**: True blacks (#0a0a0a base), elevated surfaces slightly lighter
- **Transitions**: 200ms ease on background and text color changes
- **Dark mode is designed**, not just inverted colors

---

## 4. Reusable UI Components

### Component Library Location
`frontend/src/components/`

### Core Components

#### `Button`
```tsx
import { Button } from '@components/ui/Button';

// Variants: primary, secondary, ghost, danger
// Sizes: sm, md, lg
<Button variant="primary" size="md" isLoading={false}>
  Save
</Button>
<Button leftIcon={<Plus />} rightIcon={<ArrowRight />}>
  Add Item
</Button>
```

#### `Input`
```tsx
import { Input } from '@components/ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  error="Invalid email"
  hint="We'll never share your email"
  leftIcon={<Mail />}
  rightIcon={<Check />}
/>
```

#### `Card`
```tsx
import { Card, CardHeader } from '@components/ui/Card';

// Variants: default, elevated, outlined
// Padding: none, sm, md, lg
<Card variant="default" padding="md">
  <CardHeader
    title="Section Title"
    description="Optional description"
    action={<Button size="sm">Action</Button>}
  />
  {/* Content */}
</Card>
```

#### `Badge`
```tsx
import { Badge } from '@components/ui/Badge';

// Variants: default, success, warning, error, info
// Sizes: sm, md
<Badge variant="success">Active</Badge>
```

#### `EmptyState`
```tsx
import { EmptyState } from '@components/ui/EmptyState';

<EmptyState
  icon={<Inbox className="w-8 h-8" />}
  title="No items found"
  description="Create your first item to get started"
  action={<Button>Create Item</Button>}
/>
```

#### `Modal`
```tsx
import { Modal, ModalFooter } from '@components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  description="Are you sure?"
  size="md" // sm, md, lg, xl
>
  {/* Content */}
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button onClick={onConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

#### `Toast` (via useToast hook)
```tsx
import { useToast } from '@contexts/ToastContext';

const { success, error, warning, info } = useToast();

success('Item saved successfully');
error('Failed to save item');
warning('This action cannot be undone');
info('Processing your request');
```

#### `ThemeToggle`
```tsx
import { ThemeToggle } from '@components/ui/ThemeToggle';

<ThemeToggle /> // Dropdown with Light/Dark/System options
```

### Layout Components

#### `AppLayout`
Main application shell with sidebar and header. Used as route element wrapper.

#### `Sidebar`
Collapsible navigation with icons and labels. Controlled by `AppLayout`.

#### `Header`
Sticky header with breadcrumbs, theme toggle, notifications, and user menu.

#### `PageContainer`
Standard page wrapper with optional title, description, and actions.
```tsx
<PageContainer
  title="Inventory"
  description="Manage your stock items"
  actions={<Button>Add Item</Button>}
>
  {/* Page content */}
</PageContainer>
```

#### `ProtectedRoute`
Route wrapper that checks authentication and optionally permissions/roles.
```tsx
<ProtectedRoute requiredPermissions={['inventory:create']}>
  <CreateItemPage />
</ProtectedRoute>
```

---

## 5. Routing Conventions

### Module-Based Pattern
```
/                       → Redirects to /dashboard
/login                  → Public - Login page
/register               → Public - Registration page
/dashboard              → Dashboard module
/administration/*       → Administration module
/operations/*           → Operations module
/production/*           → Production tracking module
/costing/*              → Costing module
/inventory/*            → Inventory & warehousing module
/assets/*               → Assets & maintenance module
/logistics/*            → Logistics & transport module
/customers/*            → Customers & sales module
/reporting/*            → Reporting & analytics module
/profile                → User profile
```

### Adding Module Subroutes
Use nested routes within each module:
```
/inventory              → Overview / list
/inventory/items        → Items list
/inventory/items/:id    → Item detail
/inventory/items/new    → Create item
/inventory/warehouses   → Warehouses list
```

### URL Naming Conventions
- Lowercase, hyphenated: `/production-lines`, not `/productionLines`
- Plural for collections: `/items`, `/warehouses`
- Singular for actions: `/item/new`, `/warehouse/:id/edit`
- ID parameters: `:id` (CUID format)

---

## 6. API Conventions

### Endpoint Naming
```
Base: /api/v1

GET    /api/v1/{module}              → List all
GET    /api/v1/{module}/:id          → Get one
POST   /api/v1/{module}              → Create
PUT    /api/v1/{module}/:id          → Full update
PATCH  /api/v1/{module}/:id          → Partial update
DELETE /api/v1/{module}/:id          → Delete
```

### Response Shape
```typescript
// Success
{
  "success": true,
  "data": { /* response payload */ },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/v1/users"
  }
}

// Paginated Success
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  },
  "meta": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "details": { /* optional validation errors */ }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/v1/users/123"
  }
}
```

### Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `BAD_REQUEST` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not permitted |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `UNPROCESSABLE_ENTITY` | 422 | Validation failed |
| `INTERNAL_ERROR` | 500 | Server error |
| `NOT_IMPLEMENTED` | 501 | Feature not ready |

### Versioning
- URL-based: `/api/v1/...`
- No version in request body
- Version bump = breaking changes only

---

## 7. RBAC Model

### Role Structure
Predefined system roles:
| Role | Description |
|------|-------------|
| `Administrator` | Full system access |
| `Manager` | View + update permissions |
| `Operator` | Operational module access |
| `Viewer` | Read-only access |

### Permission Format
```
{module}:{action}

Examples:
- inventory:view
- inventory:create
- inventory:update
- inventory:delete
- system:manage_users
- system:manage_roles
```

### Adding New Permissions
1. Add to seed file: `backend/prisma/seed.ts`
2. Define module and action in permission data
3. Run `pnpm prisma db seed`
4. Assign to roles as needed

### Permission Checking

**Backend** (NestJS):
```typescript
import { Permissions } from '@common/decorators/permissions.decorator';
import { RbacGuard } from '@common/guards/rbac.guard';

@UseGuards(RbacGuard)
@Permissions('inventory:create')
@Post()
create(@Body() dto: CreateItemDto) { ... }
```

**Frontend** (React):
```tsx
import { useAuth } from '@contexts/AuthContext';

const { hasPermission, hasRole } = useAuth();

if (hasPermission('inventory:create')) {
  // Show create button
}

// Or in routes:
<ProtectedRoute requiredPermissions={['inventory:create']}>
  <CreatePage />
</ProtectedRoute>
```

---

## 8. How to Extend the System

### Adding a New Module

#### Step 1: Backend Module
```bash
# Create module folder structure
backend/src/modules/{module-name}/
├── {module-name}.module.ts
├── {module-name}.controller.ts
├── {module-name}.service.ts
└── dto/
    ├── create-{entity}.dto.ts
    └── update-{entity}.dto.ts
```

#### Step 2: Database Schema
```prisma
// backend/prisma/schema.prisma

model {EntityName} {
  id        String   @id @default(cuid())
  // ... fields
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("{table_name}")
}
```

Run: `pnpm prisma migrate dev --name add_{entity}`

#### Step 3: Register Module
```typescript
// backend/src/app.module.ts
import { {ModuleName}Module } from './modules/{module-name}/{module-name}.module';

@Module({
  imports: [
    // ... existing modules
    {ModuleName}Module,
  ],
})
export class AppModule {}
```

#### Step 4: Frontend Pages
```
frontend/src/pages/{module-name}/
├── {ModuleName}Page.tsx      // Overview/list
├── {Entity}ListPage.tsx      // Entity list
├── {Entity}DetailPage.tsx    // Entity detail
└── {Entity}FormPage.tsx      // Create/edit form
```

#### Step 5: Add Routes
```tsx
// frontend/src/App.tsx
<Route path="{module-name}/*" element={<{ModuleName}Page />}>
  <Route index element={<{Entity}ListPage />} />
  <Route path=":id" element={<{Entity}DetailPage />} />
  <Route path="new" element={<{Entity}FormPage />} />
  <Route path=":id/edit" element={<{Entity}FormPage />} />
</Route>
```

#### Step 6: Add Navigation
```tsx
// frontend/src/components/layout/Sidebar.tsx
const navigation: NavItem[] = [
  // ... existing items
  { name: '{Module Name}', path: '/{module-name}', icon: {Icon} },
];
```

### Converting Placeholder to Real Feature

1. **Replace empty state** with actual data fetching
2. **Implement service methods** in backend
3. **Create proper DTOs** for validation
4. **Add database queries** using Prisma
5. **Build form components** for CRUD operations
6. **Wire up API calls** using TanStack Query
7. **Add proper error handling** and loading states

### Where Business Logic Lives

| Location | What Goes There |
|----------|-----------------|
| `backend/src/modules/{module}/service.ts` | Business rules, validation, complex operations |
| `backend/src/modules/{module}/controller.ts` | HTTP handling, input validation, response formatting |
| `frontend/src/hooks/` | Complex state logic, data fetching hooks |
| `frontend/src/services/` | API client functions |
| `frontend/src/pages/` | Page-specific UI logic |
| `frontend/src/components/` | Reusable UI components (no business logic) |

---

## 9. Prompt Usage Instructions

### How to Use This File

When prompting an AI assistant to build a new feature:

1. **Include this entire file** in your context
2. **Reference specific sections** relevant to your task
3. **Follow the conventions** documented here
4. **Use existing patterns** from the codebase

### Example Prompts

#### Adding a New CRUD Module
```
Using the existing design system and architecture defined in 
AI_PROMPT_CONTEXT.md, build out the Inventory module with:

- Stock Items entity (name, SKU, description, quantity, unit, reorder level)
- Full CRUD operations
- List page with search and pagination
- Detail page with stock movements history
- Create/Edit form with validation

Follow the established patterns for:
- API response format
- Component usage
- Permission checks
- Error handling
```

#### Adding a Feature to Existing Module
```
Using AI_PROMPT_CONTEXT.md as reference, add a "Stock Transfer" 
feature to the Inventory module:

- Transfer stock between warehouses
- Validation for available quantity
- Audit trail of transfers
- Form with source/destination warehouse selection

Use the existing Card, Button, Input components and follow 
the API conventions documented.
```

#### Creating a Dashboard Widget
```
Based on the design system in AI_PROMPT_CONTEXT.md, create a 
"Low Stock Alert" dashboard widget that:

- Shows items below reorder level
- Uses the Card component with CardHeader
- Displays Badge for severity (warning/error)
- Links to item detail pages
- Follows the established color and spacing system
```

### Key Points for Effective Prompts

1. **Always reference this file** to maintain consistency
2. **Be specific** about which module/feature you're building
3. **List required fields/entities** explicitly
4. **Mention which components** to use from the design system
5. **Include permission requirements** if the feature needs RBAC
6. **Specify any integrations** with other modules

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ OPERATIONS CONTROL PANEL - QUICK REFERENCE                  │
├─────────────────────────────────────────────────────────────┤
│ API Base:        /api/v1                                    │
│ Auth Header:     Authorization: Bearer {token}              │
│ Theme Storage:   localStorage key: 'theme'                  │
│ Token Storage:   localStorage key: 'auth_tokens'            │
├─────────────────────────────────────────────────────────────┤
│ COMPONENT IMPORTS                                           │
│ @components/ui/Button     - Button, variants                │
│ @components/ui/Input      - Input with icons                │
│ @components/ui/Card       - Card, CardHeader                │
│ @components/ui/Badge      - Status badges                   │
│ @components/ui/Modal      - Modal, ModalFooter              │
│ @components/ui/EmptyState - Empty states                    │
│ @components/ui/Toast      - Via useToast hook               │
│ @components/layout/*      - Layout components               │
├─────────────────────────────────────────────────────────────┤
│ CONTEXT HOOKS                                               │
│ useAuth()    - { user, login, logout, hasPermission }       │
│ useTheme()   - { theme, resolvedTheme, setTheme }           │
│ useToast()   - { success, error, warning, info }            │
├─────────────────────────────────────────────────────────────┤
│ DECORATORS (Backend)                                        │
│ @Public()              - Skip auth                          │
│ @Permissions('...')    - Require permissions                │
│ @CurrentUser()         - Get current user                   │
└─────────────────────────────────────────────────────────────┘
```

---

*Last updated: Initial skeleton release*


---

## 8. Assets & Maintenance Module

### Overview
The Assets & Maintenance module provides comprehensive lifecycle management for physical assets, preventive and corrective maintenance, work order execution, spare parts inventory, and depreciation tracking.

### Database Schema

**Models:**
- `Asset` - Physical asset registry
- `MaintenanceSchedule` - Preventive maintenance schedules
- `WorkOrder` - Maintenance work orders (preventive + corrective)
- `SparePart` - Spare parts inventory
- `PartUsage` - Parts consumption tracking
- `AssetHistory` - Immutable audit log
- `DepreciationProfile` - Depreciation configuration
- `DepreciationEntry` - Monthly depreciation entries

**Enums:**
- `AssetStatus`: OPERATIONAL, MAINTENANCE, BROKEN, RETIRED
- `AssetCriticality`: LOW, MEDIUM, HIGH
- `MaintenanceScheduleType`: TIME_BASED, USAGE_BASED
- `WorkOrderType`: PREVENTIVE, CORRECTIVE, INSPECTION
- `WorkOrderPriority`: LOW, MEDIUM, HIGH, CRITICAL
- `WorkOrderStatus`: OPEN, IN_PROGRESS, WAITING_PARTS, COMPLETED, CANCELLED
- `DepreciationMethod`: STRAIGHT_LINE, DECLINING_BALANCE
- `AssetHistoryEventType`: CREATED, STATUS_CHANGED, MAINTENANCE_DONE, WORK_ORDER_COMPLETED, PART_CONSUMED, COST_UPDATED, RETIRED

**Key Relations:**
- Asset → Project, Warehouse
- Asset → MaintenanceSchedules, WorkOrders, History, DepreciationProfile
- WorkOrder → Asset, MaintenanceSchedule, User (assignedTo), PartUsages
- SparePart → Warehouse
- PartUsage → WorkOrder, SparePart

### Backend Modules

**Location:** `backend/src/modules/`

1. **Assets Module** (`assets/`)
   - `assets.service.ts` - CRUD, retire, history, overview
   - `assets.controller.ts` - REST endpoints
   - DTOs: `create-asset.dto.ts`, `update-asset.dto.ts`

2. **Maintenance Schedules Module** (`maintenance-schedules/`)
   - `maintenance-schedules.service.ts` - CRUD, overdue detection, auto-calculate nextDueAt
   - `maintenance-schedules.controller.ts` - REST endpoints
   - DTOs: `create-maintenance-schedule.dto.ts`, `update-maintenance-schedule.dto.ts`

3. **Work Orders Module** (`work-orders/`)
   - `work-orders.service.ts` - CRUD, start/complete/cancel, part consumption
   - `work-orders.controller.ts` - REST endpoints
   - DTOs: `create-work-order.dto.ts`, `update-work-order.dto.ts`, `complete-work-order.dto.ts`, `consume-part.dto.ts`

4. **Spare Parts Module** (`spare-parts/`)
   - `spare-parts.service.ts` - CRUD, low stock detection
   - `spare-parts.controller.ts` - REST endpoints
   - DTOs: `create-spare-part.dto.ts`, `update-spare-part.dto.ts`

5. **Depreciation Module** (`depreciation/`)
   - `depreciation.service.ts` - Profile creation, monthly calculation, posting
   - `depreciation.controller.ts` - REST endpoints
   - DTOs: `create-profile.dto.ts`, `run-monthly.dto.ts`

### API Endpoints

**Base:** `/api/v1`

**Assets:**
- `GET /assets/overview` - Get asset health summary
- `GET /assets` - List assets (with pagination, search, status filter)
- `GET /assets/:id` - Get asset details
- `GET /assets/:id/history` - Get asset history
- `POST /assets` - Create asset
- `PUT /assets/:id` - Update asset
- `PATCH /assets/:id/retire` - Retire asset

**Maintenance Schedules:**
- `GET /maintenance-schedules` - List schedules
- `GET /maintenance-schedules/overdue` - Get overdue schedules
- `GET /maintenance-schedules/:id` - Get schedule details
- `POST /maintenance-schedules` - Create schedule
- `PUT /maintenance-schedules/:id` - Update schedule
- `DELETE /maintenance-schedules/:id` - Delete schedule

**Work Orders:**
- `GET /work-orders` - List work orders
- `GET /work-orders/:id` - Get work order details
- `POST /work-orders` - Create work order
- `PUT /work-orders/:id` - Update work order
- `PATCH /work-orders/:id/start` - Start work order
- `PATCH /work-orders/:id/complete` - Complete work order
- `PATCH /work-orders/:id/cancel` - Cancel work order
- `POST /work-orders/:id/consume-part` - Consume spare part

**Spare Parts:**
- `GET /spare-parts` - List spare parts
- `GET /spare-parts/low-stock` - Get low stock parts
- `GET /spare-parts/:id` - Get part details
- `POST /spare-parts` - Create part
- `PUT /spare-parts/:id` - Update part
- `DELETE /spare-parts/:id` - Delete part

**Depreciation:**
- `GET /depreciation` - List depreciation profiles
- `GET /depreciation/assets/:assetId` - Get profile for asset
- `POST /depreciation/profiles` - Create profile
- `POST /depreciation/run-monthly` - Run monthly calculation
- `POST /depreciation/post/:assetId/:period` - Post entry
- `POST /depreciation/post-period/:period` - Post all entries for period

### Permissions

**Assets:**
- `assets:view` - View assets
- `assets:create` - Create assets
- `assets:update` - Update assets
- `assets:retire` - Retire assets

**Maintenance:**
- `maintenance:view` - View maintenance schedules
- `maintenance:schedule` - Create/edit schedules
- `maintenance:execute` - Execute maintenance
- `maintenance:approve` - Approve maintenance

**Work Orders:**
- `workorders:view` - View work orders
- `workorders:create` - Create work orders
- `workorders:update` - Update work orders
- `workorders:close` - Close/complete work orders

**Parts:**
- `parts:view` - View spare parts
- `parts:manage` - Manage spare parts

**Depreciation:**
- `depreciation:view` - View depreciation
- `depreciation:manage` - Manage depreciation

### Frontend Routes

**Location:** `frontend/src/pages/assets/`

- `/assets` - Landing page (overview, KPIs, overdue maintenance, open work orders)
- `/assets/registry` - Asset registry (list view with search/filters)
- `/assets/:id` - Asset detail page (tabbed interface)
- `/assets/work-orders` - Work orders list
- `/assets/work-orders/:id` - Work order detail
- `/assets/maintenance/schedules` - Maintenance schedules list
- `/assets/parts` - Spare parts inventory
- `/assets/depreciation` - Depreciation management

### Frontend Services

**Location:** `frontend/src/services/assets/`

- `assets.ts` - Assets API client
- `work-orders.ts` - Work orders API client
- `maintenance.ts` - Maintenance schedules API client
- `parts.ts` - Spare parts API client
- `depreciation.ts` - Depreciation API client

### Business Rules

1. **Asset Management:**
   - AssetTag must be unique
   - Retired assets are read-only
   - Cannot retire asset with open work orders
   - Status changes automatically log to AssetHistory

2. **Maintenance Schedules:**
   - Auto-calculate `nextDueAt` based on type (time-based vs usage-based)
   - Overdue schedules trigger alerts
   - Cannot delete schedule with associated work orders

3. **Work Orders:**
   - Completing a work order:
     - Updates asset status (MAINTENANCE → OPERATIONAL)
     - Logs to asset history
     - Updates maintenance schedule `lastPerformedAt` and `nextDueAt`
     - Consumes spare parts (reduces stock)
     - Calculates total cost (labor + parts)
   - Starting a work order sets asset status to MAINTENANCE
   - Cannot consume more parts than available stock

4. **Spare Parts:**
   - SKU must be unique
   - Low stock warning when quantityOnHand <= minStockLevel
   - Cannot delete part with usage history

5. **Depreciation:**
   - One profile per asset
   - Monthly entries locked once posted
   - Posting updates asset currentValue
   - Straight-line: (Cost - Salvage) / Useful Life / 12
   - Declining balance: Current Book Value * (2 / Useful Life) / 12

### File Structure

```
backend/src/modules/
  assets/
    assets.controller.ts
    assets.service.ts
    assets.module.ts
    dto/
      create-asset.dto.ts
      update-asset.dto.ts
  maintenance-schedules/
    maintenance-schedules.controller.ts
    maintenance-schedules.service.ts
    maintenance-schedules.module.ts
    dto/
      create-maintenance-schedule.dto.ts
      update-maintenance-schedule.dto.ts
  work-orders/
    work-orders.controller.ts
    work-orders.service.ts
    work-orders.module.ts
    dto/
      create-work-order.dto.ts
      update-work-order.dto.ts
      complete-work-order.dto.ts
      consume-part.dto.ts
  spare-parts/
    spare-parts.controller.ts
    spare-parts.service.ts
    spare-parts.module.ts
    dto/
      create-spare-part.dto.ts
      update-spare-part.dto.ts
  depreciation/
    depreciation.controller.ts
    depreciation.service.ts
    depreciation.module.ts
    dto/
      create-profile.dto.ts
      run-monthly.dto.ts

frontend/src/
  pages/assets/
    AssetsPage.tsx
    AssetRegistryPage.tsx
    WorkOrdersPage.tsx
    MaintenanceSchedulesPage.tsx
    SparePartsPage.tsx
    DepreciationPage.tsx
  services/assets/
    assets.ts
    work-orders.ts
    maintenance.ts
    parts.ts
    depreciation.ts
```

### Testing

Key test scenarios:
- Create asset → verify history entry
- Create maintenance schedule → verify nextDueAt calculation
- Create work order → start → consume parts → complete → verify:
  - Asset status updated
  - Schedule updated
  - Parts stock reduced
  - Costs calculated
  - History logged
- Run monthly depreciation → verify entries created
- Post depreciation → verify asset value updated

---

*Last updated: Assets & Maintenance module implementation*
*Version: 1.1.0*


---

## 10. Sales Quote System Implementation

### Summary
A complete Sales Quote Generator system has been implemented end-to-end, including:
- Multi-step quote wizard
- Company, Project, Warehouse, Customer, Contact, StockItem, Route management
- Quote approval workflow
- Sales KPI dashboard
- Full RBAC integration

### Database Schema

**Migration**: `20260102000000_add_sales_quote_system`

**New Models**:
- `Company` - Selling company directory
- `Project` - Projects within companies
- `Warehouse` - Warehouses linked to companies/projects
- `Customer` - Customers (INDIVIDUAL or COMPANY type)
- `Contact` - Customer contacts
- `StockItem` - Products with pricing rules
- `Route` - Delivery routes (admin-only)
- `Toll` - Tolls on routes
- `Quote` - Sales quotes with snapshots
- `QuoteItem` - Quote line items with snapshots
- `QuoteApprovalAudit` - Approval history

**Enums**:
- `CustomerType`: INDIVIDUAL, COMPANY
- `DeliveryMethod`: DELIVERED, COLLECTED
- `QuoteStatus`: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, WON, LOST
- `ApprovalAction`: SUBMIT, APPROVE, REJECT, MARK_WON, MARK_LOST

### Backend Modules

**Location**: `backend/src/modules/`

1. **Companies Module** (`companies/`)
   - CRUD operations
   - Search functionality
   - Validation for deletion (checks for associated data)

2. **Projects Module** (`projects/`)
   - Filtered by company
   - Includes warehouse and stock item counts

3. **Warehouses Module** (`warehouses/`)
   - Filtered by company/project
   - Validation for deletion

4. **Customers Module** (`customers/`)
   - Type-specific validation (INDIVIDUAL vs COMPANY)
   - Search and filtering

5. **Contacts Module** (`contacts/`)
   - Primary contact management
   - Linked to customers

6. **StockItems Module** (`stock-items/`)
   - Project/warehouse allocation
   - Pricing validation (minUnitPrice, defaultUnitPrice)
   - Min order quantity enforcement
   - Truckload-only validation

7. **Routes Module** (`routes/`)
   - Admin-only (routes:view/create/update/delete permissions)
   - Toll management

8. **Quotes Module** (`quotes/`)
   - Quote number generation: `Q-YYYYMM-####` (transactional, unique)
   - Multi-step validation:
     - Company/project/customer validation
     - Stock item validation (min price, min qty, truckload multiples)
     - Transport calculation (distance × costPerKm + tolls)
   - Snapshots on submission (route, delivery address, item details)
   - Approval workflow:
     - DRAFT → PENDING_APPROVAL (submit)
     - PENDING_APPROVAL → APPROVED (approve)
     - PENDING_APPROVAL → REJECTED (reject)
     - APPROVED → WON/LOST (mark outcome)
   - Edit rules:
     - DRAFT: editable by owner
     - REJECTED: editable, resubmittable
     - PENDING_APPROVAL: read-only
     - APPROVED/WON/LOST: locked
   - Sales rep filtering (users see only their quotes unless elevated permission)
   - KPI calculations (total quotes, wins, losses, win rate, avg quote value, pipeline value, won value, avg approval time)

### Permissions

**New Permissions** (seeded in `backend/prisma/seed.ts`):
- `companies:view/create/update/delete`
- `customers:view/create/update/delete`
- `contacts:view/create/update/delete`
- `projects:view/create/update/delete`
- `warehouses:view/create/update/delete`
- `stock:view/create/update/delete`
- `routes:view/create/update/delete` (admin-only)
- `quotes:view/create/update/delete`
- `quotes:submit`
- `quotes:approve`
- `quotes:reject`
- `reporting:view_sales_kpis`

**Role Assignments**:
- Administrator: All permissions
- Manager: View + update permissions
- Operator: View + create + update for quotes (sales reps)
- Viewer: View permissions only

### API Endpoints

**Base Path**: `/api/v1`

**Companies**: `GET/POST/PUT/DELETE /companies`, `GET /companies/:id`
**Projects**: `GET/POST/PUT/DELETE /projects`, `GET /projects/:id`
**Warehouses**: `GET/POST/PUT/DELETE /warehouses`, `GET /warehouses/:id`
**Customers**: `GET/POST/PUT/DELETE /customers`, `GET /customers/:id`
**Contacts**: `GET/POST/PUT/DELETE /contacts`, `GET /contacts/:id`
**Stock Items**: `GET/POST/PUT/DELETE /stock-items`, `GET /stock-items/:id`
**Routes**: `GET/POST/PUT/DELETE /routes`, `GET /routes/:id`, `POST /routes/tolls`, `DELETE /routes/tolls/:id`
**Quotes**:
- `GET /quotes` - List with filters (status, company, project, sales rep, date range)
- `GET /quotes/:id` - Get quote details
- `POST /quotes` - Create quote
- `PUT /quotes/:id` - Update quote (DRAFT/REJECTED only)
- `POST /quotes/:id/submit` - Submit for approval
- `POST /quotes/:id/approve` - Approve quote
- `POST /quotes/:id/reject` - Reject quote
- `POST /quotes/:id/outcome?outcome=WON|LOST` - Mark outcome
- `DELETE /quotes/:id` - Delete quote (DRAFT only)
- `GET /quotes/kpis` - Get sales KPIs

### Frontend Routes

**Location**: `frontend/src/pages/`

- `/sales/quotes/new` - Quote Wizard (multi-step)
- `/sales/quotes` - Quotes Admin Dashboard
- `/reporting/sales-kpis` - Sales KPI Dashboard

**Navigation**: Added "Sales Quotes" to sidebar navigation

### Quote Calculation Formulas

**Transport Calculation**:
```
transportBase = distanceKm × costPerKm
tollTotal = sum(toll.cost for all tolls on route)
transportTotal = transportBase + tollTotal
```

**Quote Totals**:
```
subtotal = sum(item.qty × item.unitPrice for all items)
discountTotal = sum(item.qty × item.discount for all items)
grandTotal = subtotal - discountTotal + transportTotal
```

**Line Item Calculation**:
```
lineTotal = qty × (unitPrice - discount)
```

### Quote Validation Rules

1. **Stock Item Validation**:
   - `unitPrice - discount >= minUnitPrice` (enforced)
   - `qty >= minOrderQty` (enforced)
   - If `truckloadOnly`: `qty % minOrderQty === 0` (enforced)

2. **Delivery Validation**:
   - If `deliveryMethod === DELIVERED`: route and delivery address required

3. **Quote Status Rules**:
   - Only DRAFT and REJECTED quotes can be edited
   - Only DRAFT and REJECTED quotes can be submitted
   - Only PENDING_APPROVAL quotes can be approved/rejected
   - Only APPROVED quotes can be marked WON/LOST

### File Paths

**Backend**:
- Modules: `backend/src/modules/{module-name}/`
- Migration: `backend/prisma/migrations/20260102000000_add_sales_quote_system/`
- Seed: `backend/prisma/seed.ts`

**Frontend**:
- Pages: `frontend/src/pages/{module}/`
- API Services: `frontend/src/services/sales/`
- Quote Wizard: `frontend/src/pages/customers/quotes/QuoteWizardPage.tsx`
- Admin Dashboard: `frontend/src/pages/sales/QuotesAdminPage.tsx`
- KPI Dashboard: `frontend/src/pages/sales/SalesKPIsPage.tsx`

### How to Run and Verify

1. **Run Migration**:
   ```bash
   cd backend
   pnpm prisma migrate deploy
   ```

2. **Seed Permissions**:
   ```bash
   cd backend
   pnpm prisma db seed
   ```

3. **Start Backend**:
   ```bash
   cd backend
   pnpm start:dev
   ```

4. **Start Frontend**:
   ```bash
   cd frontend
   pnpm dev
   ```

5. **Verify**:
   - Login as admin (admin@example.com / Admin123!)
   - Navigate to `/sales/quotes/new` to create a quote
   - Navigate to `/sales/quotes` to view and approve quotes
   - Navigate to `/reporting/sales-kpis` to view KPIs

### Environment Variables

No new environment variables required. Uses existing:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`

---

*Last updated: Sales Quote System implementation*
*Version: 2.0.0*

---

## 10. Routes & Tolls + Route Costing System

### Overview
Production-grade Routes & Tolls system with comprehensive costing engine for transport pricing, validation, and reconciliation. Used by Sales Quote Generator, Costing module, and Reporting.

### Database Schema

**Enums**:
- `VehicleType`: `FLATBED` | `TIPPER`
- `TollPaymentStatus`: `DRAFT` | `SUBMITTED` | `APPROVED` | `POSTED`

**Models**:

1. **Route** (extended existing model):
   - `id`, `fromCity`, `toCity`, `distanceKm`, `costPerKm` (legacy, optional)
   - `timeHours` (Decimal 8,2), `isActive` (Boolean), `notes` (String?), `createdByUserId` (String?)
   - Relations: `tollStations` (RouteTollStation[]), `costingScenarios` (RouteCostingScenario[]), `tollPayments` (TollPayment[]), `snapshots` (RouteSnapshot[]), `creator` (User?)

2. **TollStation**:
   - `id`, `name`, `cityOrArea` (String?), `code` (String? unique), `isActive` (Boolean)
   - Relations: `rates` (TollRate[]), `routeStations` (RouteTollStation[]), `payments` (TollPayment[])

3. **TollRate**:
   - `id`, `tollStationId`, `vehicleType` (VehicleType), `amount` (Decimal 10,2), `currency` (String default 'USD')
   - `effectiveFrom` (DateTime?), `effectiveTo` (DateTime?), `isActive` (Boolean)
   - Relations: `tollStation` (TollStation)

4. **RouteTollStation** (join table):
   - `id`, `routeId`, `tollStationId`, `sortOrder` (Int), `isActive` (Boolean)
   - Unique constraint: `[routeId, tollStationId, sortOrder]`
   - Relations: `route` (Route), `tollStation` (TollStation)

5. **RouteCostProfile**:
   - `id`, `name`, `vehicleType` (VehicleType), `currency` (String default 'USD'), `isActive` (Boolean)
   - `configJson` (JSON) - validated schema for cost components
   - `createdByUserId` (String?)
   - Relations: `creator` (User?), `scenarios` (RouteCostingScenario[])

6. **RouteCostingScenario**:
   - `id`, `routeId`, `costProfileId`, `tripsPerMonth` (Decimal 10,2?), `plannedTonnagePerMonth` (Decimal 10,2?), `isActive` (Boolean)
   - Unique constraint: `[routeId, costProfileId]`
   - Relations: `route` (Route), `costProfile` (RouteCostProfile)

7. **TollPayment**:
   - `id`, `paidAt` (DateTime), `vehicleType` (VehicleType), `routeId` (String?), `tollStationId` (String?)
   - `amount` (Decimal 10,2), `currency` (String default 'USD'), `receiptRef` (String?), `paidByUserId` (String?), `notes` (String?)
   - `status` (TollPaymentStatus default DRAFT)
   - Relations: `route` (Route?), `tollStation` (TollStation?), `paidBy` (User?), `attachments` (TollPaymentAttachment[])

8. **TollPaymentAttachment**:
   - `id`, `tollPaymentId`, `filePath`, `fileName`, `mimeType` (String?)

9. **RouteSnapshot**:
   - `id`, `routeId`, `snapshotJson` (JSON), `createdAt`
   - Used for quote immutability - stores route config at time of quote creation

**Migration**: `backend/prisma/migrations/20260106135743_add_routes_tolls_system/`

### API Endpoints

**Base Path**: `/api/v1`

**Routes Module** (`/routes`):
- `GET /routes` - List routes (filters: fromCity, toCity, isActive, search)
- `GET /routes/:id` - Get route details with toll stations
- `GET /routes/:id/expected-toll?vehicleType=` - Get expected toll total by vehicle type
- `GET /routes/:id/stations` - Get ordered toll stations for route
- `POST /routes` - Create route (requires `logistics:routes:manage`)
- `PUT /routes/:id` - Update route (requires `logistics:routes:manage`)
- `POST /routes/:id/deactivate` - Deactivate route (requires `logistics:routes:manage`)
- `POST /routes/:id/stations` - Set ordered toll stations (requires `logistics:routes:manage`)
- `DELETE /routes/:id` - Delete route (requires `logistics:routes:manage`)

**Toll Stations Module** (`/toll-stations`):
- `GET /toll-stations` - List stations (filters: isActive, search)
- `GET /toll-stations/:id` - Get station with rates
- `GET /toll-stations/:id/rates?vehicleType=` - Get rates for station
- `POST /toll-stations` - Create station (requires `logistics:tolls:manage`)
- `PUT /toll-stations/:id` - Update station (requires `logistics:tolls:manage`)
- `DELETE /toll-stations/:id` - Delete station (requires `logistics:tolls:manage`)
- `POST /toll-stations/:id/rates` - Create rate (requires `logistics:tolls:manage`)
- `PUT /toll-stations/:id/rates/:rateId` - Update rate (requires `logistics:tolls:manage`)
- `DELETE /toll-stations/:id/rates/:rateId` - Delete rate (requires `logistics:tolls:manage`)

**Route Costing Module** (`/cost-profiles`, `/costing`):
- `GET /cost-profiles?vehicleType=` - List cost profiles
- `GET /cost-profiles/:id` - Get cost profile
- `POST /cost-profiles` - Create profile (requires `logistics:costing:manage`)
- `PUT /cost-profiles/:id` - Update profile (requires `logistics:costing:manage`)
- `POST /cost-profiles/:id/activate` - Activate profile (requires `logistics:costing:manage`)
- `DELETE /cost-profiles/:id` - Delete profile (requires `logistics:costing:manage`)
- `POST /costing/calculate` - Calculate route costing (requires `logistics:costing:view`)

**Toll Payments Module** (`/toll-payments`):
- `GET /toll-payments` - List payments (filters: startDate, endDate, routeId, tollStationId, vehicleType, status, paidByUserId)
- `GET /toll-payments/:id` - Get payment
- `POST /toll-payments` - Create payment (requires `logistics:toll_payments:create`)
- `PUT /toll-payments/:id` - Update payment (requires `logistics:toll_payments:create`)
- `POST /toll-payments/:id/submit` - Submit for approval (requires `logistics:toll_payments:create`)
- `POST /toll-payments/:id/approve` - Approve payment (requires `logistics:toll_payments:approve`)
- `POST /toll-payments/:id/post` - Post payment (requires `logistics:toll_payments:post`)
- `DELETE /toll-payments/:id` - Delete payment (requires `logistics:toll_payments:create`)
- `POST /toll-payments/reconcile` - Reconcile expected vs actual (requires `logistics:toll_payments:view`)

### Permissions

**Routes**:
- `logistics:routes:view` - View routes
- `logistics:routes:manage` - Create, update, delete routes

**Tolls**:
- `logistics:tolls:view` - View toll stations and rates
- `logistics:tolls:manage` - Manage toll stations and rates

**Costing**:
- `logistics:costing:view` - View cost profiles and use calculator
- `logistics:costing:manage` - Manage cost profiles

**Toll Payments**:
- `logistics:toll_payments:view` - View payments and reconcile
- `logistics:toll_payments:create` - Create and update payments
- `logistics:toll_payments:approve` - Approve payments
- `logistics:toll_payments:post` - Post payments (finalize)

### Costing Calculation Formulas

**Inputs**:
- `routeId`, `vehicleType`, `costProfileId`, `tonsPerTrip`, `tripsPerMonth` (optional), `includeEmptyLeg` (optional), `profitMarginPercentOverride` (optional)

**Toll Calculation**:
```
tollPerTrip = sum(activeRate.amount for all stations on route where vehicleType matches)
tollPerMonth = tollPerTrip × tripsPerMonth (if provided)
```

**Fuel Cost**:
```
If config.fuel.costPerKm:
  fuelCostPerTrip = costPerKm × distanceKm
Else if config.fuel.costPerUnit && config.fuel.consumptionPerKm:
  consumption = consumptionPerKm × distanceKm
  fuelCostPerTrip = costPerUnit × consumption
```

**Monthly Fixed Costs**:
```
monthlyFixedCosts = communicationsMonthly + laborMonthly + docsGpsMonthly + depreciationMonthly
fixedCostPerTrip = monthlyFixedCosts ÷ tripsPerMonth (if tripsPerMonth > 0, else 0)
```

**Base Trip Cost**:
```
baseTripCost = fuelCostPerTrip + tollPerTrip + overheadPerTrip + fixedCostPerTrip
```

**Empty Leg Handling**:
```
If includeEmptyLeg:
  effectiveDistanceKm = distanceKm × (1 + emptyLegFactor)
  returnFuelCost = fuelCostPerTrip × emptyLegFactor
  baseTripCost = baseTripCost + returnFuelCost
  effectiveTonsPerKm = tonsPerTrip × effectiveDistanceKm
Else:
  effectiveDistanceKm = distanceKm
  effectiveTonsPerKm = tonsPerTrip × distanceKm
```

**Cost Per Ton Per Km**:
```
costPerTonPerKm = baseTripCost ÷ effectiveTonsPerKm
```

**Cost Per Ton Per Km Including Empty Leg** (always calculated with return leg):
```
If includeEmptyLeg:
  costPerTonPerKmIncludingEmptyLeg = costPerTonPerKm
Else:
  returnDistanceKm = distanceKm × (1 + emptyLegFactor)
  returnTonsPerKm = tonsPerTrip × returnDistanceKm
  returnBaseCost = baseTripCost + (fuelCostPerTrip × emptyLegFactor)
  costPerTonPerKmIncludingEmptyLeg = returnBaseCost ÷ returnTonsPerKm
```

**Sales Price**:
```
profitMarginPercent = profitMarginPercentOverride || config.profitMarginPercent || 0
salesPriceWithProfitMargin = baseTripCost × (1 + profitMarginPercent ÷ 100)
salesPricePerTon = salesPriceWithProfitMargin ÷ tonsPerTrip
```

**Total Cost Per Month**:
```
totalCostPerMonth = baseTripCost × tripsPerMonth (if tripsPerMonth provided)
```

**Important Notes**:
- All calculations use `Decimal` type (no floats)
- Empty leg factor defaults to 1.0 if not specified
- If `effectiveTonsPerKm` is zero, calculation throws error
- Profit margin is applied deterministically as documented above

### Frontend Routes

- `/logistics/routes` - Routes list page
- `/logistics/routes/new` - Create route form
- `/logistics/routes/:id` - Route detail page (tabs: Overview, Stations, Costing, History)
- `/logistics/routes/:id/edit` - Edit route form
- `/logistics/toll-stations` - Toll stations CRUD page
- `/logistics/toll-payments` - Toll payments ledger page
- `/logistics/route-costing` - Route costing calculator page

**Navigation**: Routes & Tolls system accessible under "Logistics" section in sidebar

### Frontend Services

**Location**: `frontend/src/services/logistics/`

- `routes.ts` - Routes API service
- `toll-stations.ts` - Toll stations API service
- `route-costing.ts` - Cost profiles and calculation API service
- `toll-payments.ts` - Toll payments API service

### File Paths

**Backend**:
- Routes module: `backend/src/modules/routes/`
- Toll stations module: `backend/src/modules/toll-stations/`
- Route costing module: `backend/src/modules/route-costing/`
- Toll payments module: `backend/src/modules/toll-payments/`
- Migration: `backend/prisma/migrations/20260106135743_add_routes_tolls_system/`
- Seed: `backend/prisma/seed.ts` (permissions added)

**Frontend**:
- Routes pages: `frontend/src/pages/logistics/routes/`
- Toll stations page: `frontend/src/pages/logistics/toll-stations/TollStationsPage.tsx`
- Toll payments page: `frontend/src/pages/logistics/toll-payments/TollPaymentsPage.tsx`
- Costing calculator: `frontend/src/pages/logistics/costing/RouteCostingPage.tsx`
- API services: `frontend/src/services/logistics/`

### Integration Hooks

**For Quotes Module**:
- Use `routesApi.getExpectedToll(routeId, vehicleType)` to get toll total
- Use `routeCostingApi.calculate()` to compute transport cost
- Create `RouteSnapshot` when quote is submitted/approved to freeze route config
- Copy calculated values to quote transport fields

**For Costing Module**:
- Export route cost breakdown via `/costing/calculate` endpoint
- Export toll payment ledger items for reconciliation
- Compare expected vs actual costs

### Reconciliation Logic

**Expected Tolls**:
- Sum of active toll rates for all stations on active routes
- Filtered by vehicle type and effective date ranges
- Calculated from route's toll station assignments

**Actual Tolls**:
- Sum of posted toll payments in date range
- Filtered by route, station, vehicle type as specified

**Variance**:
- `variance = actualTollsTotal - expectedTollsTotal`
- Calculated per station and overall
- Positive variance = overpayment, negative = underpayment

---

*Last updated: Routes & Tolls + Route Costing System implementation*
*Version: 3.0.0*
