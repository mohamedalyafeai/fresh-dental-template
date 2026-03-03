import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Receipt } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  discount: number | null;
  tax: number | null;
  total: number;
  amount_paid: number | null;
  due_date: string | null;
  created_at: string;
  notes: string | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  tooth_number: number | null;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  unpaid: { label: 'غير مدفوعة', variant: 'destructive' },
  partial: { label: 'مدفوعة جزئياً', variant: 'outline' },
  paid: { label: 'مدفوعة', variant: 'secondary' },
  overdue: { label: 'متأخرة', variant: 'destructive' },
};

export const PatientInvoices = ({ userEmail }: { userEmail: string }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<Record<string, InvoiceItem[]>>({});
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [userEmail]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('patient_email', userEmail)
      .order('created_at', { ascending: false });
    setInvoices(data || []);
    setIsLoading(false);
  };

  const loadItems = async (invoiceId: string) => {
    if (invoiceItems[invoiceId]) {
      setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
      return;
    }
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);
    setInvoiceItems(prev => ({ ...prev, [invoiceId]: data || [] }));
    setExpandedInvoice(invoiceId);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد فواتير حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map(inv => {
        const st = statusMap[inv.status] || statusMap.unpaid;
        const items = invoiceItems[inv.id] || [];
        const isExpanded = expandedInvoice === inv.id;
        const remaining = inv.total - (inv.amount_paid || 0);

        return (
          <Card key={inv.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadItems(inv.id)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{inv.invoice_number}</CardTitle>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(inv.created_at), 'yyyy/MM/dd')}
                {inv.due_date && ` • تاريخ الاستحقاق: ${format(new Date(inv.due_date), 'yyyy/MM/dd')}`}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">الإجمالي</p>
                  <p className="font-semibold">{inv.total.toFixed(2)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">المدفوع</p>
                  <p className="font-semibold text-green-600">{(inv.amount_paid || 0).toFixed(2)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">المتبقي</p>
                  <p className="font-semibold text-destructive">{remaining.toFixed(2)}</p>
                </div>
              </div>

              {isExpanded && items.length > 0 && (
                <div className="space-y-1 mt-3 border-t pt-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                      <span>{item.description} {item.tooth_number ? `(سن ${item.tooth_number})` : ''}</span>
                      <span className="text-muted-foreground">{item.quantity} × {item.unit_price.toFixed(2)} = {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {inv.discount ? <div className="flex justify-between text-sm text-green-600"><span>خصم</span><span>-{inv.discount.toFixed(2)}</span></div> : null}
                  {inv.tax ? <div className="flex justify-between text-sm"><span>ضريبة</span><span>+{inv.tax.toFixed(2)}</span></div> : null}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
