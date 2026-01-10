import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, MapPin, Truck, Building2, User, Calendar } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card, CardHeader } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { routesApi, type RouteRequest, type RouteRequestStatus } from '@services/logistics/routes';

export function RouteRequestsPage() {
  const { success, error: showError } = useToast();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<RouteRequestStatus | undefined>(undefined);
  const [selectedRequest, setSelectedRequest] = useState<RouteRequest | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['route-requests', statusFilter],
    queryFn: async () => {
      const res = await routesApi.findAllRequests({ status: statusFilter, page: 1, limit: 100 });
      return res.data.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: RouteRequestStatus; reason?: string }) =>
      routesApi.reviewRequest(id, { status, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-requests'] });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      success(`Route request ${reviewAction === 'APPROVE' ? 'approved' : 'rejected'} successfully`);
      setReviewModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to review route request');
    },
  });

  const handleReview = (request: RouteRequest, action: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setRejectionReason('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedRequest) return;
    
    if (reviewAction === 'REJECT' && !rejectionReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    reviewMutation.mutate({
      id: selectedRequest.id,
      status: reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reason: reviewAction === 'REJECT' ? rejectionReason : undefined,
    });
  };

  const getStatusBadge = (status: RouteRequestStatus) => {
    const variants: Record<RouteRequestStatus, 'default' | 'success' | 'warning' | 'error'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
    };
    const labels: Record<RouteRequestStatus, string> = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (!hasPermission('logistics:routes:manage')) {
    return (
      <PageContainer title="Route Requests">
        <Card className="p-6">
          <p className="text-content-secondary">You do not have permission to view route requests.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Route Requests" description="Review and approve route creation requests">
      <Card className="mb-6">
        <CardHeader 
          title="Route Requests" 
          action={
            <div className="relative">
              <select
                className="px-4 py-2 pr-10 text-sm font-medium rounded-lg border border-border-default bg-background-primary text-content-primary hover:bg-background-hover focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors cursor-pointer appearance-none"
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value as RouteRequestStatus || undefined)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          }
        />
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-content-secondary">Loading...</div>
          ) : (
            <div className="space-y-4">
              {data?.items.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-background-hover transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <MapPin className="w-5 h-5 text-content-primary" />
                        <span className="font-semibold text-content-primary">
                          {request.fromCity} → {request.toCity}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-content-tertiary" />
                          <span className="text-content-secondary">Distance:</span>
                          <span className="text-content-primary font-medium">{Number(request.distanceKm).toFixed(2)} km</span>
                        </div>
                        {request.timeHours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-content-tertiary" />
                            <span className="text-content-secondary">Time:</span>
                            <span className="text-content-primary font-medium">{Number(request.timeHours).toFixed(1)}h</span>
                          </div>
                        )}
                        {request.warehouse && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-content-tertiary" />
                            <span className="text-content-secondary">Warehouse:</span>
                            <span className="text-content-primary font-medium">{request.warehouse.name}</span>
                          </div>
                        )}
                        {request.requestedBy && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-content-tertiary" />
                            <span className="text-content-secondary">Requested by:</span>
                            <span className="text-content-primary font-medium">{request.requestedBy.firstName} {request.requestedBy.lastName}</span>
                          </div>
                        )}
                      </div>

                      {request.notes && (
                        <div className="mb-3">
                          <p className="text-sm text-content-secondary">
                            <strong>Notes:</strong> {request.notes}
                          </p>
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="mb-3 p-2 bg-status-error-bg rounded">
                          <p className="text-sm text-status-error">
                            <strong>Rejection Reason:</strong> {request.rejectionReason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-content-tertiary">
                        <Calendar className="w-3 h-3" />
                        <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.reviewedAt && (
                          <>
                            <span>•</span>
                            <span>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</span>
                            {request.reviewedBy && (
                              <>
                                <span>•</span>
                                <span>By: {request.reviewedBy.firstName} {request.reviewedBy.lastName}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleReview(request, 'APPROVE')}
                          leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReview(request, 'REJECT')}
                          leftIcon={<XCircle className="w-4 h-4" />}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {data?.items.length === 0 && (
                <div className="text-center py-8 text-content-secondary">
                  No route requests found
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title={reviewAction === 'APPROVE' ? 'Approve Route Request' : 'Reject Route Request'}
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-3 bg-background-hover rounded-lg">
              <p className="text-sm font-medium text-content-primary mb-2">Route Details:</p>
              <p className="text-sm text-content-secondary">
                <strong>From:</strong> {selectedRequest.fromCity}
              </p>
              <p className="text-sm text-content-secondary">
                <strong>To:</strong> {selectedRequest.toCity}
              </p>
              <p className="text-sm text-content-secondary">
                <strong>Distance:</strong> {Number(selectedRequest.distanceKm).toFixed(2)} km
              </p>
              {selectedRequest.timeHours && (
                <p className="text-sm text-content-secondary">
                  <strong>Time:</strong> {Number(selectedRequest.timeHours).toFixed(1)} hours
                </p>
              )}
            </div>

            {reviewAction === 'APPROVE' ? (
              <p className="text-sm text-content-secondary">
                This will create a new active route. Toll stations and cost per km can be configured later.
              </p>
            ) : (
              <Input
                label="Rejection Reason *"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection"
                required
              />
            )}
          </div>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setReviewModalOpen(false);
              setSelectedRequest(null);
              setRejectionReason('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant={reviewAction === 'APPROVE' ? 'primary' : 'danger'}
            onClick={handleSubmitReview}
            disabled={reviewMutation.isPending}
          >
            {reviewAction === 'APPROVE' ? 'Approve' : 'Reject'}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
