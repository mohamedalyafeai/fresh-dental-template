import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Plus, Trash2, Printer, Receipt, DollarSign, FileText, CreditCard, Clock } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  patient_email: string;
  patient_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  tooth_number: number | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  unpaid: { label: 'غير مدفوع', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  partial: { label: 'مدفوع جزئياً', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  paid: { label: 'مدفوع', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'ملغي', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

const InvoicesPage = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invItems, setInvItems] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newInvOpen, setNewInvOpen] = useState(false);
  const [invForm, setInvForm] = useState({ patient_name: '', patient_email: '', discount: '0', tax: '0', notes: '' });

  const [newItemOpen, setNewItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ description: '', quantity: '1', unit_price: '', tooth_number: '' });

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/auth?role=doctor');
  }, [user, isAdmin, authLoading]);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    setInvoices(data || []);
    setIsLoading(false);
  };

  const loadItems = async (invoiceId: string) => {
    const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId);
    setInvItems(data || []);
  };

  const selectInvoice = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    await loadItems(inv.id);
  };

  const createInvoice = async () => {
    const { data, error } = await supabase.from('invoices').insert({
      patient_name: invForm.patient_name,
      patient_email: invForm.patient_email,
      discount: parseFloat(invForm.discount) || 0,
      tax: parseFloat(invForm.tax) || 0,
      notes: invForm.notes || null,
      invoice_number: '', // trigger will set this
      created_by: user?.id,
    }).select().single();
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setNewInvOpen(false);
    setInvForm({ patient_name: '', patient_email: '', discount: '0', tax: '0', notes: '' });
    fetchInvoices();
    if (data) selectInvoice(data);
    toast({ title: 'تم إنشاء الفاتورة' });

    if (data) {
      // Create in-app notification
      try {
        await supabase.from('patient_notifications').insert({
          patient_email: invForm.patient_email,
          title: 'فاتورة جديدة',
          message: `تم إنشاء فاتورة جديدة رقم ${data.invoice_number}`,
          type: 'invoice',
          related_id: data.id,
        });
      } catch (e) { console.error('Failed to create notification:', e); }

      // Send email notification
      try {
        await supabase.functions.invoke('send-patient-notification', {
          body: {
            type: 'invoice',
            patientName: invForm.patient_name,
            patientEmail: invForm.patient_email,
            data: { invoiceNumber: data.invoice_number, total: data.total, dueDate: null, items: [] },
          },
        });
      } catch (e) { console.error('Failed to send invoice notification:', e); }
    }
  };

  const addItem = async () => {
    if (!selectedInvoice) return;
    const qty = parseInt(itemForm.quantity) || 1;
    const price = parseFloat(itemForm.unit_price) || 0;
    const { error } = await supabase.from('invoice_items').insert({
      invoice_id: selectedInvoice.id,
      description: itemForm.description,
      quantity: qty,
      unit_price: price,
      total: qty * price,
      tooth_number: itemForm.tooth_number ? parseInt(itemForm.tooth_number) : null,
    });
    if (error) { toast({ title: 'خطأ', variant: 'destructive' }); return; }
    setNewItemOpen(false);
    setItemForm({ description: '', quantity: '1', unit_price: '', tooth_number: '' });
    await loadItems(selectedInvoice.id);
    await recalculate(selectedInvoice.id);
    toast({ title: 'تمت الإضافة' });
  };

  const recalculate = async (invoiceId: string) => {
    const { data: items } = await supabase.from('invoice_items').select('total').eq('invoice_id', invoiceId);
    const subtotal = (items || []).reduce((s, i) => s + Number(i.total), 0);
    const inv = invoices.find(i => i.id === invoiceId) || selectedInvoice;
    const discount = Number(inv?.discount) || 0;
    const tax = Number(inv?.tax) || 0;
    const total = subtotal - discount + tax;
    await supabase.from('invoices').update({ subtotal, total }).eq('id', invoiceId);
    fetchInvoices();
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice(prev => prev ? { ...prev, subtotal, total } : null);
    }
  };

  const recordPayment = async () => {
    if (!selectedInvoice) return;
    const amount = parseFloat(paymentAmount) || 0;
    const newPaid = Number(selectedInvoice.amount_paid) + amount;
    const status = newPaid >= Number(selectedInvoice.total) ? 'paid' : 'partial';
    await supabase.from('invoices').update({ amount_paid: newPaid, status }).eq('id', selectedInvoice.id);
    setPaymentOpen(false);
    setPaymentAmount('');
    fetchInvoices();
    setSelectedInvoice(prev => prev ? { ...prev, amount_paid: newPaid, status } : null);
    toast({ title: 'تم تسجيل الدفعة' });
  };

  const deleteInvoice = async (id: string) => {
    await supabase.from('invoices').delete().eq('id', id);
    if (selectedInvoice?.id === id) { setSelectedInvoice(null); setInvItems([]); }
    fetchInvoices();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('invoice_items').delete().eq('id', id);
    if (selectedInvoice) { loadItems(selectedInvoice.id); recalculate(selectedInvoice.id); }
  };

  const printInvoice = () => window.print();

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
  const totalPending = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + Number(i.total) - Number(i.amount_paid), 0);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background print:bg-white" dir="rtl">
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 hero-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25"><Receipt className="h-6 w-6 text-primary-foreground" /></div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">الفواتير</h1>
              <p className="text-sm text-muted-foreground">إدارة فواتير ومدفوعات المرضى</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Revenue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 print:hidden">
          <Card className="border-0 shadow-lg bg-card/80 p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-emerald-500" /></div><div><p className="text-xs text-muted-foreground">الإيرادات</p><p className="text-xl font-bold">{totalRevenue.toFixed(0)} ر.س</p></div></div></Card>
          <Card className="border-0 shadow-lg bg-card/80 p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-500" /></div><div><p className="text-xs text-muted-foreground">المعلّق</p><p className="text-xl font-bold">{totalPending.toFixed(0)} ر.س</p></div></div></Card>
          <Card className="border-0 shadow-lg bg-card/80 p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">الفواتير</p><p className="text-xl font-bold">{invoices.length}</p></div></div></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoices List */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm print:hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">الفواتير</CardTitle>
                <Button size="sm" onClick={() => setNewInvOpen(true)} className="rounded-xl"><Plus className="h-4 w-4 ml-1" /> جديد</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              : invoices.length === 0 ? <p className="text-center text-muted-foreground py-8">لا توجد فواتير</p>
              : invoices.map(inv => (
                <div key={inv.id} onClick={() => selectInvoice(inv)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedInvoice?.id === inv.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-sm font-bold">{inv.invoice_number}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[inv.status]?.color}`}>{STATUS_MAP[inv.status]?.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{inv.patient_name}</p>
                  <p className="text-sm font-bold text-primary mt-1">{Number(inv.total).toFixed(0)} ر.س</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Invoice Detail */}
          <div className="lg:col-span-2">
            {selectedInvoice ? (
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-mono">{selectedInvoice.invoice_number}</CardTitle>
                      <CardDescription>{selectedInvoice.patient_name} - {selectedInvoice.patient_email}</CardDescription>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="outline" size="sm" onClick={printInvoice} className="rounded-xl"><Printer className="h-4 w-4 ml-1" /> طباعة</Button>
                      <Button size="sm" onClick={() => setPaymentOpen(true)} className="rounded-xl"><CreditCard className="h-4 w-4 ml-1" /> تسجيل دفعة</Button>
                      <Button variant="destructive" size="icon" className="rounded-xl h-9 w-9" onClick={() => deleteInvoice(selectedInvoice.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="font-semibold">البنود</h3>
                    <Button size="sm" onClick={() => setNewItemOpen(true)} className="rounded-xl"><Plus className="h-4 w-4 ml-1" /> إضافة</Button>
                  </div>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">السن</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">السعر</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right print:hidden"></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {invItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.tooth_number || '-'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{Number(item.unit_price).toFixed(0)}</TableCell>
                          <TableCell className="font-bold">{Number(item.total).toFixed(0)}</TableCell>
                          <TableCell className="print:hidden"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2 max-w-xs mr-auto">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">المجموع الفرعي:</span><span>{Number(selectedInvoice.subtotal).toFixed(0)} ر.س</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">الخصم:</span><span className="text-red-500">-{Number(selectedInvoice.discount).toFixed(0)} ر.س</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">الضريبة:</span><span>+{Number(selectedInvoice.tax).toFixed(0)} ر.س</span></div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><span>الإجمالي:</span><span className="text-primary">{Number(selectedInvoice.total).toFixed(0)} ر.س</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">المدفوع:</span><span className="text-emerald-500">{Number(selectedInvoice.amount_paid).toFixed(0)} ر.س</span></div>
                    <div className="flex justify-between font-bold"><span>المتبقي:</span><span className="text-amber-500">{(Number(selectedInvoice.total) - Number(selectedInvoice.amount_paid)).toFixed(0)} ر.س</span></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-card/80"><CardContent className="p-12 text-center text-muted-foreground">
                <Receipt className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">اختر فاتورة أو أنشئ فاتورة جديدة</p>
              </CardContent></Card>
            )}
          </div>
        </div>
      </main>

      {/* Create Invoice Dialog */}
      <Dialog open={newInvOpen} onOpenChange={setNewInvOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إنشاء فاتورة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>اسم المريض</Label><Input value={invForm.patient_name} onChange={e => setInvForm(p => ({ ...p, patient_name: e.target.value }))} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input value={invForm.patient_email} onChange={e => setInvForm(p => ({ ...p, patient_email: e.target.value }))} type="email" className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>الخصم</Label><Input value={invForm.discount} onChange={e => setInvForm(p => ({ ...p, discount: e.target.value }))} type="number" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>الضريبة</Label><Input value={invForm.tax} onChange={e => setInvForm(p => ({ ...p, tax: e.target.value }))} type="number" className="rounded-xl" /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={createInvoice} disabled={!invForm.patient_name || !invForm.patient_email} className="rounded-xl">إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة بند</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>الوصف</Label><Input value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} placeholder="مثال: حشوة ضوئية" className="rounded-xl" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>السن</Label><Input value={itemForm.tooth_number} onChange={e => setItemForm(p => ({ ...p, tooth_number: e.target.value }))} type="number" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>الكمية</Label><Input value={itemForm.quantity} onChange={e => setItemForm(p => ({ ...p, quantity: e.target.value }))} type="number" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>السعر</Label><Input value={itemForm.unit_price} onChange={e => setItemForm(p => ({ ...p, unit_price: e.target.value }))} type="number" className="rounded-xl" /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={addItem} disabled={!itemForm.description || !itemForm.unit_price} className="rounded-xl">إضافة</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تسجيل دفعة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">المتبقي: <span className="font-bold text-foreground">{selectedInvoice ? (Number(selectedInvoice.total) - Number(selectedInvoice.amount_paid)).toFixed(0) : 0} ر.س</span></p>
            <div className="space-y-2"><Label>المبلغ</Label><Input value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" placeholder="أدخل المبلغ" className="rounded-xl" /></div>
          </div>
          <DialogFooter><Button onClick={recordPayment} disabled={!paymentAmount} className="rounded-xl">تسجيل</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
