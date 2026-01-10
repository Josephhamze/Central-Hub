import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { quotesApi, type CreateQuoteDto, type CreateQuoteItemDto } from '@services/sales/quotes';
import { companiesApi, type Company } from '@services/sales/companies';
import { customersApi } from '@services/sales/customers';
import { contactsApi } from '@services/sales/contacts';
import { warehousesApi } from '@services/sales/warehouses';
import { projectsApi } from '@services/sales/projects';
import { stockItemsApi, type StockItem } from '@services/sales/stock-items';
import { routesApi, type Route } from '@services/logistics/routes';
import { cn } from '@utils/cn';

// Local UI type for quote items (extends DTO with UI-only fields)
interface QuoteItemUI extends Omit<CreateQuoteItemDto, 'discountPercentage'> {
  nameSnapshot: string;
  uomSnapshot: string;
  discountPercentage: number; // UI uses percentage (0-100)
  lineTotal: number;
}

// Extended quote data type for UI state
interface QuoteDataUI extends Omit<Partial<CreateQuoteDto>, 'items'> {
  items?: QuoteItemUI[];
  warehouseId?: string; // UI-only field for warehouse selection
  validityDays?: number;
  paymentTerms?: 'CASH_ON_DELIVERY' | 'DAYS_15' | 'DAYS_30';
  deliveryStartDate?: string;
  serviceEndDate?: string;
  loadsPerDay?: number;
  truckType?: 'TIPPER_42T' | 'FLATBED_40T';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteDataUI>({
    items: [],
    companyId: searchParams.get('companyId') || undefined,
  });

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

