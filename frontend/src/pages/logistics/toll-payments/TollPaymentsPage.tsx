import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { tollPaymentsApi, type TollPayment, type TollPaymentStatus, type VehicleType } from '@services/logistics/toll-payments';
import { routesApi } from '@services/logistics/routes';
import { tollStationsApi } from '@services/logistics/toll-stations';
import { cn } from '@utils/cn';

export function TollPaymentsPage() {
  const { error: showError } = useToast();
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    routeId?: string;
    tollStationId?: string;
    vehicleType?: VehicleType;
    status?: TollPaymentStatus;
  }>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['toll-payments', filters],
    queryFn: async () => {
      const res = await tollPaymentsApi.findAll(1, 100, filters);
      return res.data.data;
    },
  });

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await routesApi.findAll(1, 100);
      return res.data.data;
    },
    enabled: !!filters.routeId || reconcileModalOpen,
  });

  const { data: stations } = useQuery({
    queryKey: ['toll-stations'],
    queryFn: async () => {
      const res = await tollStationsApi.findAll(1, 100);
      return res.data.data;
    },
    enabled: !!filters.tollStationId,
  });

  const reconcileMutation = useMutation({
    mutationFn: (data: { startDate: string; endDate: string; routeId?: string; vehicleType?: VehicleType }) =>
      tollPaymentsApi.reconcile(data),
    onSuccess: (data) => {
      setReconcileResult(data.data.data);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to reconcile'),
  });

  const canCreate = hasPermission('logistics:toll_payments:create');
  const canApprove = hasPermission('logistics:toll_payments:approve');
  const canPost = hasPermission('logistics:toll_payments:post');

  const statusColors: Record<TollPaymentStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    DRAFT: 'default',
    SUBMITTED: 'warning',
    APPROVED: 'default',
    POSTED: 'success',
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Toll Payments</h1>
            <p className="text-content-secondary mt-1">Record and reconcile actual toll payments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setReconcileModalOpen(true)} leftIcon={<TrendingUp />}>
              Reconcile
            </Button>
            {canCreate && (
              <Button onClick={() => setCreateModalOpen(true)} leftIcon={<Plus />}>
                New Payment
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
            />
            <Input
              label="End Date"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
            />
            <select
              value={filters.vehicleType || ''}
              onChange={(e) => setFilters({ ...filters, vehicleType: (e.target.value || undefined) as VehicleType | undefined })}
              className="px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
            >
              <option value="">All Vehicles</option>
              <option value="FLATBED">Flatbed</option>
              <option value="TIPPER">Tipper</option>
            </select>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as TollPaymentStatus | undefined })}
              className="px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="POSTED">Posted</option>
            </select>
            <Button variant="secondary" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Payments Table */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-content-secondary">Loading payments...</p>
          </Card>
        ) : data?.items.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-border-default">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
            <p className="text-lg font-semibold text-content-primary mb-2">No payments found</p>
            <p className="text-content-secondary mb-4">Record your first toll payment to get started</p>
            {canCreate && (
              <Button onClick={() => setCreateModalOpen(true)} leftIcon={<Plus />}>
                Record Payment
              </Button>
            )}
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-secondary border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Vehicle</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Route/Station</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Paid By</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {data?.items.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      canApprove={canApprove}
                      canPost={canPost}
                      statusColors={statusColors}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create Payment Modal */}
      {canCreate && (
        <PaymentModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          routes={routes?.items || []}
          stations={stations?.items || []}
        />
      )}

      {/* Reconcile Modal */}
      <ReconcileModal
        isOpen={reconcileModalOpen}
        onClose={() => {
          setReconcileModalOpen(false);
          setReconcileResult(null);
        }}
        onReconcile={(data) => reconcileMutation.mutate(data)}
        result={reconcileResult}
        routes={routes?.items || []}
      />
    </PageContainer>
  );
}

