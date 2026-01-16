/**
 * Seed script for Property Management System
 * Creates sample properties, tenants, leases, payments, and more
 *
 * Run: npx ts-node scripts/seed-property-management.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min: number, max: number) => new Prisma.Decimal((Math.random() * (max - min) + min).toFixed(2));
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  console.log('Seeding Property Management data...\n');

  // ============================================================================
  // PROPERTIES
  // ============================================================================
  console.log('Creating properties...');

  const propertyData = [
    {
      name: 'Sunrise Apartments',
      propertyType: 'RESIDENTIAL',
      addressLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      unitCount: 12,
      floorArea: 1200,
      floors: 4,
      yearBuilt: 2015,
      ownershipType: 'OWNED',
      purchaseValue: 2500000,
      currentMarketValue: 3200000,
      currentRentalValue: 24000,
      currency: 'USD',
      annualEscalationPct: 5,
      description: 'Modern apartment complex with excellent amenities',
      amenities: ['Pool', 'Gym', 'Parking', 'Security'],
    },
    {
      name: 'Downtown Office Tower',
      propertyType: 'COMMERCIAL',
      addressLine1: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
      country: 'USA',
      unitCount: 8,
      floorArea: 5000,
      floors: 10,
      yearBuilt: 2010,
      ownershipType: 'OWNED',
      purchaseValue: 8000000,
      currentMarketValue: 12000000,
      currentRentalValue: 80000,
      currency: 'USD',
      annualEscalationPct: 3,
      description: 'Premium office space in prime downtown location',
      amenities: ['Conference Rooms', 'High-Speed Internet', 'Parking', '24/7 Security'],
    },
    {
      name: 'Lakeside Villas',
      propertyType: 'RESIDENTIAL',
      addressLine1: '789 Lake Road',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'USA',
      unitCount: 6,
      floorArea: 800,
      floors: 2,
      yearBuilt: 2018,
      ownershipType: 'MANAGED',
      purchaseValue: 1800000,
      currentMarketValue: 2400000,
      currentRentalValue: 15000,
      currency: 'USD',
      annualEscalationPct: 4,
      description: 'Luxury lakeside townhomes',
      amenities: ['Lake Access', 'BBQ Area', 'Garage', 'Garden'],
    },
    {
      name: 'Tech Park Building A',
      propertyType: 'COMMERCIAL',
      addressLine1: '100 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
      unitCount: 20,
      floorArea: 10000,
      floors: 5,
      yearBuilt: 2020,
      ownershipType: 'OWNED',
      purchaseValue: 15000000,
      currentMarketValue: 18000000,
      currentRentalValue: 150000,
      currency: 'USD',
      annualEscalationPct: 4,
      description: 'State-of-the-art tech office space',
      amenities: ['Fiber Internet', 'Cafe', 'Rooftop Deck', 'EV Charging', 'Bike Storage'],
    },
    {
      name: 'Maple Street Houses',
      propertyType: 'RESIDENTIAL',
      addressLine1: '200 Maple Street',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'USA',
      unitCount: 4,
      floorArea: 2000,
      floors: 2,
      yearBuilt: 2012,
      ownershipType: 'OWNED',
      purchaseValue: 900000,
      currentMarketValue: 1200000,
      currentRentalValue: 8000,
      currency: 'USD',
      annualEscalationPct: 3,
      description: 'Family-friendly residential homes',
      amenities: ['Backyard', 'Garage', 'Basement'],
    },
  ];

  const properties = [];
  for (let i = 0; i < propertyData.length; i++) {
    const data = propertyData[i];
    const property = await prisma.property.create({
      data: {
        propertyCode: `PROP-${String(i + 1).padStart(5, '0')}`,
        name: data.name,
        propertyType: data.propertyType as any,
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        unitCount: data.unitCount,
        floorArea: new Prisma.Decimal(data.floorArea),
        floors: data.floors,
        yearBuilt: data.yearBuilt,
        ownershipType: data.ownershipType as any,
        status: 'OCCUPIED',
        purchaseValue: new Prisma.Decimal(data.purchaseValue),
        currentMarketValue: new Prisma.Decimal(data.currentMarketValue),
        currentRentalValue: new Prisma.Decimal(data.currentRentalValue),
        currency: data.currency,
        annualEscalationPct: new Prisma.Decimal(data.annualEscalationPct),
        description: data.description,
        amenities: data.amenities,
        healthStatus: randomElement(['HEALTHY', 'HEALTHY', 'HEALTHY', 'AT_RISK']) as any,
      },
    });
    properties.push(property);
    console.log(`  Created property: ${property.name}`);
  }

  // ============================================================================
  // PROPERTY UNITS
  // ============================================================================
  console.log('\nCreating property units...');

  const units = [];
  for (const property of properties) {
    for (let i = 1; i <= Math.min(property.unitCount, 5); i++) {
      const unit = await prisma.propertyUnit.create({
        data: {
          propertyId: property.id,
          unitCode: `${property.propertyCode}-U${String(i).padStart(3, '0')}`,
          name: property.propertyType === 'RESIDENTIAL' ? `Unit ${i}` : `Suite ${i}00`,
          floorNumber: Math.ceil(i / 3),
          floorArea: randomDecimal(50, 200),
          bedrooms: property.propertyType === 'RESIDENTIAL' ? randomInt(1, 4) : null,
          bathrooms: property.propertyType === 'RESIDENTIAL' ? randomInt(1, 2) : 1,
          parkingSpaces: randomInt(0, 2),
          hasBalcony: Math.random() > 0.5,
          hasFurnished: Math.random() > 0.7,
          status: randomElement(['OCCUPIED', 'OCCUPIED', 'OCCUPIED', 'VACANT']) as any,
          baseRentalValue: randomDecimal(1000, 5000),
          currentRentalValue: randomDecimal(1000, 5000),
          currency: 'USD',
        },
      });
      units.push(unit);
    }
  }
  console.log(`  Created ${units.length} property units`);

  // ============================================================================
  // TENANTS
  // ============================================================================
  console.log('\nCreating tenants...');

  const tenantData = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '+1-555-0101', isCompany: false },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@email.com', phone: '+1-555-0102', isCompany: false },
    { firstName: 'Michael', lastName: 'Williams', email: 'mwilliams@email.com', phone: '+1-555-0103', isCompany: false },
    { firstName: 'Emily', lastName: 'Brown', email: 'emily.brown@email.com', phone: '+1-555-0104', isCompany: false },
    { firstName: 'David', lastName: 'Davis', email: 'ddavis@email.com', phone: '+1-555-0105', isCompany: false },
    { companyName: 'Tech Startup Inc', email: 'contact@techstartup.com', phone: '+1-555-0201', isCompany: true },
    { companyName: 'Legal Associates LLC', email: 'info@legalassoc.com', phone: '+1-555-0202', isCompany: true },
    { companyName: 'Marketing Pro Agency', email: 'hello@marketpro.com', phone: '+1-555-0203', isCompany: true },
    { firstName: 'Robert', lastName: 'Miller', email: 'r.miller@email.com', phone: '+1-555-0106', isCompany: false },
    { firstName: 'Jennifer', lastName: 'Taylor', email: 'jtaylor@email.com', phone: '+1-555-0107', isCompany: false },
  ];

  const tenants = [];
  for (let i = 0; i < tenantData.length; i++) {
    const data = tenantData[i];
    const tenant = await prisma.tenant.create({
      data: {
        tenantCode: `TEN-${String(i + 1).padStart(5, '0')}`,
        isCompany: data.isCompany,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        idType: data.isCompany ? 'Business Registration' : 'Passport',
        idNumber: `ID${String(randomInt(100000, 999999))}`,
        city: randomElement(['New York', 'Miami', 'Chicago', 'San Francisco']),
        country: 'USA',
        status: randomElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'LATE']) as any,
        currentBalance: randomDecimal(-500, 100),
      },
    });
    tenants.push(tenant);
    console.log(`  Created tenant: ${data.isCompany ? data.companyName : `${data.firstName} ${data.lastName}`}`);
  }

  // ============================================================================
  // LEASES
  // ============================================================================
  console.log('\nCreating leases...');

  const leases = [];
  const occupiedUnits = units.filter(u => u.status === 'OCCUPIED');

  for (let i = 0; i < Math.min(occupiedUnits.length, tenants.length); i++) {
    const unit = occupiedUnits[i];
    const tenant = tenants[i];
    const property = properties.find(p => p.id === unit.propertyId)!;

    const startDate = randomDate(new Date('2023-01-01'), new Date('2024-06-01'));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const lease = await prisma.lease.create({
      data: {
        leaseCode: `LSE-${String(i + 1).padStart(5, '0')}`,
        tenantId: tenant.id,
        propertyId: property.id,
        unitId: unit.id,
        leaseType: randomElement(['FIXED', 'FIXED', 'MONTH_TO_MONTH']) as any,
        startDate,
        endDate,
        signedDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        rentAmount: unit.currentRentalValue!,
        depositAmount: new Prisma.Decimal(Number(unit.currentRentalValue) * 2),
        paymentFrequency: 'MONTHLY',
        paymentDueDay: 1,
        gracePeriodDays: 5,
        lateFeePercentage: new Prisma.Decimal(5),
        currency: 'USD',
        hasEscalation: true,
        escalationPct: new Prisma.Decimal(property.annualEscalationPct || 3),
        isActive: true,
      },
    });
    leases.push(lease);
    console.log(`  Created lease: ${lease.leaseCode} for ${tenant.isCompany ? tenant.companyName : `${tenant.firstName} ${tenant.lastName}`}`);
  }

  // ============================================================================
  // RENT SCHEDULES & PAYMENTS
  // ============================================================================
  console.log('\nCreating rent schedules and payments...');

  let paymentCount = 0;
  let scheduleCount = 0;

  for (const lease of leases) {
    // Create rent schedules for the past 6 months
    const now = new Date();
    for (let month = 5; month >= 0; month--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - month, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - month + 1, 0);
      const dueDate = new Date(now.getFullYear(), now.getMonth() - month, lease.paymentDueDay);

      const isPaid = month > 0 || Math.random() > 0.3;
      const isPartial = !isPaid && Math.random() > 0.5;

      const schedule = await prisma.rentSchedule.create({
        data: {
          leaseId: lease.id,
          periodStart,
          periodEnd,
          dueDate,
          rentAmount: lease.rentAmount,
          additionalCharges: new Prisma.Decimal(0),
          totalDue: lease.rentAmount,
          amountPaid: isPaid ? lease.rentAmount : isPartial ? new Prisma.Decimal(Number(lease.rentAmount) / 2) : new Prisma.Decimal(0),
          balance: isPaid ? new Prisma.Decimal(0) : isPartial ? new Prisma.Decimal(Number(lease.rentAmount) / 2) : lease.rentAmount,
          status: isPaid ? 'PAID' : isPartial ? 'PARTIAL' : (dueDate < now ? 'OVERDUE' : 'PENDING'),
          lateFeeApplied: !isPaid && dueDate < now ? new Prisma.Decimal(Number(lease.rentAmount) * 0.05) : new Prisma.Decimal(0),
        },
      });
      scheduleCount++;

      // Create payment for paid schedules
      if (isPaid || isPartial) {
        await prisma.rentPayment.create({
          data: {
            paymentCode: `PAY-${String(paymentCount + 1).padStart(6, '0')}`,
            tenantId: lease.tenantId,
            leaseId: lease.id,
            rentScheduleId: schedule.id,
            paymentDate: new Date(dueDate.getTime() + randomInt(0, 5) * 24 * 60 * 60 * 1000),
            amount: isPaid ? lease.rentAmount : new Prisma.Decimal(Number(lease.rentAmount) / 2),
            paymentMethod: randomElement(['BANK_TRANSFER', 'CHECK', 'CASH', 'CREDIT_CARD']) as any,
            referenceNumber: `REF${String(randomInt(100000, 999999))}`,
            rentPortion: isPaid ? lease.rentAmount : new Prisma.Decimal(Number(lease.rentAmount) / 2),
            lateFeesPortion: new Prisma.Decimal(0),
            depositPortion: new Prisma.Decimal(0),
            otherPortion: new Prisma.Decimal(0),
            status: 'PAID',
          },
        });
        paymentCount++;
      }
    }
  }
  console.log(`  Created ${scheduleCount} rent schedules and ${paymentCount} payments`);

  // ============================================================================
  // EXPENSES
  // ============================================================================
  console.log('\nCreating property expenses...');

  const expenseCategories = ['MAINTENANCE', 'REPAIRS', 'INSURANCE', 'MUNICIPAL_TAXES', 'CLEANING', 'LANDSCAPING'];
  let expenseCount = 0;

  for (const property of properties) {
    for (let i = 0; i < randomInt(3, 8); i++) {
      await prisma.propertyExpense.create({
        data: {
          expenseCode: `EXP-${String(expenseCount + 1).padStart(6, '0')}`,
          propertyId: property.id,
          category: randomElement(expenseCategories) as any,
          description: randomElement([
            'Monthly maintenance service',
            'Plumbing repair',
            'Annual insurance premium',
            'Property tax payment',
            'Common area cleaning',
            'Landscaping service',
            'HVAC maintenance',
            'Roof inspection',
          ]),
          vendor: randomElement(['ABC Services', 'Quick Fix Co', 'Pro Maintenance', 'City Services']),
          expenseDate: randomDate(new Date('2024-01-01'), new Date()),
          amount: randomDecimal(100, 5000),
          currency: 'USD',
          taxAmount: randomDecimal(0, 100),
          totalAmount: randomDecimal(100, 5100),
          isPaid: Math.random() > 0.3,
          isRecurring: Math.random() > 0.7,
          recurringFrequency: Math.random() > 0.5 ? 'MONTHLY' : 'QUARTERLY',
        },
      });
      expenseCount++;
    }
  }
  console.log(`  Created ${expenseCount} expenses`);

  // ============================================================================
  // UTILITY BILLS
  // ============================================================================
  console.log('\nCreating utility bills...');

  const utilityTypes = ['ELECTRICITY', 'WATER', 'GAS', 'INTERNET'];
  let billCount = 0;

  for (const property of properties) {
    for (const utilityType of utilityTypes) {
      // Create 3 months of bills
      for (let month = 2; month >= 0; month--) {
        const periodStart = new Date(new Date().getFullYear(), new Date().getMonth() - month, 1);
        const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() - month + 1, 0);
        const billDate = new Date(periodEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
        const dueDate = new Date(periodEnd.getTime() + 21 * 24 * 60 * 60 * 1000);

        await prisma.utilityBill.create({
          data: {
            billCode: `UTIL-${String(billCount + 1).padStart(6, '0')}`,
            propertyId: property.id,
            utilityType: utilityType as any,
            provider: randomElement(['City Power', 'Metro Water', 'Gas Co', 'Fast Internet']),
            accountNumber: `ACC${String(randomInt(100000, 999999))}`,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
            billDate,
            dueDate,
            previousReading: randomDecimal(1000, 5000),
            currentReading: randomDecimal(5000, 10000),
            consumption: randomDecimal(100, 500),
            consumptionUnit: utilityType === 'ELECTRICITY' ? 'kWh' : utilityType === 'WATER' ? 'm³' : utilityType === 'GAS' ? 'therms' : 'GB',
            amount: randomDecimal(50, 500),
            taxAmount: randomDecimal(5, 50),
            totalAmount: randomDecimal(55, 550),
            currency: 'USD',
            allocation: randomElement(['LANDLORD', 'TENANT', 'SHARED']) as any,
            status: month > 0 ? 'PAID' : randomElement(['PAID', 'PENDING']) as any,
            paidDate: month > 0 ? new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
            paidAmount: month > 0 ? randomDecimal(55, 550) : null,
          },
        });
        billCount++;
      }
    }
  }
  console.log(`  Created ${billCount} utility bills`);

  // ============================================================================
  // MAINTENANCE JOBS
  // ============================================================================
  console.log('\nCreating maintenance jobs...');

  const maintenanceJobs = [
    { title: 'Fix leaking faucet', category: 'REPAIRS', priority: 'LOW' },
    { title: 'Replace broken window', category: 'REPAIRS', priority: 'MEDIUM' },
    { title: 'HVAC annual service', category: 'MAINTENANCE', priority: 'MEDIUM' },
    { title: 'Paint common areas', category: 'MAINTENANCE', priority: 'LOW' },
    { title: 'Emergency plumbing issue', category: 'REPAIRS', priority: 'URGENT' },
    { title: 'Replace smoke detectors', category: 'MAINTENANCE', priority: 'HIGH' },
    { title: 'Fix elevator', category: 'REPAIRS', priority: 'URGENT' },
    { title: 'Landscape maintenance', category: 'LANDSCAPING', priority: 'LOW' },
    { title: 'Security system upgrade', category: 'MAINTENANCE', priority: 'MEDIUM' },
    { title: 'Roof inspection', category: 'MAINTENANCE', priority: 'MEDIUM' },
  ];

  let jobCount = 0;
  for (const property of properties) {
    for (let i = 0; i < randomInt(2, 5); i++) {
      const jobData = randomElement(maintenanceJobs);
      const status = randomElement(['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED']);

      await prisma.propertyMaintenanceJob.create({
        data: {
          jobCode: `MNT-${String(jobCount + 1).padStart(6, '0')}`,
          propertyId: property.id,
          title: jobData.title,
          description: `${jobData.title} - Detailed description of the maintenance work required.`,
          category: jobData.category as any,
          priority: jobData.priority as any,
          status: status as any,
          reportedDate: randomDate(new Date('2024-01-01'), new Date()),
          scheduledDate: status !== 'PENDING' ? randomDate(new Date(), new Date('2025-03-01')) : null,
          startedDate: status === 'IN_PROGRESS' || status === 'COMPLETED' ? randomDate(new Date('2024-06-01'), new Date()) : null,
          completedDate: status === 'COMPLETED' ? randomDate(new Date('2024-06-01'), new Date()) : null,
          assignedTo: status !== 'PENDING' ? randomElement(['John Contractor', 'ABC Maintenance', 'Quick Fix Co']) : null,
          estimatedCost: randomDecimal(100, 5000),
          actualCost: status === 'COMPLETED' ? randomDecimal(100, 5000) : null,
          currency: 'USD',
          affectsOccupancy: Math.random() > 0.8,
          tenantAccessRequired: Math.random() > 0.5,
        },
      });
      jobCount++;
    }
  }
  console.log(`  Created ${jobCount} maintenance jobs`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n========================================');
  console.log('Property Management Seed Complete!');
  console.log('========================================');
  console.log(`Properties: ${properties.length}`);
  console.log(`Units: ${units.length}`);
  console.log(`Tenants: ${tenants.length}`);
  console.log(`Leases: ${leases.length}`);
  console.log(`Rent Schedules: ${scheduleCount}`);
  console.log(`Payments: ${paymentCount}`);
  console.log(`Expenses: ${expenseCount}`);
  console.log(`Utility Bills: ${billCount}`);
  console.log(`Maintenance Jobs: ${jobCount}`);
  console.log('========================================\n');
}

// Run the seed
seed()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
