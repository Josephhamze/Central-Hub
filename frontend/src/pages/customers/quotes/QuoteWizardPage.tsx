import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Building2,
  User,
  Package,
  Truck,
  FileText,
  CheckCircle2,
  X,
  Plus,
  Search,
  MapPin,
  Warehouse,
  List,
  UserPlus,
  AlertCircle,
  Info,
  Check,
  ArrowRight,
  ArrowLeft,
  FolderKanban,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { useToast } from '@contexts/ToastContext';
import { quotesApi, type CreateQuoteDto, type CreateQuoteItemDto } from '@services/sales/quotes';
import { companiesApi, type Company } from '@services/sales/companies';
import { customersApi } from '@services/sales/customers';
import { contactsApi } from '@services/sales/contacts';
import { warehousesApi } from '@services/sales/warehouses';
import { projectsApi } from '@services/sales/projects';
import { stockItemsApi, type StockItem } from '@services/sales/stock-items';
import { cn } from '@utils/cn';

// Local UI type for quote items (extends DTO with UI-only fields)
interface QuoteItemUI extends CreateQuoteItemDto {
  nameSnapshot: string;
  uomSnapshot: string;
  lineTotal: number;
}

// Extended quote data type for UI state
interface QuoteDataUI extends Omit<Partial<CreateQuoteDto>, 'items'> {
  items?: QuoteItemUI[];
  warehouseId?: string; // UI-only field for warehouse selection
}

const STEPS = [
  { id: 1, name: 'Operating Company', icon: Building2 },
  { id: 2, name: 'Customer & Contact', icon: User },
  { id: 3, name: 'Project & Logistics', icon: Truck },
  { id: 4, name: 'Products', icon: Package },
  { id: 5, name: 'Review & Submit', icon: FileText },
];

