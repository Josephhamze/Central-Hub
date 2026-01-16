import { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  PropertyExpense,
  ExpenseCategory,
  PaymentMethod,
} from '@/services/property-management';

const formatCurrency = (value: number | undefined, currency = 'USD') => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getCategoryColor = (category: ExpenseCategory) => {
  const colors: Record<ExpenseCategory, string> = {
    [ExpenseCategory.MAINTENANCE]: 'bg-accent-primary/10 text-accent-primary',
    [ExpenseCategory.REPAIRS]: 'bg-status-warning/10 text-status-warning',
    [ExpenseCategory.MUNICIPAL_TAXES]: 'bg-status-error/10 text-status-error',
    [ExpenseCategory.INSURANCE]: 'bg-status-success/10 text-status-success',
    [ExpenseCategory.MANAGEMENT_FEE]: 'bg-accent-primary/10 text-accent-primary',
    [ExpenseCategory.LEGAL]: 'bg-content-tertiary/10 text-content-tertiary',
    [ExpenseCategory.MARKETING]: 'bg-status-warning/10 text-status-warning',
    [ExpenseCategory.CLEANING]: 'bg-status-success/10 text-status-success',
    [ExpenseCategory.LANDSCAPING]: 'bg-status-success/10 text-status-success',
    [ExpenseCategory.PEST_CONTROL]: 'bg-status-warning/10 text-status-warning',
    [ExpenseCategory.OTHER]: 'bg-content-tertiary/10 text-content-tertiary',
  };
  return colors[category] || colors[ExpenseCategory.OTHER];
};

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<PropertyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    category?: ExpenseCategory;
    isPaid?: boolean;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadExpenses();
  }, [pagination.page, filters]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await propertyManagementService.getExpenses({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        ...filters,
      });
      setExpenses(response?.items || []);
      setPagination(prev => ({
        ...prev,
        total: response?.pagination?.total ?? 0,
        totalPages: response?.pagination?.totalPages ?? 0,
      }));
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadExpenses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await propertyManagementService.deleteExpense(id);
      success('Expense deleted successfully');
      loadExpenses();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to delete expense');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await propertyManagementService.markExpenseAsPaid(id, PaymentMethod.BANK_TRANSFER);
      success('Expense marked as paid');
      loadExpenses();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Expenses</h1>
          <p className="text-content-secondary">Track property expenses and costs</p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/property-management/expenses/new'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button variant="secondary" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {Object.keys(filters).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-accent-primary text-white rounded-full text-xs">
                {Object.keys(filters).length}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border-default grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  category: e.target.value as ExpenseCategory || undefined,
                }))}
              >
                <option value="">All Categories</option>
                {Object.values(ExpenseCategory).map(category => (
                  <option key={category} value={category}>{category.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Payment Status</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.isPaid === undefined ? '' : filters.isPaid.toString()}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  isPaid: e.target.value === '' ? undefined : e.target.value === 'true',
                }))}
              >
                <option value="">All</option>
                <option value="true">Paid</option>
                <option value="false">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.isRecurring === undefined ? '' : filters.isRecurring.toString()}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  isRecurring: e.target.value === '' ? undefined : e.target.value === 'true',
                }))}
              >
                <option value="">All</option>
                <option value="false">One-time</option>
                <option value="true">Recurring</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">From Date</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  startDate: e.target.value || undefined,
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">To Date</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  endDate: e.target.value || undefined,
                }))}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Expenses List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : expenses.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
          <h3 className="text-lg font-medium text-content-primary mb-2">No expenses found</h3>
          <p className="text-content-secondary mb-4">Start tracking your property expenses</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/property-management/expenses/new'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <Card key={expense.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-status-error/10 rounded-lg">
                      <Receipt className="w-5 h-5 text-status-error" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-content-tertiary">{expense.expenseCode}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(expense.category)}`}>
                          {expense.category.replace('_', ' ')}
                        </span>
                        {expense.isPaid ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-status-success/10 text-status-success">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs bg-status-warning/10 text-status-warning">
                            Unpaid
                          </span>
                        )}
                        {expense.isRecurring && (
                          <span className="px-2 py-0.5 rounded text-xs bg-accent-primary/10 text-accent-primary">
                            Recurring
                          </span>
                        )}
                        {expense.isCapex && (
                          <span className="px-2 py-0.5 rounded text-xs bg-content-tertiary/10 text-content-tertiary">
                            CAPEX
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-content-primary mb-1">{expense.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <Building2 className="w-4 h-4" />
                          {expense.property?.name || 'Unknown Property'}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <Calendar className="w-4 h-4" />
                          {formatDate(expense.expenseDate)}
                        </div>
                        {expense.vendor && (
                          <span className="text-sm text-content-secondary">
                            Vendor: {expense.vendor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-content-tertiary">Total Amount</p>
                      <p className="text-xl font-semibold text-status-error">
                        {formatCurrency(expense.totalAmount, expense.currency)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!expense.isPaid && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMarkAsPaid(expense.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1 text-status-success" />
                          Mark Paid
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.href = `/property-management/expenses/${expense.id}/edit`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="w-4 h-4 text-status-error" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-content-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} expenses
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-content-primary">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ExpensesPage;