function PaymentRow({
  payment,
  canApprove,
  canPost,
  statusColors,
}: {
  payment: TollPayment;
  canApprove: boolean;
  canPost: boolean;
  statusColors: Record<TollPaymentStatus, 'default' | 'success' | 'warning' | 'secondary'>;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: () => tollPaymentsApi.submit(payment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-payments'] });
      success('Payment submitted');
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to submit'),
  });

  const approveMutation = useMutation({
    mutationFn: () => tollPaymentsApi.approve(payment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-payments'] });
      success('Payment approved');
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to approve'),
  });

  const postMutation = useMutation({
    mutationFn: () => tollPaymentsApi.post(payment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-payments'] });
      success('Payment posted');
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to post'),
  });

  return (
    <tr className="hover:bg-background-secondary transition-colors">
      <td className="px-4 py-3 text-content-primary">
        {new Date(payment.paidAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <Badge variant="default">{payment.vehicleType}</Badge>
      </td>
      <td className="px-4 py-3 text-content-primary">
        {payment.route ? (
          <div className="text-sm">
            {payment.route.fromCity} → {payment.route.toCity}
          </div>
        ) : payment.tollStation ? (
          <div className="text-sm">{payment.tollStation.name}</div>
        ) : (
          <span className="text-content-tertiary">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-content-primary font-medium">
        {payment.amount.toFixed(2)} {payment.currency}
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusColors[payment.status]}>{payment.status}</Badge>
      </td>
      <td className="px-4 py-3 text-content-primary text-sm">
        {payment.paidBy ? `${payment.paidBy.firstName} ${payment.paidBy.lastName}` : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {payment.status === 'DRAFT' && (
            <Button variant="ghost" size="sm" onClick={() => submitMutation.mutate()} isLoading={submitMutation.isPending}>
              Submit
            </Button>
          )}
          {payment.status === 'SUBMITTED' && canApprove && (
            <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate()} isLoading={approveMutation.isPending}>
              Approve
            </Button>
          )}
          {(payment.status === 'APPROVED' || payment.status === 'DRAFT') && canPost && (
            <Button variant="ghost" size="sm" onClick={() => postMutation.mutate()} isLoading={postMutation.isPending}>
              Post
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function PaymentModal({
  isOpen,
  onClose,
  routes,
  stations,
}: {
  isOpen: boolean;
  onClose: () => void;
  routes: any[];
  stations: any[];
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    paidAt: new Date().toISOString().split('T')[0],
    vehicleType: 'FLATBED' as VehicleType,
    routeId: '',
    tollStationId: '',
    amount: 0,
    currency: 'USD',
    receiptRef: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: () => tollPaymentsApi.create({ ...formData, paidAt: `${formData.paidAt}T00:00:00` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-payments'] });
      success('Toll payment recorded');
      onClose();
      setFormData({
        paidAt: new Date().toISOString().split('T')[0],
        vehicleType: 'FLATBED',
        routeId: '',
        tollStationId: '',
        amount: 0,
        currency: 'USD',
        receiptRef: '',
        notes: '',
      });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create payment'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Toll Payment">
      <div className="space-y-4">
        <Input
          label="Payment Date *"
          type="date"
          value={formData.paidAt}
          onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium mb-1 text-content-primary">Vehicle Type *</label>
          <select
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleType })}
            className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
          >
            <option value="FLATBED">Flatbed</option>
            <option value="TIPPER">Tipper</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-content-primary">Route (optional)</label>
          <select
            value={formData.routeId}
            onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
          >
            <option value="">Select route...</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.fromCity} → {route.toCity}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-content-primary">Toll Station (optional)</label>
          <select
            value={formData.tollStationId}
            onChange={(e) => setFormData({ ...formData, tollStationId: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
          >
            <option value="">Select station...</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name} {station.cityOrArea ? `(${station.cityOrArea})` : ''}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Amount *"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          required
        />
        <Input
          label="Currency"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
        />
        <Input
          label="Receipt Reference"
          value={formData.receiptRef}
          onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium mb-1 text-content-primary">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
            rows={3}
          />
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => createMutation.mutate()} isLoading={createMutation.isPending}>
          Record Payment
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function ReconcileModal({
  isOpen,
  onClose,
  onReconcile,
  result,
  routes,
}: {
  isOpen: boolean;
  onClose: () => void;
  onReconcile: (data: any) => void;
  result: any;
  routes: any[];
}) {
  const [formData, setFormData] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    routeId: '',
    vehicleType: '' as VehicleType | '',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reconcile Toll Payments" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date *"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <Input
            label="End Date *"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-content-primary">Route (optional)</label>
          <select
            value={formData.routeId}
            onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
          >
            <option value="">All Routes</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.fromCity} → {route.toCity}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-content-primary">Vehicle Type (optional)</label>
          <select
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleType | '' })}
            className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
          >
            <option value="">All Vehicles</option>
            <option value="FLATBED">Flatbed</option>
            <option value="TIPPER">Tipper</option>
          </select>
        </div>

        {result && (
          <Card className="p-4 bg-status-info-bg">
            <h3 className="font-semibold text-content-primary mb-3">Reconciliation Results</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-content-secondary">Expected Total:</span>
                <span className="font-medium text-content-primary">{parseFloat(result.expectedTollsTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-secondary">Actual Total:</span>
                <span className="font-medium text-content-primary">{parseFloat(result.actualTollsTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border-default pt-2">
                <span className="text-content-secondary">Variance:</span>
                <span
                  className={cn(
                    'font-medium',
                    parseFloat(result.variance) >= 0 ? 'text-status-success' : 'text-status-error',
                  )}
                >
                  {parseFloat(result.variance) >= 0 ? '+' : ''}
                  {parseFloat(result.variance).toFixed(2)}
                </span>
              </div>
              {result.byStation && result.byStation.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-content-primary mb-2">By Station:</h4>
                  <div className="space-y-1">
                    {result.byStation.map((station: any) => (
                      <div key={station.stationId} className="flex justify-between text-sm">
                        <span className="text-content-secondary">{station.stationName}:</span>
                        <span className={cn(parseFloat(station.variance) >= 0 ? 'text-status-success' : 'text-status-error')}>
                          {parseFloat(station.variance) >= 0 ? '+' : ''}
                          {parseFloat(station.variance).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() =>
            onReconcile({
              startDate: `${formData.startDate}T00:00:00`,
              endDate: `${formData.endDate}T23:59:59`,
              routeId: formData.routeId || undefined,
              vehicleType: formData.vehicleType || undefined,
            })
          }
        >
          Reconcile
        </Button>
      </ModalFooter>
    </Modal>
  );
}
