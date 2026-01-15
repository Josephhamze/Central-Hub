# Quarry Production Tracking Module - Implementation Status

## ✅ Completed

### 1. Database Schema
- ✅ All enums defined: `Shift`, `EquipmentStatus`, `CrusherType`, `EntryStatus`, `QualityGrade`
- ✅ Equipment models: `Excavator`, `Truck`, `Crusher`
- ✅ Reference data models: `PitLocation`, `MaterialType`, `ProductType`, `StockpileLocation`
- ✅ Entry models: `ExcavatorEntry`, `HaulingEntry`, `CrusherFeedEntry`, `CrusherOutputEntry`
- ✅ Stock model: `StockLevel`
- ✅ User model relations added for operators, drivers, creators, approvers

**File**: `backend/prisma/schema.prisma`

**Next Step**: Run migration when database is available:
```bash
cd backend
npx prisma migrate dev --name add_quarry_production_system
```

### 2. Backend Equipment Modules
- ✅ **Excavators Module**: Full CRUD with validation
  - Service: `excavators.service.ts`
  - Controller: `excavators.controller.ts`
  - Module: `excavators.module.ts`
  - DTOs: `create-excavator.dto.ts`, `update-excavator.dto.ts`

- ✅ **Trucks Module**: Full CRUD with validation
  - Service: `trucks.service.ts`
  - Controller: `trucks.controller.ts`
  - Module: `trucks.module.ts`
  - DTOs: `create-truck.dto.ts`, `update-truck.dto.ts`

- ✅ **Crushers Module**: Full CRUD with validation
  - Service: `crushers.service.ts`
  - Controller: `crushers.controller.ts`
  - Module: `crushers.module.ts`
  - DTOs: `create-crusher.dto.ts`, `update-crusher.dto.ts`

### 3. Backend Reference Data Modules
- ✅ **Material Types Module**: Full CRUD with density field
  - Service: `material-types.service.ts`
  - Controller: `material-types.controller.ts`
  - Module: `material-types.module.ts`
  - DTOs: `create-material-type.dto.ts`, `update-material-type.dto.ts`

### 4. Backend Entry Modules (Template Created)
- ✅ **Excavator Entries Module**: Full implementation with approval workflow
  - Service: `excavator-entries.service.ts` (with auto-calculations)
  - Controller: `excavator-entries.controller.ts`
  - Module: `excavator-entries.module.ts`
  - DTOs: `create-excavator-entry.dto.ts`, `update-excavator-entry.dto.ts`, `approve-entry.dto.ts`, `reject-entry.dto.ts`
  - Features:
    - Auto-calculates `estimatedVolume` (bucketCount × bucketCapacity)
    - Auto-calculates `estimatedTonnage` (estimatedVolume × materialDensity)
    - Approval workflow (approve/reject)
    - Status management (PENDING → APPROVED/REJECTED)
    - Only creator can update/delete
    - Only supervisors can approve/reject

## 🚧 Remaining Backend Work

### 1. Reference Data Modules (3 remaining)
Follow the pattern from `material-types` module:

- **Pit Locations Module** (`pit-locations/`)
  - Similar to material-types but without density field
  - CRUD operations
  - Active/inactive flag management

- **Product Types Module** (`product-types/`)
  - Similar to material-types but without density field
  - CRUD operations
  - Active/inactive flag management

- **Stockpile Locations Module** (`stockpile-locations/`)
  - Similar to material-types but without density field
  - CRUD operations
  - Active/inactive flag management

### 2. Entry Modules (3 remaining)
Follow the pattern from `excavator-entries` module:

- **Hauling Entries Module** (`hauling-entries/`)
  - Auto-calculate `totalHauled` (tripCount × truck.loadCapacity)
  - Approval workflow
  - Optional link to source excavator entry
  - Unique constraint: date + shift + truckId + driverId

- **Crusher Feed Entries Module** (`crusher-feed-entries/`)
  - Auto-calculate `feedRate` (weighBridgeTonnage ÷ operating hours)
  - Operating hours = (feedEndTime - feedStartTime) in hours
  - Approval workflow
  - Unique constraint: date + shift + crusherId
  - Weigh bridge tonnage is source of truth

- **Crusher Output Entries Module** (`crusher-output-entries/`)
  - Auto-calculate `yieldPercentage` (outputTonnage ÷ crusherFeedTonnage × 100)
  - Yield calculation requires summing same-day, same-crusher feed entries
  - Approval workflow
  - No unique constraint (multiple products per crusher per shift)