  // Generate quote number (in real app, this would come from backend)
  const quoteNumber = existingQuote?.quoteNumber || `EE-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 10000)}`;

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
        routeId: existingQuote.routeId,
        validityDays: existingQuote.validityDays,
        paymentTerms: existingQuote.paymentTerms,
        deliveryStartDate: existingQuote.deliveryStartDate,
        loadsPerDay: existingQuote.loadsPerDay,
        serviceEndDate: existingQuote.serviceEndDate,
        truckType: existingQuote.truckType,
        items: existingQuote.items?.map(item => ({
          stockItemId: item.stockItemId,
          nameSnapshot: item.nameSnapshot,
          uomSnapshot: item.uomSnapshot,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
          discountPercentage: Number(item.discountPercentage || 0),
          lineTotal: Number(item.lineTotal),
        })) || [],
      });
    }
  }, [existingQuote, quoteId]);

  const createQuoteMutation = useMutation({
    mutationFn: (data: CreateQuoteDto) => quoteId ? quotesApi.update(quoteId, data) : quotesApi.create(data),
    onSuccess: (response) => {
      // Invalidate and refetch all quote-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'overview'] });
      
      // Refetch immediately to ensure data is up to date
      queryClient.refetchQueries({ queryKey: ['quotes'] });
      queryClient.refetchQueries({ queryKey: ['quotes-kpis'] });
      
      // If we created a new quote, also invalidate the specific quote query
      if (!quoteId && response?.data?.data?.id) {
        queryClient.invalidateQueries({ queryKey: ['quote', response.data.data.id] });
      }
      
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
    if (currentStep === 3 && (!quoteData.projectId || !quoteData.deliveryMethod || (quoteData.deliveryMethod === 'DELIVERED' && !quoteData.deliveryAddressLine1))) {
      showError('Please complete project, delivery method, and delivery address');
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
    if (!quoteData.companyId || !quoteData.projectId || !quoteData.customerId || !quoteData.deliveryMethod || !quoteData.items || quoteData.items.length === 0 || (quoteData.deliveryMethod === 'DELIVERED' && !quoteData.deliveryAddressLine1)) {
      showError('Please complete all required fields. Address is required for delivered quotes.');
      return;
    }
    
    // Check if route is required for DELIVERED quotes
    if (quoteData.deliveryMethod === 'DELIVERED' && !quoteData.routeId) {
      showError('A route is required for delivered quotes. Please request a route or select an existing one before submitting.');
      return;
    }
    // Convert UI items to DTO items (remove UI-only fields)
    const dtoItems: CreateQuoteItemDto[] = quoteData.items.map(item => ({
      stockItemId: item.stockItemId,
      qty: item.qty,
      unitPrice: item.unitPrice,
      discountPercentage: item.discountPercentage,
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
      routeId: quoteData.routeId,
      validityDays: quoteData.validityDays,
      paymentTerms: quoteData.paymentTerms,
      deliveryStartDate: quoteData.deliveryStartDate,
      loadsPerDay: quoteData.loadsPerDay,
      truckType: quoteData.truckType,
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
{quoteId ? "Update Quote" : "Create Quote"}
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

// Fuzzy string matching function (Levenshtein distance based similarity)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple Levenshtein distance calculation
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

// Step 3: Project & Delivery - Enhanced Two-Column Layout
function Step3ProjectDelivery({ companyId, quoteData, onUpdate }: { companyId?: string; quoteData: QuoteDataUI; onUpdate: (data: QuoteDataUI) => void }) {
  const { hasRole } = useAuth();
  const { error: showError, success } = useToast();
  const queryClient = useQueryClient();
  const [suggestedRoute, setSuggestedRoute] = useState<Route | null>(null);
  const [showRouteConfirmModal, setShowRouteConfirmModal] = useState(false);
  const [showRouteRequestModal, setShowRouteRequestModal] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressInputFocused, setAddressInputFocused] = useState(false);
  const [routeRequestData, setRouteRequestData] = useState<{
    fromCity?: string;
    toCity?: string;
    distanceKm?: number;
    timeHours?: number;
    warehouseId?: string;
    notes?: string;
  }>({
    fromCity: undefined,
    toCity: undefined,
    distanceKm: undefined,
  });
  
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

  // Fetch routes for matching - refetch periodically to check for newly approved routes
  const { data: routesData } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await routesApi.findAll(1, 200, { isActive: true });
      return res.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds to check for new routes
  });

  // Fetch company data to get city
  const { data: companyData } = useQuery({
    queryKey: ['company', quoteData.companyId],
    queryFn: async () => {
      if (!quoteData.companyId) return null;
      const res = await companiesApi.findOne(quoteData.companyId);
      return res.data.data;
    },
    enabled: !!quoteData.companyId,
  });

  // Routes are fetched at the top level to allow refetching

  // Generate address suggestions from routes and existing addresses
  useEffect(() => {
    if (!quoteData.deliveryAddressLine1 || quoteData.deliveryAddressLine1.length < 2) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    const input = quoteData.deliveryAddressLine1.toLowerCase();
    const suggestions: string[] = [];

    // Get unique destination cities from routes
    const routeCities = new Set<string>();
    routesData?.items.forEach(route => {
      if (route.toCity.toLowerCase().includes(input)) {
        routeCities.add(route.toCity);
      }
    });

    // Get unique cities from company/project addresses
    if (companyData?.city && companyData.city.toLowerCase().includes(input)) {
      suggestions.push(companyData.city);
    }

    // Add route destination cities
    routeCities.forEach(city => {
      if (!suggestions.includes(city)) {
        suggestions.push(city);
      }
    });

    // Add common address patterns if they match
    const commonPatterns = [
      `${input}, Lubumbashi, DRC`,
      `${input}, Kinshasa, DRC`,
      `${input}, Kolwezi, DRC`,
    ];

    commonPatterns.forEach(pattern => {
      if (!suggestions.includes(pattern)) {
        suggestions.push(pattern);
      }
    });

    setAddressSuggestions(suggestions.slice(0, 5)); // Limit to 5 suggestions
    setShowAddressSuggestions(suggestions.length > 0 && addressInputFocused);
  }, [quoteData.deliveryAddressLine1, routesData, companyData, addressInputFocused]);

  // Get company city from selected warehouse or company
  const selectedWarehouse = warehousesData?.items.find(w => w.id === quoteData.warehouseId);
  const fromCity = selectedWarehouse?.locationCity || (companyData as any)?.city || '';

  // Route suggestion logic - extract city from address or use full address
  useEffect(() => {
    if (!quoteData.deliveryAddressLine1 || !fromCity || quoteData.routeId) return;
    
    const deliveryAddress = quoteData.deliveryAddressLine1.trim();
    if (deliveryAddress.length < 3) return;

    // Try to extract city from address (usually the last part before country, or a common pattern)
    // For now, we'll use the full address for matching, but prioritize city-like matches
    const addressParts = deliveryAddress.split(',').map(p => p.trim());
    const possibleCity = addressParts[addressParts.length - 2] || addressParts[addressParts.length - 1] || deliveryAddress;

    // Find similar routes
    const routes = routesData?.items || [];
    const matches: Array<{ route: Route; similarity: number }> = [];

    for (const route of routes) {
      // Check if fromCity matches (warehouse city or company city)
      const fromCityMatch = calculateSimilarity(fromCity, route.fromCity) > 0.7;
      if (!fromCityMatch) continue;

      // Check if toCity matches delivery address (try both city extraction and full address)
      const toCitySimilarity = Math.max(
        calculateSimilarity(possibleCity, route.toCity),
        calculateSimilarity(deliveryAddress, route.toCity) * 0.7 // Full address match is weighted less
      );
      if (toCitySimilarity > 0.6) {
        matches.push({ route, similarity: toCitySimilarity });
      }
    }

    // Sort by similarity and get best match
    matches.sort((a, b) => b.similarity - a.similarity);
    const bestMatch = matches[0];

    if (bestMatch && bestMatch.similarity > 0.6) {
      setSuggestedRoute(bestMatch.route);
      setShowRouteConfirmModal(true);
    }
  }, [quoteData.deliveryAddressLine1, fromCity, routesData, quoteData.routeId]);

  const handleConfirmRoute = () => {
    if (suggestedRoute) {
      onUpdate({ ...quoteData, routeId: suggestedRoute.id });
      setShowRouteConfirmModal(false);
      setSuggestedRoute(null);
      success(`Route "${suggestedRoute.fromCity} → ${suggestedRoute.toCity}" selected`);
    }
  };

  const handleRejectRoute = () => {
    setShowRouteConfirmModal(false);
    setSuggestedRoute(null);
    // Don't automatically open route request modal - user can request route manually
  };
  
  const handleRequestRoute = () => {
    // Extract city from address for route request
    const addressParts = (quoteData.deliveryAddressLine1 || '').split(',').map(p => p.trim());
    const requestCity = addressParts[addressParts.length - 2] || addressParts[addressParts.length - 1] || quoteData.deliveryAddressLine1 || '';
    
    setRouteRequestData({
      fromCity: fromCity || undefined,
      toCity: requestCity || undefined,
      distanceKm: undefined,
      warehouseId: quoteData.warehouseId,
    });
    setShowRouteRequestModal(true);
  };

  const routeRequestMutation = useMutation({
    mutationFn: async (data: typeof routeRequestData) => {
      return routesApi.createRequest(data);
    },
    onSuccess: () => {
      success('Route creation request submitted. An administrator will review and approve it. You can save this quote as draft and submit it for approval once the route is created.');
      setShowRouteRequestModal(false);
      setRouteRequestData({ fromCity: undefined, toCity: undefined, distanceKm: undefined, warehouseId: undefined });
      // Refetch routes to get any newly approved routes
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to submit route request');
    },
  });

  const handleSubmitRouteRequest = () => {
    // Allow submitting with blank fields - admin will fill them in
    routeRequestMutation.mutate(routeRequestData);
  };

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
              <div className="relative">
                <Input
                  label="Address *"
                  required
                  value={quoteData.deliveryAddressLine1 || ''}
                  onChange={(e) => onUpdate({ ...quoteData, deliveryAddressLine1: e.target.value })}
                  onFocus={() => setAddressInputFocused(true)}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click on suggestion
                    setTimeout(() => setShowAddressSuggestions(false), 200);
                    setAddressInputFocused(false);
                  }}
                  placeholder="Enter the full delivery address (e.g., 123 Main Street, Lubumbashi, DRC)"
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-background-hover text-content-primary text-sm"
                        onClick={() => {
                          onUpdate({ ...quoteData, deliveryAddressLine1: suggestion });
                          setShowAddressSuggestions(false);
                          setAddressInputFocused(false);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
                <p className="text-xs text-content-secondary">
                  <strong>Tip:</strong> The system will automatically suggest existing routes based on your address. If no route is found, you can request a new one.
                </p>
              </div>
              {quoteData.routeId ? (
                <div className="p-3 bg-status-success-bg border-l-4 border-status-success rounded-r-lg">
                  <p className="text-xs text-content-secondary">
                    <strong>Route Selected:</strong> {routesData?.items.find(r => r.id === quoteData.routeId)?.fromCity} → {routesData?.items.find(r => r.id === quoteData.routeId)?.toCity}
                  </p>
                </div>
              ) : quoteData.deliveryMethod === 'DELIVERED' ? (
                <div className="p-3 bg-status-warning-bg border-l-4 border-status-warning rounded-r-lg">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-content-secondary flex-1">
                      <strong>No route selected.</strong> You can request a new route or select an existing one. Quotes can be saved as draft without a route, but a route is required before submitting for approval.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRequestRoute}
                      className="ml-2 flex-shrink-0"
                    >
                      Request Route
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Route Confirmation Modal */}
      <Modal
        isOpen={showRouteConfirmModal}
        onClose={() => {
          setShowRouteConfirmModal(false);
          setSuggestedRoute(null);
        }}
        title="Similar Route Found"
        size="md"
      >
        {suggestedRoute && (
          <div className="space-y-4">
            <p className="text-sm text-content-secondary">
              We found a similar route. Is this the route you want to use?
            </p>
            <Card className="p-4 bg-background-hover">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-content-primary">From:</span>
                  <span className="text-sm text-content-secondary">{suggestedRoute.fromCity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-content-primary">To:</span>
                  <span className="text-sm text-content-secondary">{suggestedRoute.toCity}</span>
                </div>
                {suggestedRoute.distanceKm && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-content-primary">Distance:</span>
                    <span className="text-sm text-content-secondary">{Number(suggestedRoute.distanceKm).toFixed(2)} km</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={handleRejectRoute}
          >
            No, Create New Route
          </Button>
          <Button variant="primary" onClick={handleConfirmRoute}>
            Yes, Use This Route
          </Button>
        </ModalFooter>
      </Modal>

      {/* Route Creation Request Modal */}
      <Modal
        isOpen={showRouteRequestModal}
        onClose={() => {
          setShowRouteRequestModal(false);
          setRouteRequestData({ fromCity: '', toCity: '', distanceKm: 0 });
        }}
        title="Create New Route Request"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-content-secondary">
            This route will be submitted for administrator approval. You can leave fields blank if you don't have the information - administrators will fill them in. Note: Toll stations and cost per km will be configured by administrators.
          </p>
          <Input
            label="From City"
            value={routeRequestData.fromCity}
            onChange={(e) => setRouteRequestData({ ...routeRequestData, fromCity: e.target.value })}
            placeholder="Departure city (optional - admin will fill in)"
          />
          <Input
            label="To City"
            value={routeRequestData.toCity || ''}
            onChange={(e) => setRouteRequestData({ ...routeRequestData, toCity: e.target.value })}
            placeholder="Destination city (optional - admin will fill in)"
          />
          <Input
            label="Distance (km)"
            type="number"
            value={routeRequestData.distanceKm || ''}
            onChange={(e) => setRouteRequestData({ ...routeRequestData, distanceKm: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="Distance in kilometers (optional - admin will fill in)"
          />
          <Input
            label="Time (hours)"
            type="number"
            value={routeRequestData.timeHours || ''}
            onChange={(e) => setRouteRequestData({ ...routeRequestData, timeHours: parseFloat(e.target.value) || undefined })}
            placeholder="Estimated travel time in hours"
          />
          <div>
            <label className="block text-sm font-medium mb-2 text-content-primary">Warehouse</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
              value={routeRequestData.warehouseId || ''}
              onChange={(e) => setRouteRequestData({ ...routeRequestData, warehouseId: e.target.value || undefined })}
            >
              <option value="">Select warehouse (optional)</option>
              {warehousesData?.items.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} {warehouse.locationCity ? `(${warehouse.locationCity})` : ''}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Notes"
            value={routeRequestData.notes || ''}
            onChange={(e) => setRouteRequestData({ ...routeRequestData, notes: e.target.value || undefined })}
            placeholder="Additional notes about this route (optional)"
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowRouteRequestModal(false);
              setRouteRequestData({ fromCity: undefined, toCity: undefined, distanceKm: undefined });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitRouteRequest}
            disabled={routeRequestMutation.isPending}
          >
            {routeRequestMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Quote Terms - Full Width */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-content-primary" />
          <h3 className="text-lg font-semibold text-content-primary">Quote Terms</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Validity Days */}
          <Input
            label="Quote Validity (Days)"
            type="number"
            min="1"
            max={hasRole('Administrator') || hasRole('Admin') ? undefined : 7}
            value={quoteData.validityDays || 7}
            onChange={(e) => {
              const days = parseInt(e.target.value, 10);
              if (days >= 1) {
                const isAdmin = hasRole('Administrator') || hasRole('Admin');
                if (!isAdmin && days > 7) {
                  showError('Only administrators can set validity days greater than 7');
                  return;
                }
                onUpdate({ ...quoteData, validityDays: days });
              }
            }}
            placeholder="7"
            disabled={!hasRole('Administrator') && !hasRole('Admin') && (quoteData.validityDays || 7) >= 7}
          />

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium mb-2 text-content-primary">Payment Terms</label>
            <select
              value={quoteData.paymentTerms || ''}
              onChange={(e) => onUpdate({ ...quoteData, paymentTerms: e.target.value as any || undefined })}
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
            >
              <option value="">Select payment terms</option>
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
              <option value="DAYS_15">15 Days</option>
              <option value="DAYS_30">30 Days</option>
            </select>
          </div>
        </div>


      </div>
    </div>
  );
}


// Helper function to calculate total tonnage from quote items
function calculateTotalTonnage(items: QuoteItemUI[]): number {
  let totalTonnage = 0;
  for (const item of items) {
    const qty = Number(item.qty);
    const uom = item.uomSnapshot.toUpperCase();
    
    // Convert to tons based on UOM
    if (uom === 'TON' || uom === 'TONS' || uom === 'T') {
      totalTonnage += qty;
    } else if (uom === 'KG' || uom === 'KGS' || uom === 'KILOGRAM' || uom === 'KILOGRAMS') {
      totalTonnage += qty / 1000; // Convert kg to tons
    } else if (uom === 'MT' || uom === 'METRIC TON' || uom === 'METRIC TONS') {
      totalTonnage += qty;
    } else {
      // For other UOMs, assume they're already in tons or use quantity as-is
      totalTonnage += qty;
    }
  }
  return totalTonnage;
}

// Helper function to check if a product is aggregate
function isAggregateProduct(productName: string, description?: string): boolean {
  const name = (productName || '').toLowerCase();
  const desc = (description || '').toLowerCase();
  const aggregateKeywords = ['aggregate', 'gravel', 'stone', 'sand', 'crushed', 'rock', 'rubble', 'ballast', 'chippings'];
  return aggregateKeywords.some(keyword => name.includes(keyword) || desc.includes(keyword));
}

// Helper function to check if quote has any aggregate products
function hasAggregateProducts(items: QuoteItemUI[]): boolean {
  return items.some(item => isAggregateProduct(item.nameSnapshot));
}

// Helper function to calculate required trucks
function calculateRequiredTrucks(totalTonnage: number, truckType?: 'TIPPER_42T' | 'FLATBED_40T'): number {
  if (!truckType) return 0;
  const capacity = truckType === 'TIPPER_42T' ? 42 : 40; // Tipper = 42t, Flatbed = 40t
  return Math.ceil(totalTonnage / capacity);
}

// Calculate service end date based on delivery start date, loads per day, and total tonnage
function calculateServiceEndDate(
  deliveryStartDate: string | undefined,
  loadsPerDay: number | undefined,
  truckType: 'TIPPER_42T' | 'FLATBED_40T' | undefined,
  totalTonnage: number,
): Date | null {
  if (!deliveryStartDate || !loadsPerDay || !truckType) {
    return null;
  }

  // Truck capacity in tons
  const truckCapacity = truckType === 'TIPPER_42T' ? 42 : 40; // FLATBED_40T = 40 tons

  // Calculate number of loads needed
  const numberOfLoads = Math.ceil(totalTonnage / truckCapacity);

  // Calculate number of days needed
  const numberOfDays = Math.ceil(numberOfLoads / loadsPerDay);

  // Calculate service end date
  const startDate = new Date(deliveryStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + numberOfDays);

  return endDate;
}

// Calculate duration in days
function calculateDuration(startDate: string | undefined, endDate: Date | null): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const diffTime = endDate.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      discountPercentage: 0,
      lineTotal: defaultUnitPrice * minOrderQty,
    };
    const updatedItems = [...items, newItem];
    
    // Check if adding this item makes it an aggregate product, and if flatbed is selected, clear it
    const hasAggregate = hasAggregateProducts(updatedItems);
    const updatedQuoteData: QuoteDataUI = { ...quoteData, items: updatedItems };
    
    if (hasAggregate && quoteData.truckType === 'FLATBED_40T') {
      updatedQuoteData.truckType = undefined;
      showError('Flatbed cannot be used with aggregate products. Truck type has been cleared.');
    }
    
    onUpdate(updatedQuoteData);
  };

  const updateItem = (index: number, updates: Partial<QuoteItemUI>) => {
    const items = [...(quoteData.items || [])];
    const item = items[index];
    const stockItem = stockItemsData?.items.find(si => si.id === item.stockItemId);
    if (!stockItem) return;

    const qty = updates.qty ?? item.qty;
    const unitPrice = updates.unitPrice ?? item.unitPrice;
    const discountPercentage = updates.discountPercentage ?? item.discountPercentage;
    const discountAmount = (unitPrice * discountPercentage) / 100;
    const finalPrice = unitPrice - discountAmount;

    if (finalPrice < Number(stockItem.minUnitPrice)) {
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
      lineTotal: qty * finalPrice,
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
                      label="Discount (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max={100}
                      value={item.discountPercentage}
                      onChange={(e) => {
                        const percentage = Number(e.target.value);
                        if (percentage >= 0 && percentage <= 100) {
                          updateItem(index, { discountPercentage: percentage });
                        }
                      }}
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

      {/* Delivery Terms - Only shown for DELIVERED quotes with items */}
      {quoteData.deliveryMethod === 'DELIVERED' && quoteData.items && quoteData.items.length > 0 && (
        <div className="lg:col-span-2 space-y-4 pt-6 border-t border-border-default">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-content-primary" />
            <h3 className="text-lg font-semibold text-content-primary">Delivery Terms</h3>
          </div>

          {/* Calculate tonnage and trucks */}
          {(() => {
            const totalTonnage = calculateTotalTonnage(quoteData.items);
            const requiredTrucks = calculateRequiredTrucks(totalTonnage, quoteData.truckType);
            const truckCapacity = quoteData.truckType === 'TIPPER_42T' ? 42 : quoteData.truckType === 'FLATBED_40T' ? 40 : 0;
            const hasAggregate = hasAggregateProducts(quoteData.items);
            
            return (
              <div className="space-y-4">
                {/* Tonnage Summary */}
                <Card className="p-4 bg-status-info-bg border-status-info">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-content-secondary mb-1">Total Tonnage</p>
                      <p className="text-2xl font-bold text-content-primary">{totalTonnage.toFixed(2)} tons</p>
                    </div>
                    {quoteData.truckType && (
                      <div className="text-right">
                        <p className="text-sm text-content-secondary mb-1">Required Trucks</p>
                        <p className="text-2xl font-bold text-content-primary">
                          {requiredTrucks} {requiredTrucks === 1 ? 'truck' : 'trucks'}
                        </p>
                        <p className="text-xs text-content-tertiary mt-1">
                          ({truckCapacity}t capacity per truck)
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Truck Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-content-primary">Truck Type *</label>
                    <select
                      value={quoteData.truckType || ''}
                      onChange={(e) => {
                        const truckType = e.target.value as any || undefined;
                        onUpdate({ ...quoteData, truckType });
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                      required
                    >
                      <option value="">Select truck type</option>
                      <option value="TIPPER_42T">Tipper 42t (42 tons capacity)</option>
                      {!hasAggregate && (
                        <option value="FLATBED_40T">Flatbed 40t (40 tons capacity)</option>
                      )}
                    </select>
                    {hasAggregate && (
                      <p className="text-xs text-status-warning mt-1">
                        Flatbed not available for aggregate products
                      </p>
                    )}
                    {quoteData.truckType && (
                      <p className="text-xs text-content-tertiary mt-1">
                        {calculateRequiredTrucks(totalTonnage, quoteData.truckType)} truck{calculateRequiredTrucks(totalTonnage, quoteData.truckType) !== 1 ? 's' : ''} required
                      </p>
                    )}
                  </div>

                  {/* Delivery Start Date */}
                  <Input
                    label="Delivery Start Date"
                    type="date"
                    value={quoteData.deliveryStartDate ? quoteData.deliveryStartDate.split('T')[0] : ''}
                    onChange={(e) => onUpdate({ ...quoteData, deliveryStartDate: e.target.value ? `${e.target.value}T00:00:00` : undefined })}
                  />

                  {/* Loads Per Day */}
                  <Input
                    label="Loads Per Day (Max 5)"
                    type="number"
                    min="1"
                    max="5"
                    value={quoteData.loadsPerDay || ''}
                    onChange={(e) => {
                      const loads = parseInt(e.target.value, 10);
                      if (loads >= 1 && loads <= 5) {
                        onUpdate({ ...quoteData, loadsPerDay: loads });
                      } else if (e.target.value === '') {
                        onUpdate({ ...quoteData, loadsPerDay: undefined });
                      }
                    }}
                    placeholder="1-5"
                  />

                  {/* Service End Date - Calculated and Display Only */}
                  {(() => {
                    const calculatedEndDate = calculateServiceEndDate(
                      quoteData.deliveryStartDate,
                      quoteData.loadsPerDay,
                      quoteData.truckType,
                      totalTonnage
                    );
                    const duration = calculateDuration(quoteData.deliveryStartDate, calculatedEndDate);
                    return calculatedEndDate ? (
                      <div className="md:col-span-3">
                        <Card className="p-4 bg-status-success-bg border-status-success">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-content-secondary mb-1">Service End Date</p>
                              <p className="text-lg font-semibold text-content-primary">
                                {calculatedEndDate.toLocaleDateString()}
                              </p>
                            </div>
                            {duration !== null && (
                              <div className="text-right">
                                <p className="text-sm text-content-secondary mb-1">Duration</p>
                                <p className="text-lg font-semibold text-content-primary">
                                  {duration} day{duration !== 1 ? 's' : ''}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Validation Message */}
                {quoteData.truckType && requiredTrucks > 0 && (
                  <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
                    <p className="text-sm text-content-secondary">
                      <strong>Transport Calculation:</strong> {totalTonnage.toFixed(2)} tons ÷ {truckCapacity}t per truck = {requiredTrucks} truck{requiredTrucks !== 1 ? 's' : ''} required
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
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
  const discountTotal = (quoteData.items || []).reduce((sum, item) => {
    const discountAmount = (item.unitPrice * item.discountPercentage) / 100;
    return sum + (item.qty * discountAmount);
  }, 0);
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
                    {item.discountPercentage > 0 && (
                      <span className="text-status-warning ml-2">- {item.discountPercentage.toFixed(1)}% discount</span>
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
              <span className="font-semibold">-${discountTotal.toFixed(2)} ({((discountTotal / subtotal) * 100).toFixed(1)}%)</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-content-primary pt-3 border-t border-border-default">
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          {quoteData.routeId && quoteData.items && quoteData.items.length > 0 && (
            <div className="mt-4 p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
              <p className="text-xs text-content-secondary">
                <Info className="w-4 h-4 inline mr-1" />
                <strong>Transport Calculation:</strong> Total Tonnage × Rate Per Km × Distance = Transport Cost
                {quoteData.routeId && (
                  <span className="block mt-1">
                    (Calculated automatically based on route and total tonnage)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