export function QuoteWizardPage() {
  const { id: quoteId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteDataUI>({
    items: [],
  });

  // Generate quote number (in real app, this would come from backend)
  const quoteNumber = existingQuote?.quoteNumber || `EE-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 10000)}`;

  // Fetch companies for step 1
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  // Load quote if editing
  const { data: existingQuote, isLoading: isLoadingQuote } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const res = await quotesApi.findOne(quoteId!);
      return res.data.data;
    },
    enabled: !!quoteId,
  });

  // Populate form with existing quote data when editing
  useEffect(() => {
    if (existingQuote && quoteId) {
      setQuoteData({
        companyId: existingQuote.companyId,
        projectId: existingQuote.projectId,
        customerId: existingQuote.customerId,
        contactId: existingQuote.contactId,
        warehouseId: (existingQuote as any).warehouseId,
        deliveryMethod: existingQuote.deliveryMethod,
        deliveryAddressLine1: existingQuote.deliveryAddressLine1,
        deliveryAddressLine2: existingQuote.deliveryAddressLine2,
        deliveryCity: existingQuote.deliveryCity,
        deliveryState: existingQuote.deliveryState,
        deliveryPostalCode: existingQuote.deliveryPostalCode,
        deliveryCountry: existingQuote.deliveryCountry,
        routeId: existingQuote.routeId,
        items: existingQuote.items?.map(item => ({
          stockItemId: item.stockItemId,
          nameSnapshot: item.nameSnapshot,
          uomSnapshot: item.uomSnapshot,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          lineTotal: Number(item.lineTotal),
        })) || [],
      });
    }
  }, [existingQuote, quoteId]);

  const createQuoteMutation = useMutation({
    mutationFn: (data: CreateQuoteDto) => quoteId ? quotesApi.update(quoteId, data) : quotesApi.create(data),
    onSuccess: () => {
      success(quoteId ? 'Quote updated successfully' : 'Quote created successfully');
      navigate(`/sales/quotes`);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to create quote';
      showError(errorMessage);
      console.error('Quote creation error:', err.response?.data || err);
    },
  });

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 1 && !quoteData.companyId) {
      showError('Please select a company');
      return;
    }
    if (currentStep === 2 && !quoteData.customerId) {
      showError('Please select a customer');
      return;
    }
    if (currentStep === 3 && (!quoteData.projectId || !quoteData.deliveryMethod || (quoteData.deliveryMethod === 'DELIVERED' && !quoteData.deliveryCity))) {
      showError('Please complete project, delivery method, and delivery city (required for route calculation)');
      return;
    }
    if (currentStep === 4 && (!quoteData.items || quoteData.items.length === 0)) {
      showError('Please add at least one product');
      return;
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!quoteData.companyId || !quoteData.projectId || !quoteData.customerId || !quoteData.deliveryMethod || !quoteData.items || quoteData.items.length === 0 || (quoteData.deliveryMethod === 'DELIVERED' && !quoteData.deliveryCity)) {
      showError('Please complete all required fields. City is required for delivered quotes.');
      return;
    }
    // Convert UI items to DTO items (remove UI-only fields)
    const dtoItems: CreateQuoteItemDto[] = quoteData.items.map(item => ({
      stockItemId: item.stockItemId,
      qty: item.qty,
      unitPrice: item.unitPrice,
      discount: item.discount,
    }));
    // Construct DTO with only allowed fields
    const dto: CreateQuoteDto = {
      companyId: quoteData.companyId!,
      projectId: quoteData.projectId!,
      customerId: quoteData.customerId!,
      contactId: quoteData.contactId,
      warehouseId: quoteData.warehouseId, // Include warehouseId for route calculation
      deliveryMethod: quoteData.deliveryMethod!,
      deliveryAddressLine1: quoteData.deliveryAddressLine1,
      deliveryAddressLine2: quoteData.deliveryAddressLine2,
      deliveryCity: quoteData.deliveryCity,
      deliveryState: quoteData.deliveryState,
      deliveryPostalCode: quoteData.deliveryPostalCode,
      deliveryCountry: quoteData.deliveryCountry,
      routeId: quoteData.routeId,
      items: dtoItems,
    };
    createQuoteMutation.mutate(dto);
  };

  if (quoteId && isLoadingQuote) {
    return (
      <PageContainer title="Edit Quote">
        <div className="text-center py-12 text-content-secondary">Loading quote...</div>
      </PageContainer>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Quote Number */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-content-primary">{quoteId ? "Edit Quote" : "Quote Builder"}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-content-secondary">Quote:</span>
            <span className="text-sm font-semibold text-content-primary">{quoteNumber}</span>
            <Badge variant="warning" size="sm">DRAFT</Badge>
          </div>
        </div>

        {/* Enhanced Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                    currentStep === step.id
                      ? 'bg-accent-primary border-accent-primary text-white shadow-lg scale-110'
                      : currentStep > step.id
                      ? 'bg-status-success border-status-success text-white'
                      : 'border-border-default bg-background-elevated text-content-secondary',
                  )}>
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={cn(
                    'mt-3 text-sm font-medium',
                    currentStep >= step.id ? 'text-content-primary' : 'text-content-secondary'
                  )}>
                    {step.name}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    'h-1 flex-1 mx-4 rounded-full transition-colors',
                    currentStep > step.id ? 'bg-status-success' : 'bg-border-default'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6" padding="lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-content-primary mb-2">
              {STEPS[currentStep - 1].name}
            </h2>
            {currentStep === 1 && (
              <p className="text-content-secondary">
                Select the operating company for this quote. This will determine the available projects, warehouses, and products.
              </p>
            )}
            {currentStep === 2 && (
              <p className="text-content-secondary">
                Select an existing customer or create a new one. Each customer must have at least one contact.
              </p>
            )}
            {currentStep === 3 && (
              <p className="text-content-secondary">
                Select the project and warehouse for this order, then enter the delivery address to calculate logistics costs.
              </p>
            )}
            {currentStep === 4 && (
              <p className="text-content-secondary">
                Add products to your quote. Adjust quantities and prices as needed.
              </p>
            )}
            {currentStep === 5 && (
              <p className="text-content-secondary">
                Review all details before submitting your quote.
              </p>
            )}
          </div>

          {/* Instructional Banner */}
          <div className="mb-6 p-4 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-status-info mt-0.5 flex-shrink-0" />
              <div className="text-sm text-content-secondary">
                {currentStep === 1 && 'Select the operating company that will handle this quote. This determines available resources and pricing.'}
                {currentStep === 2 && 'Choose a customer account and contact person. You can create new customers and contacts if needed.'}
                {currentStep === 3 && 'Select the project and warehouse, then provide delivery details for automatic route and cost calculation.'}
                {currentStep === 4 && 'Browse available products and add them to your quote. You can adjust quantities and apply discounts.'}
                {currentStep === 5 && 'Review all information carefully. Once submitted, the quote will be sent for approval.'}
              </div>
            </div>
          </div>

          <div>
            {currentStep === 1 && <Step1CompanySelection companies={companiesData?.items || []} selected={quoteData.companyId} onSelect={(id) => setQuoteData({ ...quoteData, companyId: id })} />}
            {currentStep === 2 && <Step2ClientSelection quoteData={quoteData} onUpdate={setQuoteData} />}
            {currentStep === 3 && <Step3ProjectDelivery companyId={quoteData.companyId} quoteData={quoteData} onUpdate={setQuoteData} />}
            {currentStep === 4 && <Step4Products companyId={quoteData.companyId} projectId={quoteData.projectId} quoteData={quoteData} onUpdate={setQuoteData} />}
            {currentStep === 5 && <Step5Review quoteData={quoteData} />}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          {currentStep < STEPS.length ? (
            <Button
              variant="primary"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={createQuoteMutation.isPending}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Create Quote
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Company Selection - Enhanced Design
function Step1CompanySelection({ companies, selected, onSelect }: { companies: Company[]; selected?: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {companies.map((company) => (
        <Card
          key={company.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg border-2',
            selected === company.id
              ? 'border-status-success bg-status-success-bg ring-2 ring-status-success ring-opacity-50'
              : 'border-border-default hover:border-accent-primary'
          )}
          onClick={() => onSelect(company.id)}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0',
                selected === company.id ? 'bg-status-success text-white' : 'bg-accent-primary/10 text-accent-primary'
              )}>
                <Building2 className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-bold text-content-primary mb-1">{company.name}</h3>
                  {selected === company.id && (
                    <CheckCircle2 className="w-6 h-6 text-status-success flex-shrink-0" />
                  )}
                </div>
                {company.legalName && (
                  <p className="text-sm text-content-secondary mb-2">{company.legalName}</p>
                )}
                {company.email && (
                  <p className="text-sm text-content-tertiary flex items-center gap-1">
                    <span>{company.email}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Step 2: Client Selection - Enhanced with Contact Selection
function Step2ClientSelection({ quoteData, onUpdate }: { quoteData: QuoteDataUI; onUpdate: (data: QuoteDataUI) => void }) {
  const [search, setSearch] = useState('');
  const { data: customersData } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await customersApi.findAll(1, 100, search);
      return res.data.data;
    },
    enabled: true,
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', quoteData.customerId],
    queryFn: async () => {
      if (!quoteData.customerId) return { items: [] };
      const res = await contactsApi.findAll(quoteData.customerId, 1, 100);
      return res.data.data;
    },
    enabled: !!quoteData.customerId,
  });

  const selectedCustomer = customersData?.items.find(c => c.id === quoteData.customerId);
  const selectedContact = contactsData?.items.find(c => c.id === quoteData.contactId);

  return (
    <div className="space-y-6">
      {/* Customer Account Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-content-primary" />
          <h3 className="text-lg font-semibold text-content-primary">Customer Account</h3>
        </div>

        {selectedCustomer ? (
          <Card className="border-2 border-status-success bg-status-success-bg">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-status-success flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-content-primary">
                        {selectedCustomer.type === 'COMPANY'
                          ? (selectedCustomer.companyName || 'Unknown Company')
                          : `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'Unknown Customer'}
                      </h4>
                      {selectedCustomer.email && (
                        <p className="text-sm text-content-secondary mt-1">{selectedCustomer.email}</p>
                      )}
                      {selectedCustomer.billingCity && (
                        <p className="text-sm text-content-tertiary mt-1">
                          {selectedCustomer.billingCity}
                          {selectedCustomer.billingState && `, ${selectedCustomer.billingState}`}
                          {selectedCustomer.billingCountry && `, ${selectedCustomer.billingCountry}`}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onUpdate({ ...quoteData, customerId: undefined, contactId: undefined })}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-content-tertiary" />
              <Input
                placeholder="Search by company name, VAT number, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customersData?.items.map((customer) => (
                <Card
                  key={customer.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-lg border-2',
                    quoteData.customerId === customer.id
                      ? 'border-status-success bg-status-success-bg'
                      : 'border-border-default hover:border-accent-primary'
                  )}
                  onClick={() => onUpdate({ ...quoteData, customerId: customer.id, contactId: undefined })}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                        quoteData.customerId === customer.id
                          ? 'bg-status-success text-white'
                          : 'bg-accent-primary/10 text-accent-primary'
                      )}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-content-primary mb-1">
                          {customer.type === 'COMPANY'
                            ? (customer.companyName || 'Unknown Company')
                            : `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer'}
                        </h4>
                        {customer.email && (
                          <p className="text-sm text-content-secondary mb-1">{customer.email}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-content-tertiary">{customer.phone}</p>
                        )}
                      </div>
                      {quoteData.customerId === customer.id && (
                        <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {customersData?.items.length === 0 && (
              <Card className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
                <p className="text-content-secondary mb-4">No customers found</p>
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Create New Customer
                </Button>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Contact Person Section */}
      {selectedCustomer && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-content-primary" />
            <h3 className="text-lg font-semibold text-content-primary">Contact Person</h3>
          </div>

          {selectedContact ? (
            <Card className="border-2 border-status-success bg-status-success-bg">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-status-success flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-content-primary">
                          {selectedContact.name}
                        </h4>
                        {selectedContact.roleTitle && (
                          <p className="text-sm text-content-secondary mt-1">{selectedContact.roleTitle}</p>
                        )}
                        {selectedContact.email && (
                          <p className="text-sm text-content-tertiary mt-1">{selectedContact.email}</p>
                        )}
                        {selectedContact.phone && (
                          <p className="text-sm text-content-tertiary">{selectedContact.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-status-success" />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onUpdate({ ...quoteData, contactId: undefined })}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contactsData?.items.map((contact) => (
                  <Card
                    key={contact.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-lg border-2',
                      quoteData.contactId === contact.id
                        ? 'border-status-success bg-status-success-bg'
                        : 'border-border-default hover:border-accent-primary'
                    )}
                    onClick={() => onUpdate({ ...quoteData, contactId: contact.id })}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                          quoteData.contactId === contact.id
                            ? 'bg-status-success text-white'
                            : 'bg-accent-primary/10 text-accent-primary'
                        )}>
                          <User className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-content-primary mb-1">
                            {contact.name}
                          </h4>
                          {contact.roleTitle && (
                            <p className="text-sm text-content-secondary mb-1">{contact.roleTitle}</p>
                          )}
                          {contact.email && (
                            <p className="text-sm text-content-tertiary">{contact.email}</p>
                          )}
                        </div>
                        {quoteData.contactId === contact.id && (
                          <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {contactsData?.items.length === 0 && (
                <Card className="p-6 border-2 border-dashed border-border-default">
                  <div className="flex items-center gap-3 text-content-secondary">
                    <UserPlus className="w-5 h-5" />
                    <Button variant="ghost" className="text-accent-primary hover:text-accent-primary">
                      + Add New Contact
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Step 3: Project & Delivery - Enhanced Two-Column Layout
function Step3ProjectDelivery({ companyId, quoteData, onUpdate }: { companyId?: string; quoteData: QuoteDataUI; onUpdate: (data: QuoteDataUI) => void }) {
  const { data: projectsData, error: projectsError } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: async () => {
      const res = await projectsApi.findAll(companyId, 1, 100);
      return res.data.data;
    },
    enabled: !!companyId,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', companyId, quoteData.projectId],
    queryFn: async () => {
      const res = await warehousesApi.findAll(companyId, quoteData.projectId, 1, 100);
      return res.data.data;
    },
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <div className="text-center py-12 text-content-secondary">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
        <p>Please select a company in Step 1 first</p>
      </div>
    );
  }

  if (projectsError) {
    return (
      <Card className="p-6 border-2 border-status-error-bg bg-status-error-bg">
        <div className="flex items-center gap-3 text-status-error">
          <AlertCircle className="w-5 h-5" />
          <p>Error loading projects: {projectsError instanceof Error ? projectsError.message : 'Unknown error'}</p>
        </div>
      </Card>
    );
  }

  // Separate warehouses by project vs global
  const projectWarehouses = warehousesData?.items.filter(w => w.projectId === quoteData.projectId) || [];
  const globalWarehouses = warehousesData?.items.filter(w => !w.projectId) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Project Selection */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-content-primary" />
          <h3 className="text-lg font-semibold text-content-primary">Select Project</h3>
        </div>
        <Card className="p-4">
          <div className="space-y-2">
            {projectsData?.items.map((project) => (
              <div
                key={project.id}
                className={cn(
                  'p-4 rounded-lg cursor-pointer transition-all border-2',
                  quoteData.projectId === project.id
                    ? 'border-status-success bg-status-success-bg'
                    : 'border-border-default hover:border-accent-primary hover:bg-background-hover'
                )}
                onClick={() => onUpdate({ ...quoteData, projectId: project.id, warehouseId: undefined })}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-content-primary">{project.name}</span>
                  {quoteData.projectId === project.id && (
                    <Check className="w-5 h-5 text-status-success" />
                  )}
                </div>
              </div>
            ))}
            {projectsData?.items.length === 0 && (
              <p className="text-sm text-content-tertiary text-center py-4">No projects found for this company</p>
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Warehouse Selection */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Warehouse className="w-5 h-5 text-content-primary" />
          <h3 className="text-lg font-semibold text-content-primary">Select Warehouse</h3>
        </div>
        <Card className="p-4 max-h-96 overflow-y-auto">
          {projectWarehouses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-content-tertiary uppercase mb-2">Project Warehouses</p>
              <div className="space-y-2">
                {projectWarehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all border-2',
                      quoteData.warehouseId === warehouse.id
                        ? 'border-status-success bg-status-success-bg'
                        : 'border-border-default hover:border-accent-primary hover:bg-background-hover'
                    )}
                    onClick={() => onUpdate({ ...quoteData, warehouseId: warehouse.id })}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-content-primary">{warehouse.name}</span>
                      {quoteData.warehouseId === warehouse.id && (
                        <Check className="w-4 h-4 text-status-success" />
                      )}
                    </div>
                    {warehouse.locationCity && (
                      <p className="text-xs text-content-tertiary">
                        {warehouse.locationCity}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {globalWarehouses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-content-tertiary uppercase mb-2">Global Warehouses</p>
              <div className="space-y-2">
                {globalWarehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all border-2',
                      quoteData.warehouseId === warehouse.id
                        ? 'border-status-success bg-status-success-bg'
                        : 'border-border-default hover:border-accent-primary hover:bg-background-hover'
                    )}
                    onClick={() => onUpdate({ ...quoteData, warehouseId: warehouse.id })}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-content-primary">{warehouse.name}</span>
                      {quoteData.warehouseId === warehouse.id && (
                        <Check className="w-4 h-4 text-status-success" />
                      )}
                    </div>
                    {warehouse.locationCity && (
                      <p className="text-xs text-content-tertiary">
                        {warehouse.locationCity}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {projectWarehouses.length === 0 && globalWarehouses.length === 0 && (
            <p className="text-sm text-content-tertiary text-center py-4">No warehouses available</p>
          )}
        </Card>
      </div>

      {/* Delivery Address - Full Width */}
      <div className="lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-content-primary" />
          <h3 className="text-lg font-semibold text-content-primary">Delivery Address</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Delivery Method *</label>
            <div className="flex gap-4">
              <Button
                variant={quoteData.deliveryMethod === 'DELIVERED' ? 'primary' : 'secondary'}
                onClick={() => onUpdate({ ...quoteData, deliveryMethod: 'DELIVERED' })}
                leftIcon={<Truck className="w-4 h-4" />}
              >
                Delivered
              </Button>
              <Button
                variant={quoteData.deliveryMethod === 'COLLECTED' ? 'primary' : 'secondary'}
                onClick={() => onUpdate({ ...quoteData, deliveryMethod: 'COLLECTED' })}
                leftIcon={<Package className="w-4 h-4" />}
              >
                Collected
              </Button>
            </div>
          </div>
          {quoteData.deliveryMethod === 'DELIVERED' && (
            <div className="space-y-4">
              <Input
                label="Delivery Address"
                value={quoteData.deliveryAddressLine1 || ''}
                onChange={(e) => onUpdate({ ...quoteData, deliveryAddressLine1: e.target.value })}
                placeholder="Enter the full delivery address (e.g., 123 Main Street, Lubumbashi, DRC)"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City *"
                  value={quoteData.deliveryCity || ''}
                  onChange={(e) => onUpdate({ ...quoteData, deliveryCity: e.target.value })}
                  placeholder="City"
                />
                <Input
                  label="Postal Code"
                  value={quoteData.deliveryPostalCode || ''}
                  onChange={(e) => onUpdate({ ...quoteData, deliveryPostalCode: e.target.value })}
                  placeholder="Postal Code"
                />
              </div>
              <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
                <p className="text-xs text-content-secondary">
                  <strong>Tip:</strong> City is required for automatic route calculation. The system will match a route from the project's company city to the delivery city.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 4: Products
function Step4Products({ companyId, projectId, quoteData, onUpdate }: { companyId?: string; projectId?: string; quoteData: QuoteDataUI; onUpdate: (data: QuoteDataUI) => void }) {
  const { error: showError } = useToast();
  const [search, setSearch] = useState('');
  const { data: stockItemsData, error: stockItemsError } = useQuery({
    queryKey: ['stock-items', companyId, projectId],
    queryFn: async () => {
      const res = await stockItemsApi.findAll(companyId, projectId, 1, 100);
      return res.data.data;
    },
    enabled: !!companyId && !!projectId,
  });

  const addItem = (stockItem: StockItem) => {
    const items = quoteData.items || [];
    const existing = items.find(i => i.stockItemId === stockItem.id);
    if (existing) {
      showError('Item already added');
      return;
    }
    const minOrderQty = Number(stockItem.minOrderQty) || 1;
    const defaultUnitPrice = Number(stockItem.defaultUnitPrice) || 0;
    const newItem: QuoteItemUI = {
      stockItemId: stockItem.id,
      nameSnapshot: stockItem.name,
      uomSnapshot: stockItem.uom,
      qty: minOrderQty,
      unitPrice: defaultUnitPrice,
      discount: 0,
      lineTotal: defaultUnitPrice * minOrderQty,
    };
    onUpdate({ ...quoteData, items: [...items, newItem] });
  };

  const updateItem = (index: number, updates: Partial<QuoteItemUI>) => {
    const items = [...(quoteData.items || [])];
    const item = items[index];
    const stockItem = stockItemsData?.items.find(si => si.id === item.stockItemId);
    if (!stockItem) return;

    const qty = updates.qty ?? item.qty;
    const unitPrice = updates.unitPrice ?? item.unitPrice;
    const discount = updates.discount ?? item.discount;

    if (unitPrice - discount < Number(stockItem.minUnitPrice)) {
      showError(`Unit price after discount must be at least $${Number(stockItem.minUnitPrice).toFixed(2)}`);
      return;
    }
    if (qty < Number(stockItem.minOrderQty)) {
      showError(`Quantity must be at least ${Number(stockItem.minOrderQty)}`);
      return;
    }
    if (stockItem.truckloadOnly && qty % Number(stockItem.minOrderQty) !== 0) {
      showError(`Quantity must be a multiple of ${Number(stockItem.minOrderQty)} (truckload only)`);
      return;
    }

    items[index] = {
      ...item,
      ...updates,
      lineTotal: qty * (unitPrice - discount),
    };
    onUpdate({ ...quoteData, items });
  };

  const removeItem = (index: number) => {
    const items = [...(quoteData.items || [])];
    items.splice(index, 1);
    onUpdate({ ...quoteData, items });
  };

  const filtered = stockItemsData?.items.filter(si => 
    si.name?.toLowerCase().includes(search.toLowerCase()) ||
    si.sku?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (!companyId || !projectId) {
    return (
      <div className="text-center py-12 text-content-secondary">
        <Package className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
        <p>Please complete Steps 1 and 3 first</p>
      </div>
    );
  }

  if (stockItemsError) {
    return (
      <Card className="p-6 border-2 border-status-error-bg bg-status-error-bg">
        <div className="flex items-center gap-3 text-status-error">
          <AlertCircle className="w-5 h-5" />
          <p>Error loading products: {stockItemsError instanceof Error ? stockItemsError.message : 'Unknown error'}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Available Products */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-content-primary" />
          <h3 className="text-lg font-semibold text-content-primary">Available Products</h3>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-content-tertiary" />
          <Input
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
              <p className="text-content-secondary">
                {search ? 'No products found matching your search' : 'No products available for this project'}
              </p>
            </Card>
          ) : (
            filtered.map((stockItem) => (
              <Card key={stockItem.id} className="p-4 border-2 border-border-default hover:border-accent-primary transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-accent-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-content-primary mb-1">{stockItem.name}</h4>
                        {stockItem.sku && (
                          <p className="text-xs text-content-tertiary mb-2">SKU: {stockItem.sku}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="default" size="sm">{stockItem.uom}</Badge>
                      <span className="text-lg font-bold text-accent-primary">
                        ${Number(stockItem.defaultUnitPrice).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-content-tertiary">
                      <span>Min Qty: {Number(stockItem.minOrderQty)}</span>
                      <span>Min Price: ${Number(stockItem.minUnitPrice).toFixed(2)}</span>
                      {stockItem.truckloadOnly && (
                        <Badge variant="warning" size="sm">Truckload Only</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => addItem(stockItem)}
                    className="flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Quote Line Items */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-content-primary" />
          <h3 className="text-lg font-semibold text-content-primary">Quote Line Items</h3>
        </div>
        {quoteData.items && quoteData.items.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {quoteData.items.map((item, index) => {
              const stockItem = stockItemsData?.items.find(si => si.id === item.stockItemId);
              return (
                <Card key={index} className="p-4 border-2 border-border-default">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-accent-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-content-primary mb-1">{item.nameSnapshot}</h4>
                        <Badge variant="default" size="sm" className="mb-2">{item.uomSnapshot}</Badge>
                        {stockItem && (
                          <div className="text-xs text-content-tertiary space-y-0.5 mt-1">
                            <p>Min: {Number(stockItem.minOrderQty)} | Min Price: ${Number(stockItem.minUnitPrice).toFixed(2)}</p>
                            {stockItem.truckloadOnly && (
                              <p className="text-status-warning">Must be multiple of {Number(stockItem.minOrderQty)}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <Input
                      label="Quantity"
                      type="number"
                      min={Number(stockItem?.minOrderQty) || 1}
                      step={stockItem?.truckloadOnly ? Number(stockItem.minOrderQty) : 1}
                      value={item.qty}
                      onChange={(e) => updateItem(index, { qty: Number(e.target.value) })}
                    />
                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      min={Number(stockItem?.minUnitPrice) || 0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                    />
                    <Input
                      label="Discount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={item.unitPrice - (Number(stockItem?.minUnitPrice) || 0)}
                      value={item.discount}
                      onChange={(e) => updateItem(index, { discount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="pt-3 border-t border-border-default flex justify-between items-center">
                    <span className="text-sm text-content-secondary">Line Total:</span>
                    <span className="text-lg font-bold text-content-primary">${item.lineTotal.toFixed(2)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 border-2 border-dashed border-border-default text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
            <p className="text-lg font-semibold text-content-primary mb-2">No products added yet</p>
            <p className="text-sm text-content-secondary">Click on a product to add it to the quote</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// Step 5: Review
function Step5Review({ quoteData }: { quoteData: QuoteDataUI }) {
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await customersApi.findAll(1, 100);
      return res.data.data;
    },
  });
  const { data: projectsData } = useQuery({
    queryKey: ['projects', quoteData.companyId],
    queryFn: async () => {
      const res = await projectsApi.findAll(quoteData.companyId, 1, 100);
      return res.data.data;
    },
    enabled: !!quoteData.companyId,
  });
  const { data: stockItemsData } = useQuery({
    queryKey: ['stock-items', quoteData.companyId, quoteData.projectId],
    queryFn: async () => {
      const res = await stockItemsApi.findAll(quoteData.companyId, quoteData.projectId, 1, 100);
      return res.data.data;
    },
    enabled: !!quoteData.companyId && !!quoteData.projectId,
  });

  const company = companiesData?.items.find(c => c.id === quoteData.companyId);
  const customer = customersData?.items.find(c => c.id === quoteData.customerId);
  const project = projectsData?.items.find(p => p.id === quoteData.projectId);
  
  const subtotal = (quoteData.items || []).reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const discountTotal = (quoteData.items || []).reduce((sum, item) => sum + (item.qty * item.discount), 0);
  // Transport is calculated server-side, so we don't include it in the preview
  const grandTotal = subtotal - discountTotal;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Company</h3>
              <p className="text-sm text-content-secondary">{company?.name || 'Not selected'}</p>
              {company?.email && <p className="text-xs text-content-tertiary mt-1">{company.email}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Customer</h3>
              <p className="text-sm text-content-secondary">
                {customer
                  ? (customer.type === 'COMPANY' ? (customer.companyName || 'Unknown Company') : `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer')
                  : 'Not selected'}
              </p>
              {customer?.email && <p className="text-xs text-content-tertiary mt-1">{customer.email}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Project</h3>
              <p className="text-sm text-content-secondary">{project?.name || 'Not selected'}</p>
              {project?.description && <p className="text-xs text-content-tertiary mt-1">{project.description}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Delivery Method</h3>
              <p className="text-sm text-content-secondary">{quoteData.deliveryMethod || 'Not selected'}</p>
              {quoteData.deliveryMethod === 'DELIVERED' && quoteData.deliveryAddressLine1 && (
                <p className="text-xs text-content-tertiary mt-1">{quoteData.deliveryAddressLine1}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-content-primary" />
          <h3 className="text-xl font-semibold text-content-primary">Products & Pricing</h3>
        </div>
        <div className="space-y-4">
          {(quoteData.items || []).map((item, index) => {
            const stockItem = stockItemsData?.items.find(si => si.id === item.stockItemId);
            return (
              <div key={index} className="flex justify-between items-start py-4 border-b border-border-default">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-content-tertiary" />
                    <p className="font-semibold text-content-primary">{item.nameSnapshot}</p>
                  </div>
                  <p className="text-sm text-content-secondary mb-1">
                    {item.qty} {item.uomSnapshot} × ${item.unitPrice.toFixed(2)}
                    {item.discount > 0 && (
                      <span className="text-status-warning ml-2">- ${item.discount.toFixed(2)} discount</span>
                    )}
                  </p>
                  {stockItem && stockItem.sku && (
                    <p className="text-xs text-content-tertiary">SKU: {stockItem.sku}</p>
                  )}
                </div>
                <p className="text-lg font-bold text-content-primary ml-4">${item.lineTotal.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-6 border-t border-border-default space-y-3">
          <div className="flex justify-between text-content-secondary">
            <span>Subtotal:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-status-warning">
              <span>Discount:</span>
              <span className="font-semibold">-${discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-content-primary pt-3 border-t border-border-default">
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <div className="mt-4 p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
            <p className="text-xs text-content-secondary">
              <Info className="w-4 h-4 inline mr-1" />
              Note: Transport costs will be calculated and added by the system
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
