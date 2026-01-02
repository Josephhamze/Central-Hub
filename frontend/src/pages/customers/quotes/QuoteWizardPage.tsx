import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, User, Package, Truck, FileText, CheckCircle2, X, Plus, Search } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card, CardHeader } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { useToast } from '@contexts/ToastContext';
import { quotesApi, type CreateQuoteDto, type CreateQuoteItemDto } from '@services/sales/quotes';
import { companiesApi, type Company } from '@services/sales/companies';
import { customersApi } from '@services/sales/customers';
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
}

const STEPS = [
  { id: 1, name: 'Company', icon: Building2 },
  { id: 2, name: 'Client', icon: User },
  { id: 3, name: 'Project & Delivery', icon: Truck },
  { id: 4, name: 'Products', icon: Package },
  { id: 5, name: 'Review', icon: FileText },
];

export function QuoteWizardPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteDataUI>({
    items: [],
  });

  // Fetch companies for step 1
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data: CreateQuoteDto) => quotesApi.create(data),
    onSuccess: () => {
      success('Quote created successfully');
      navigate(`/sales/quotes`);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create quote');
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
    if (currentStep === 3 && (!quoteData.projectId || !quoteData.deliveryMethod)) {
      showError('Please complete project and delivery method');
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
    if (!quoteData.companyId || !quoteData.projectId || !quoteData.customerId || !quoteData.deliveryMethod || !quoteData.items || quoteData.items.length === 0) {
      showError('Please complete all required fields');
      return;
    }
    // Convert UI items to DTO items (remove UI-only fields)
    const dtoItems: CreateQuoteItemDto[] = quoteData.items.map(item => ({
      stockItemId: item.stockItemId,
      qty: item.qty,
      unitPrice: item.unitPrice,
      discount: item.discount,
    }));
    const dto: CreateQuoteDto = {
      ...quoteData,
      companyId: quoteData.companyId!,
      projectId: quoteData.projectId!,
      customerId: quoteData.customerId!,
      deliveryMethod: quoteData.deliveryMethod!,
      items: dtoItems,
    };
    createQuoteMutation.mutate(dto);
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    currentStep >= step.id ? 'bg-accent-primary border-accent-primary text-white' : 'border-border-default text-content-secondary',
                  )}>
                    {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className={cn('mt-2 text-xs font-medium', currentStep >= step.id ? 'text-content-primary' : 'text-content-secondary')}>
                    {step.name}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1 mx-4', currentStep > step.id ? 'bg-accent-primary' : 'bg-border-default')} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader title={`Step ${currentStep}: ${STEPS[currentStep - 1].name}`} />
          <div className="p-6">
            {currentStep === 1 && <Step1CompanySelection companies={companiesData?.items || []} selected={quoteData.companyId} onSelect={(id) => setQuoteData({ ...quoteData, companyId: id })} />}
            {currentStep === 2 && <Step2ClientSelection quoteData={quoteData} onUpdate={setQuoteData} />}
            {currentStep === 3 && <Step3ProjectDelivery companyId={quoteData.companyId} quoteData={quoteData} onUpdate={setQuoteData} />}
            {currentStep === 4 && <Step4Products companyId={quoteData.companyId} projectId={quoteData.projectId} quoteData={quoteData} onUpdate={setQuoteData} />}
            {currentStep === 5 && <Step5Review quoteData={quoteData} />}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={handleBack} disabled={currentStep === 1}>
            Back
          </Button>
          {currentStep < STEPS.length ? (
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} isLoading={createQuoteMutation.isPending}>
              Create Quote
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Company Selection
function Step1CompanySelection({ companies, selected, onSelect }: { companies: Company[]; selected?: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <Card
          key={company.id}
          className={cn('cursor-pointer transition-all hover:shadow-lg', selected === company.id && 'ring-2 ring-accent-primary')}
          onClick={() => onSelect(company.id)}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-2">{company.name}</h3>
            {company.legalName && <p className="text-sm text-content-secondary mb-2">{company.legalName}</p>}
            {company.email && <p className="text-sm text-content-tertiary">{company.email}</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Step 2: Client Selection
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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customersData?.items.map((customer) => (
          <Card
            key={customer.id}
            className={cn('cursor-pointer transition-all hover:shadow-lg', quoteData.customerId === customer.id && 'ring-2 ring-accent-primary')}
            onClick={() => onUpdate({ ...quoteData, customerId: customer.id })}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-2">
                {customer.type === 'COMPANY' ? customer.companyName : `${customer.firstName} ${customer.lastName}`}
              </h3>
              {customer.email && <p className="text-sm text-content-secondary mb-2">{customer.email}</p>}
              {customer.phone && <p className="text-sm text-content-tertiary">{customer.phone}</p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Step 3: Project & Delivery
function Step3ProjectDelivery({ companyId, quoteData, onUpdate }: { companyId?: string; quoteData: QuoteDataUI; onUpdate: (data: QuoteDataUI) => void }) {
  const { data: projectsData } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: async () => {
      const res = await projectsApi.findAll(companyId, 1, 100);
      return res.data.data;
    },
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <div className="text-center py-8 text-content-secondary">
        Please select a company in Step 1 first
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Project *</label>
        <select
          className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
          value={quoteData.projectId || ''}
          onChange={(e) => onUpdate({ ...quoteData, projectId: e.target.value })}
        >
          <option value="">Select a project</option>
          {projectsData?.items.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        {projectsData?.items.length === 0 && (
          <p className="text-sm text-content-tertiary mt-2">No projects found for this company</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Delivery Method *</label>
        <div className="flex gap-4">
          <Button variant={quoteData.deliveryMethod === 'DELIVERED' ? 'primary' : 'secondary'} onClick={() => onUpdate({ ...quoteData, deliveryMethod: 'DELIVERED' })}>
            Delivered
          </Button>
          <Button variant={quoteData.deliveryMethod === 'COLLECTED' ? 'primary' : 'secondary'} onClick={() => onUpdate({ ...quoteData, deliveryMethod: 'COLLECTED' })}>
            Collected
          </Button>
        </div>
      </div>
      {quoteData.deliveryMethod === 'DELIVERED' && (
        <div className="space-y-4 mt-4">
          <Input label="Delivery Address Line 1" value={quoteData.deliveryAddressLine1 || ''} onChange={(e) => onUpdate({ ...quoteData, deliveryAddressLine1: e.target.value })} />
          <Input label="City" value={quoteData.deliveryCity || ''} onChange={(e) => onUpdate({ ...quoteData, deliveryCity: e.target.value })} />
          <Input label="Postal Code" value={quoteData.deliveryPostalCode || ''} onChange={(e) => onUpdate({ ...quoteData, deliveryPostalCode: e.target.value })} />
        </div>
      )}
    </div>
  );
}

// Step 4: Products
function Step4Products({ companyId, projectId, quoteData, onUpdate }: { companyId?: string; projectId?: string; quoteData: QuoteDataUI; onUpdate: (data: QuoteDataUI) => void }) {
  const { error: showError } = useToast();
  const [search, setSearch] = useState('');
  const { data: stockItemsData } = useQuery({
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
    const newItem: QuoteItemUI = {
      stockItemId: stockItem.id,
      nameSnapshot: stockItem.name,
      uomSnapshot: stockItem.uom,
      qty: stockItem.minOrderQty,
      unitPrice: stockItem.defaultUnitPrice,
      discount: 0,
      lineTotal: stockItem.defaultUnitPrice * stockItem.minOrderQty,
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

    if (unitPrice - discount < stockItem.minUnitPrice) {
      showError(`Unit price after discount must be at least $${stockItem.minUnitPrice}`);
      return;
    }
    if (qty < stockItem.minOrderQty) {
      showError(`Quantity must be at least ${stockItem.minOrderQty}`);
      return;
    }
    if (stockItem.truckloadOnly && qty % stockItem.minOrderQty !== 0) {
      showError(`Quantity must be a multiple of ${stockItem.minOrderQty} (truckload only)`);
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
    si.name.toLowerCase().includes(search.toLowerCase()) ||
    si.sku.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (!companyId || !projectId) {
    return (
      <div className="text-center py-8 text-content-secondary">
        Please complete Steps 1 and 3 first
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
        <Input
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Available Products</h3>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-content-secondary">
            {search ? 'No products found matching your search' : 'No products available for this project'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((stockItem) => (
              <Card key={stockItem.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-content-primary">{stockItem.name}</h4>
                    <p className="text-sm text-content-secondary">SKU: {stockItem.sku}</p>
                    <p className="text-sm text-content-tertiary mt-1">${stockItem.defaultUnitPrice.toFixed(2)} / {stockItem.uom}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-content-tertiary">Min Qty: {stockItem.minOrderQty}</p>
                      <p className="text-xs text-content-tertiary">Min Price: ${stockItem.minUnitPrice.toFixed(2)}</p>
                      {stockItem.truckloadOnly && (
                        <p className="text-xs text-status-warning">Truckload only</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => addItem(stockItem)} leftIcon={<Plus className="w-4 h-4" />}>
                    Add
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {quoteData.items && quoteData.items.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Selected Products ({quoteData.items.length})</h3>
          <div className="space-y-4">
            {quoteData.items.map((item, index) => {
              const stockItem = stockItemsData?.items.find(si => si.id === item.stockItemId);
              return (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-content-primary">{item.nameSnapshot}</h4>
                      <p className="text-sm text-content-secondary">{item.uomSnapshot}</p>
                      {stockItem && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-content-tertiary">Min: {stockItem.minOrderQty} | Min Price: ${stockItem.minUnitPrice.toFixed(2)}</p>
                          {stockItem.truckloadOnly && (
                            <p className="text-xs text-status-warning">Must be multiple of {stockItem.minOrderQty}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeItem(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Quantity"
                      type="number"
                      min={stockItem?.minOrderQty || 1}
                      step={stockItem?.truckloadOnly ? stockItem.minOrderQty : 1}
                      value={item.qty}
                      onChange={(e) => updateItem(index, { qty: Number(e.target.value) })}
                    />
                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      min={stockItem?.minUnitPrice || 0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                    />
                    <Input
                      label="Discount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={item.unitPrice - (stockItem?.minUnitPrice || 0)}
                      value={item.discount}
                      onChange={(e) => updateItem(index, { discount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-content-secondary">Line Total:</span>
                    <span className="font-semibold text-content-primary">${item.lineTotal.toFixed(2)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
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
  const discountTotal = (quoteData.items || []).reduce((sum, item) => sum + (item.qty * item.discount), 0);
  // Transport is calculated server-side, so we don't include it in the preview
  const grandTotal = subtotal - discountTotal;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold text-content-primary mb-3">Company</h3>
          <p className="text-content-secondary">{company?.name || 'Not selected'}</p>
          {company?.email && <p className="text-sm text-content-tertiary mt-1">{company.email}</p>}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-content-primary mb-3">Customer</h3>
          <p className="text-content-secondary">
            {customer 
              ? (customer.type === 'COMPANY' ? customer.companyName : `${customer.firstName} ${customer.lastName}`)
              : 'Not selected'}
          </p>
          {customer?.email && <p className="text-sm text-content-tertiary mt-1">{customer.email}</p>}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-content-primary mb-3">Project</h3>
          <p className="text-content-secondary">{project?.name || 'Not selected'}</p>
          {project?.description && <p className="text-sm text-content-tertiary mt-1">{project.description}</p>}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-content-primary mb-3">Delivery Method</h3>
          <p className="text-content-secondary">{quoteData.deliveryMethod || 'Not selected'}</p>
          {quoteData.deliveryMethod === 'DELIVERED' && quoteData.deliveryAddressLine1 && (
            <div className="mt-2 text-sm text-content-tertiary">
              <p>{quoteData.deliveryAddressLine1}</p>
              {quoteData.deliveryCity && <p>{quoteData.deliveryCity}, {quoteData.deliveryPostalCode}</p>}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-content-primary mb-4">Products & Pricing</h3>
        <div className="space-y-3">
          {(quoteData.items || []).map((item, index) => {
            const stockItem = stockItemsData?.items.find(si => si.id === item.stockItemId);
            return (
              <div key={index} className="flex justify-between items-start py-3 border-b border-border-default">
                <div className="flex-1">
                  <p className="font-medium text-content-primary">{item.nameSnapshot}</p>
                  <p className="text-sm text-content-secondary mt-1">
                    {item.qty} {item.uomSnapshot} × ${item.unitPrice.toFixed(2)}
                    {item.discount > 0 && (
                      <span className="text-status-warning"> - ${item.discount.toFixed(2)} discount</span>
                    )}
                  </p>
                  {stockItem && (
                    <p className="text-xs text-content-tertiary mt-1">SKU: {stockItem.sku}</p>
                  )}
                </div>
                <p className="font-semibold text-content-primary ml-4">${item.lineTotal.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-border-default space-y-2">
          <div className="flex justify-between text-content-secondary">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-status-warning">
              <span>Discount:</span>
              <span>-${discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-content-primary pt-2 border-t border-border-default">
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-content-tertiary mt-2">Note: Transport costs will be calculated and added by the system</p>
        </div>
      </Card>
    </div>
  );
}
