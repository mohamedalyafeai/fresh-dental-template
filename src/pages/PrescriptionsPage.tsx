import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Plus, Trash2, Printer, Pill, FileText, Search } from 'lucide-react';

interface Prescription {
  id: string;
  patient_email: string;
  patient_name: string;
  diagnosis: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

const PrescriptionsPage = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [newRxOpen, setNewRxOpen] = useState(false);
  const [rxForm, setRxForm] = useState({ patient_name: '', patient_email: '', diagnosis: '', notes: '' });

  const [newMedOpen, setNewMedOpen] = useState(false);
  const [medForm, setMedForm] = useState({ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/auth?role=doctor');
  }, [user, isAdmin, authLoading]);

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('prescriptions').select('*').order('created_at', { ascending: false });
    setPrescriptions(data || []);
    setIsLoading(false);
  };

  const loadItems = async (rxId: string) => {
    const { data } = await supabase.from('prescription_items').select('*').eq('prescription_id', rxId);
    setItems(data || []);
  };

  const selectRx = async (rx: Prescription) => {
    setSelected(rx);
    await loadItems(rx.id);
  };

  const createRx = async () => {
    const { data, error } = await supabase.from('prescriptions').insert({
      ...rxForm,
      diagnosis: rxForm.diagnosis || null,
      notes: rxForm.notes || null,
      created_by: user?.id,
    }).select().single();
    if (error) { toast({ title: 'خطأ', variant: 'destructive' }); return; }
    setNewRxOpen(false);
    const savedForm = { ...rxForm };
    setRxForm({ patient_name: '', patient_email: '', diagnosis: '', notes: '' });
    fetchPrescriptions();
    if (data) selectRx(data);
    toast({ title: 'تم إنشاء الوصفة' });

    // Send email notification (will be sent again with medications when they're added)
    if (data) {
      try {
        await supabase.functions.invoke('send-patient-notification', {
          body: {
            type: 'prescription',
            patientName: savedForm.patient_name,
            patientEmail: savedForm.patient_email,
            data: {
              diagnosis: savedForm.diagnosis,
              medications: [],
            },
          },
        });
      } catch (e) { console.error('Failed to send prescription notification:', e); }
    }
  };

  const addMed = async () => {
    if (!selected) return;
    const { error } = await supabase.from('prescription_items').insert({
      prescription_id: selected.id,
      ...medForm,
      instructions: medForm.instructions || null,
    });
    if (error) { toast({ title: 'خطأ', variant: 'destructive' }); return; }
    setNewMedOpen(false);
    setMedForm({ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    loadItems(selected.id);
    toast({ title: 'تمت إضافة الدواء' });
  };

  const deleteRx = async (id: string) => {
    await supabase.from('prescriptions').delete().eq('id', id);
    if (selected?.id === id) { setSelected(null); setItems([]); }
    fetchPrescriptions();
  };

  const deleteMed = async (id: string) => {
    await supabase.from('prescription_items').delete().eq('id', id);
    if (selected) loadItems(selected.id);
  };

  const printRx = () => window.print();

  const filtered = prescriptions.filter(rx =>
    rx.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.patient_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background print:bg-white" dir="rtl">
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 hero-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25"><Pill className="h-6 w-6 text-primary-foreground" /></div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">الوصفات الطبية</h1>
              <p className="text-sm text-muted-foreground">إنشاء وإدارة الوصفات الطبية الرقمية</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm print:hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">الوصفات</CardTitle>
                <Button size="sm" onClick={() => setNewRxOpen(true)} className="rounded-xl"><Plus className="h-4 w-4 ml-1" /> جديد</Button>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 rounded-xl" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              : filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">لا توجد وصفات</p>
              : filtered.map(rx => (
                <div key={rx.id} onClick={() => selectRx(rx)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.id === rx.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{rx.patient_name}</p>
                    <Badge variant={rx.status === 'active' ? 'default' : 'secondary'}>{rx.status === 'active' ? 'فعّال' : 'منتهي'}</Badge>
                  </div>
                  {rx.diagnosis && <p className="text-xs text-muted-foreground">{rx.diagnosis}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(rx.created_at).toLocaleDateString('ar')}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>وصفة طبية - {selected.patient_name}</CardTitle>
                      <CardDescription>{selected.patient_email}</CardDescription>
                      {selected.diagnosis && <p className="text-sm mt-1"><span className="font-semibold">التشخيص:</span> {selected.diagnosis}</p>}
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="outline" size="sm" onClick={printRx} className="rounded-xl"><Printer className="h-4 w-4 ml-1" /> طباعة</Button>
                      <Button variant="destructive" size="icon" className="rounded-xl h-9 w-9" onClick={() => deleteRx(selected.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="font-semibold">الأدوية</h3>
                    <Button size="sm" onClick={() => setNewMedOpen(true)} className="rounded-xl"><Plus className="h-4 w-4 ml-1" /> إضافة دواء</Button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد أدوية مضافة</p>
                  ) : (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-right">الدواء</TableHead>
                        <TableHead className="text-right">الجرعة</TableHead>
                        <TableHead className="text-right">التكرار</TableHead>
                        <TableHead className="text-right">المدة</TableHead>
                        <TableHead className="text-right">تعليمات</TableHead>
                        <TableHead className="text-right print:hidden"></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {items.map(med => (
                          <TableRow key={med.id}>
                            <TableCell className="font-semibold"><div className="flex items-center gap-2"><Pill className="h-4 w-4 text-primary" />{med.medication_name}</div></TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>{med.frequency}</TableCell>
                            <TableCell>{med.duration}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{med.instructions || '-'}</TableCell>
                            <TableCell className="print:hidden"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMed(med.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {selected.notes && (
                    <div className="mt-4 p-3 rounded-xl bg-muted/50">
                      <p className="text-sm font-semibold mb-1">ملاحظات:</p>
                      <p className="text-sm text-muted-foreground">{selected.notes}</p>
                    </div>
                  )}

                  {/* Print footer */}
                  <div className="hidden print:block mt-8 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">تاريخ الإصدار: {new Date(selected.created_at).toLocaleDateString('ar')}</p>
                    <p className="text-xs text-muted-foreground mt-8">توقيع الطبيب: ________________</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-card/80"><CardContent className="p-12 text-center text-muted-foreground">
                <Pill className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">اختر وصفة أو أنشئ وصفة جديدة</p>
              </CardContent></Card>
            )}
          </div>
        </div>
      </main>

      {/* Create Rx Dialog */}
      <Dialog open={newRxOpen} onOpenChange={setNewRxOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إنشاء وصفة طبية جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>اسم المريض</Label><Input value={rxForm.patient_name} onChange={e => setRxForm(p => ({ ...p, patient_name: e.target.value }))} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input value={rxForm.patient_email} onChange={e => setRxForm(p => ({ ...p, patient_email: e.target.value }))} type="email" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>التشخيص</Label><Input value={rxForm.diagnosis} onChange={e => setRxForm(p => ({ ...p, diagnosis: e.target.value }))} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>ملاحظات</Label><Textarea value={rxForm.notes} onChange={e => setRxForm(p => ({ ...p, notes: e.target.value }))} className="rounded-xl" /></div>
          </div>
          <DialogFooter><Button onClick={createRx} disabled={!rxForm.patient_name || !rxForm.patient_email} className="rounded-xl">إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medication Dialog */}
      <Dialog open={newMedOpen} onOpenChange={setNewMedOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة دواء</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>اسم الدواء</Label><Input value={medForm.medication_name} onChange={e => setMedForm(p => ({ ...p, medication_name: e.target.value }))} placeholder="مثال: أموكسيسيلين" className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>الجرعة</Label><Input value={medForm.dosage} onChange={e => setMedForm(p => ({ ...p, dosage: e.target.value }))} placeholder="500mg" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>التكرار</Label><Input value={medForm.frequency} onChange={e => setMedForm(p => ({ ...p, frequency: e.target.value }))} placeholder="3 مرات يومياً" className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>المدة</Label><Input value={medForm.duration} onChange={e => setMedForm(p => ({ ...p, duration: e.target.value }))} placeholder="7 أيام" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>تعليمات</Label><Input value={medForm.instructions} onChange={e => setMedForm(p => ({ ...p, instructions: e.target.value }))} placeholder="بعد الأكل" className="rounded-xl" /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={addMed} disabled={!medForm.medication_name || !medForm.dosage || !medForm.frequency || !medForm.duration} className="rounded-xl">إضافة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrescriptionsPage;
