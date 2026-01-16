import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  PropertyExpense,
  ExpenseCategory,
  PaymentFrequency,
  PaymentMethod,
  Property,
} from '@/services/property-management';

export function ExpenseFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [formData, setFormData] = useState<Partial<PropertyExpense>>({
    propertyId: '',
    category: ExpenseCategory.MAINTENANCE,
    description: '',
    vendor: '',
    expenseDate: new Date().toISOString().split('T')[0],
    periodStart: '',
    periodEnd: '',
    amount: 0,
    currency: 'USD',
    taxAmount: 0,
    isPaid: false,
    paidDate: '',
    paymentMethod: undefined,
    paymentReference: '',
    isRecurring: false,
    recurringFrequency: undefined,
    invoiceNumber: '',
    notes: '',
    budgetCategory: '',
    isCapex: false,
  });

  useEffect(() => {
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const propertiesRes = await propertyManagementService.getProperties({ limit: 100 });
      setProperties(propertiesRes?.items || []);

      if (isEdit) {
        const expense = await propertyManagementService.getExpense(id!);
        setFormData({
          propertyId: expense.propertyId,
          category: expense.category,
          description: expense.description,
          vendor: expense.vendor || '',
          expenseDate: expense.expenseDate.split('T')[0],
          periodStart: expense.periodStart ? expense.periodStart.split('T')[0] : '',
          periodEnd: expense.periodEnd ? expense.periodEnd.split('T')[0] : '',
          amount: expense.amount,
          currency: expense.currency,
          taxAmount: expense.taxAmount || 0,
          isPaid: expense.isPaid,
          paidDate: expense.paidDate ? expense.paidDate.split('T')[0] : '',
          paymentMethod: expense.paymentMethod,
          paymentReference: expense.paymentReference || '',
          isRecurring: expense.isRecurring,
          recurringFrequency: expense.recurringFrequency,
          invoiceNumber: expense.invoiceNumber || '',
          notes: expense.notes || '',
          budgetCategory: expense.budgetCategory || '',
          isCapex: expense.isCapex,
        });
      }
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load data');
      if (isEdit) {
        navigate('/property-management/expenses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.propertyId || !formData.description || !formData.amount) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        totalAmount: (formData.amount || 0) + (formData.taxAmount || 0),
        periodStart: formData.periodStart || undefined,
        periodEnd: formData.periodEnd || undefined,
        paidDate: formData.paidDate || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      };

      if (isEdit) {
        await propertyManagementService.updateExpense(id!, submitData);
        success('Expense updated successfully');
      } else {
        await propertyManagementService.createExpense(submitData);
        success('Expense created successfully');
      }
      navigate('/property-management/expenses');
    } catch (err: any) {
      showError(err.response?.data?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} expense`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PropertyExpense, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/property-management/expenses')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {isEdit ? 'Edit Expense' : 'New Expense'}
          </h1>
          <p className="text-content-secondary">
            {isEdit ? 'Update expense details' : 'Record a new property expense'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Expense Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Property *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.propertyId || ''}
                onChange={(e) => handleChange('propertyId', e.target.value)}
                required
              >
                <option value="">Select Property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.propertyCode} - {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Category *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              >
                {Object.values(ExpenseCategory).map(category => (
                  <option key={category} value={category}>{category.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Description *"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the expense"
                required
              />
            </div>
            <Input
              label="Vendor"
              value={formData.vendor || ''}
              onChange={(e) => handleChange('vendor', e.target.value)}
              placeholder="Vendor or supplier name"
            />
            <Input
              label="Invoice Number"
              value={formData.invoiceNumber || ''}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
              placeholder="Invoice reference number"
            />
            <Input
              label="Expense Date *"
              type="date"
              value={formData.expenseDate || ''}
              onChange={(e) => handleChange('expenseDate', e.target.value)}
              required
            />
            <Input
              label="Budget Category"
              value={formData.budgetCategory || ''}
              onChange={(e) => handleChange('budgetCategory', e.target.value)}
              placeholder="Budget line item"
            />
          </div>

          <div className="flex items-center gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCapex || false}
                onChange={(e) => handleChange('isCapex', e.target.checked)}
                className="w-4 h-4 text-accent-primary rounded"
              />
              <span className="text-sm text-content-primary">Capital Expenditure (CAPEX)</span>
            </label>
          </div>
        </Card>

        {/* Billing Period */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Billing Period (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Period Start"
              type="date"
              value={formData.periodStart || ''}
              onChange={(e) => handleChange('periodStart', e.target.value)}
            />
            <Input
              label="Period End"
              type="date"
              value={formData.periodEnd || ''}
              onChange={(e) => handleChange('periodEnd', e.target.value)}
            />
          </div>
        </Card>

        {/* Financial Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Financial Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Currency</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.currency || 'USD'}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
              </select>
            </div>
            <Input
              label="Amount (excl. tax) *"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="Tax Amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.taxAmount || ''}
              onChange={(e) => handleChange('taxAmount', parseFloat(e.target.value) || 0)}
            />
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Total Amount</label>
              <div className="px-3 py-2 border border-border-default rounded-lg bg-background-secondary text-content-primary font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: formData.currency || 'USD',
                }).format((formData.amount || 0) + (formData.taxAmount || 0))}
              </div>
            </div>
          </div>
        </Card>

        {/* Recurring Expense */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-content-primary">Recurring Expense</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring || false}
                onChange={(e) => handleChange('isRecurring', e.target.checked)}
                className="w-4 h-4 text-accent-primary rounded"
              />
              <span className="text-sm text-content-secondary">This is a recurring expense</span>
            </label>
          </div>
          {formData.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Frequency</label>
              <select
                className="w-full md:w-1/3 px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.recurringFrequency || ''}
                onChange={(e) => handleChange('recurringFrequency', e.target.value || undefined)}
              >
                <option value="">Select Frequency</option>
                {Object.values(PaymentFrequency).map(freq => (
                  <option key={freq} value={freq}>{freq.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}
        </Card>

        {/* Payment Status */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-content-primary">Payment Status</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaid || false}
                onChange={(e) => handleChange('isPaid', e.target.checked)}
                className="w-4 h-4 text-accent-primary rounded"
              />
              <span className="text-sm text-content-secondary">Already paid</span>
            </label>
          </div>
          {formData.isPaid && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Paid Date"
                type="date"
                value={formData.paidDate || ''}
                onChange={(e) => handleChange('paidDate', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Payment Method</label>
                <select
                  className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                  value={formData.paymentMethod || ''}
                  onChange={(e) => handleChange('paymentMethod', e.target.value || undefined)}
                >
                  <option value="">Select Method</option>
                  {Object.values(PaymentMethod).map(method => (
                    <option key={method} value={method}>{method.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Payment Reference"
                value={formData.paymentReference || ''}
                onChange={(e) => handleChange('paymentReference', e.target.value)}
                placeholder="Transaction reference"
              />
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Notes</h2>
          <textarea
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional notes about this expense..."
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Update Expense' : 'Create Expense'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/property-management/expenses')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ExpenseFormPage;
