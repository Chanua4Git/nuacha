import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, X, MessageCircle, RefreshCw, Clock } from 'lucide-react';
import { useSubscriptionPurchase } from '@/hooks/useSubscriptionPurchase';
import { CustomerNudgeModal } from './CustomerNudgeModal';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionOrder {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  plan_type: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  status: string;
  payment_confirmed: boolean;
  payment_confirmed_at: string | null;
  created_at: string;
}

export function SubscriptionOrdersTable() {
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SubscriptionOrder | null>(null);
  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
  
  const { confirmPayment, revokePayment } = useSubscriptionPurchase();
  const { toast } = useToast();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders((data as SubscriptionOrder[]) || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast({
        title: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmPayment = async (order: SubscriptionOrder) => {
    const success = await confirmPayment(order.id);
    if (success) {
      fetchOrders();
    }
  };

  const handleRevokePayment = async (order: SubscriptionOrder) => {
    const success = await revokePayment(order.id);
    if (success) {
      fetchOrders();
    }
  };

  const handleNudge = (order: SubscriptionOrder) => {
    setSelectedOrder(order);
    setNudgeModalOpen(true);
  };

  const getStatusBadge = (status: string, paymentConfirmed: boolean) => {
    if (paymentConfirmed) {
      return <Badge className="bg-green-500">Confirmed</Badge>;
    }
    switch (status) {
      case 'pending_payment':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
      case 'payment_confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'active':
        return <Badge className="bg-primary">Active</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = orders.filter(o => !o.payment_confirmed).length;
  const confirmedCount = orders.filter(o => o.payment_confirmed).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            <p className="text-sm text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              ${orders.filter(o => o.payment_confirmed).reduce((sum, o) => sum + o.amount, 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subscription Orders</CardTitle>
            <CardDescription>Manage bank transfer subscription orders</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Ref</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.order_reference}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                          {order.customer_phone && (
                            <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="capitalize">{order.plan_type}</div>
                          <div className="text-xs text-muted-foreground capitalize">{order.billing_cycle}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ${order.amount.toFixed(2)} {order.currency}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status, order.payment_confirmed)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(order.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.customer_phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNudge(order)}
                              title="Send WhatsApp message"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {!order.payment_confirmed ? (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmPayment(order)}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Confirm
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokePayment(order)}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nudge Modal */}
      {selectedOrder && (
        <CustomerNudgeModal
          open={nudgeModalOpen}
          onOpenChange={setNudgeModalOpen}
          customer={{
            name: selectedOrder.customer_name,
            phone: selectedOrder.customer_phone || '',
            email: selectedOrder.customer_email
          }}
          orderContext={{
            order_reference: selectedOrder.order_reference,
            plan_type: selectedOrder.plan_type,
            amount: selectedOrder.amount.toString(),
            payment_confirmed: selectedOrder.payment_confirmed
          }}
        />
      )}
    </div>
  );
}
