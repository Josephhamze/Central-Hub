import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, User, Package, Truck, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card, CardHeader } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { useToast } from '@contexts/ToastContext';
import { quotesApi, type CreateQuoteDto } from '@services/sales/quotes';
import { companiesApi, type Company } from '@services/sales/companies';
import { cn } from '@utils/cn';

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
  const [quoteData, setQuoteData] = useState<Partial<CreateQuoteDto>>({
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
    onSuccess: (res) => {
      success('Quote created successfully');
      navigate(`/sales/quotes/${res.data.data.id}`);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create quote');
    },
  });

  const handleNext = () => {
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
    if (!quoteData.companyId || !quoteData.projectId || !quoteData.customerId || !quoteData.items || quoteData.items.length === 0) {
      showError('Please complete all required fields');
      return;
    }
    createQuoteMutation.mutate(quoteData as CreateQuoteDto);
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
            {currentStep === 3 && <Step3ProjectDelivery quoteData={quoteData} onUpdate={setQuoteData} />}
            {currentStep === 4 && <Step4Products quoteData={quoteData} onUpdate={setQuoteData} />}
            {currentStep === 5 && <Step5Review quoteData={quoteData as CreateQuoteDto} />}
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

// Step 2: Client Selection (simplified - would need full customer/contact selection)
function Step2ClientSelection({ quoteData, onUpdate }: { quoteData: Partial<CreateQuoteDto>; onUpdate: (data: Partial<CreateQuoteDto>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-content-secondary">Customer and contact selection UI would go here</p>
      <Input label="Customer ID" value={quoteData.customerId || ''} onChange={(e) => onUpdate({ ...quoteData, customerId: e.target.value })} />
    </div>
  );
}

// Step 3: Project & Delivery
function Step3ProjectDelivery({ quoteData, onUpdate }: { quoteData: Partial<CreateQuoteDto>; onUpdate: (data: Partial<CreateQuoteDto>) => void }) {
  return (
    <div className="space-y-4">
      <Input label="Project ID" value={quoteData.projectId || ''} onChange={(e) => onUpdate({ ...quoteData, projectId: e.target.value })} />
      <div>
        <label className="block text-sm font-medium mb-2">Delivery Method</label>
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

// Step 4: Products (simplified)
function Step4Products({ quoteData, onUpdate }: { quoteData: Partial<CreateQuoteDto>; onUpdate: (data: Partial<CreateQuoteDto>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-content-secondary">Product selection UI would go here with validation</p>
    </div>
  );
}

// Step 5: Review
function Step5Review({ quoteData }: { quoteData: CreateQuoteDto }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review Quote</h3>
      <p className="text-content-secondary">Review all details before submitting</p>
    </div>
  );
}