### 3. Stock Level Module (`stock-levels/`)
- Auto-create daily stock records
- Roll forward previous day's closing stock as opening stock
- Aggregate approved crusher output entries into produced totals
- Calculate closing stock: opening + produced - sold + adjustments
- Manual adjustment endpoint with reason
- Unique constraint: date + productTypeId + stockpileLocationId

### 4. Dashboard Module (`dashboard/`)
- **Variance Calculator Service**:
  - Checkpoint 1: Excavator estimated tonnage vs Hauling total (±8% threshold)
  - Checkpoint 2: Hauling total vs Crusher feed weigh bridge tonnage (±3% threshold)
  - Checkpoint 3: Crusher feed vs Crusher output (±8% threshold, expect 2-8% loss)
  - Return status: OK, Warning, Alert

- **KPI Calculations**:
  - Excavator efficiency
  - Hauling efficiency
  - Crusher yield
  - Overall recovery rate

- **Daily/Weekly Production Summary**
- **Equipment Utilization Metrics**

### 5. Module Registration
Add all modules to `backend/src/app.module.ts`:
```typescript
import { ExcavatorsModule } from './modules/quarry-production/excavators/excavators.module';
import { TrucksModule } from './modules/quarry-production/trucks/trucks.module';
import { CrushersModule } from './modules/quarry-production/crushers/crushers.module';
// ... add all other modules
```

### 6. Permissions
Add to `backend/prisma/seed.ts`:
```typescript
// Equipment
'quarry:equipment:view',
'quarry:equipment:manage',

// Settings
'quarry:settings:view',
'quarry:settings:manage',

// Excavator Entries
'quarry:excavator:view',
'quarry:excavator:create',
'quarry:excavator:update',
'quarry:excavator:delete',
'quarry:excavator:approve',

// Hauling Entries
'quarry:hauling:view',
'quarry:hauling:create',
'quarry:hauling:update',
'quarry:hauling:delete',
'quarry:hauling:approve',

// Crusher Feed Entries
'quarry:crusher-feed:view',
'quarry:crusher-feed:create',
'quarry:crusher-feed:update',
'quarry:crusher-feed:delete',
'quarry:crusher-feed:approve',

// Crusher Output Entries
'quarry:crusher-output:view',
'quarry:crusher-output:create',
'quarry:crusher-output:update',
'quarry:crusher-output:delete',
'quarry:crusher-output:approve',

// Stock
'quarry:stock:view',
'quarry:stock:adjust',

// Dashboard
'quarry:dashboard:view',
```

## 📋 Frontend Work (Not Started)

### 1. API Services
Create service files in `frontend/src/services/quarry-production/`:
- `equipment.ts` - Excavators, Trucks, Crushers
- `settings.ts` - Pit Locations, Material Types, Product Types, Stockpile Locations
- `entries.ts` - All entry types
- `stock.ts` - Stock levels
- `dashboard.ts` - Dashboard data

### 2. Pages
- Equipment management pages (3 pages)
- Settings pages (4 pages)
- Entry list pages (4 pages)
- Entry form modals (4 modals)
- Stock management pages (2 pages)
- Dashboard page with production flow diagram

### 3. Routing
Add routes to `frontend/src/App.tsx`:
- `/quarry-production` - Dashboard
- `/quarry-production/excavator-entries` - Excavator entries list
- `/quarry-production/hauling-entries` - Hauling entries list
- `/quarry-production/crusher-feed` - Crusher feed entries list
- `/quarry-production/crusher-output` - Crusher output entries list
- `/quarry-production/stock` - Stock levels
- `/quarry-production/equipment/*` - Equipment management
- `/quarry-production/settings/*` - Settings management

### 4. Navigation
Add "Quarry Production" section to sidebar with Mountain icon

## 🔑 Key Implementation Notes

1. **Auto-Calculations**: All calculations use Prisma `Decimal` type for precision
2. **Approval Workflow**: Only PENDING entries can be approved/rejected
3. **Edit Rules**: Only PENDING and REJECTED entries can be edited
4. **Weigh Bridge is Source of Truth**: Crusher feed tonnage from weigh bridge is the auditable measurement
5. **Stock Continuity**: Each day's opening stock = previous day's closing stock
6. **Variance Thresholds**:
   - Excavator to Hauling: ±8%
   - Hauling to Crusher Feed: ±3%
   - Crusher Feed to Output: ±8% (2-8% loss is normal)

## 📝 Next Steps

1. Complete remaining reference data modules (pit locations, product types, stockpile locations)
2. Complete remaining entry modules (hauling, crusher feed, crusher output)
3. Create stock level module with auto-calculation logic
4. Create dashboard module with variance calculator
5. Register all modules in `app.module.ts`
6. Add permissions to seed file
7. Run migration
8. Start frontend implementation
