import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Plus, Save, Sparkles, Trash2, CheckCircle, Clock, ClipboardList, DollarSign } from 'lucide-react';

interface TreatmentPlan {
  id: string;
  patient_email: string;
  patient_name: string;
  title: string;
  description: string | null;
  status: string;
  total_cost: number;
  created_at: string;
}

interface PlanItem {
  id: string;
  plan_id: string;
  tooth_number: number | null;
  procedure_name: string;
  description: string | null;
  cost: number;
  status: string;
  step_order: number;
  completed_at: string | null;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  planned: { label: 'مخطط', variant: 'outline' },
  in_progress: { label: 'قيد التنفيذ', variant: 'default' },
  completed: { label: 'مكتمل', variant: 'secondary' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
};

const ITEM_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'بانتظار', variant: 'outline' },
  in_progress: { label: 'جاري', variant: 'default' },
  completed: { label: 'مكتمل', variant: 'secondary' },
  skipped: { label: 'تم تخطيه', variant: 'destructive' },
};

const TreatmentPlansPage = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New plan
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [formData, setFormData] = useState({ patient_name: '', patient_email: '', title: '', description: '' });

  // New item
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ procedure_name: '', description: '', cost: '', tooth_number: '' });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/auth?role=doctor');
  }, [user, isAdmin, authLoading]);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('treatment_plans').select('*').order('created_at', { ascending: false });
    setPlans(data || []);
    setIsLoading(false);
  };

  const loadItems = async (planId: string) => {
    const { data } = await supabase.from('treatment_plan_items').select('*').eq('plan_id', planId).order('step_order');
    setItems(data || []);
  };

  const selectPlan = async (plan: TreatmentPlan) => {
    setSelectedPlan(plan);
    await loadItems(plan.id);
  };

  const createPlan = async () => {
    const { data, error } = await supabase.from('treatment_plans').insert({
      ...formData,
      created_by: user?.id,
    }).select().single();
    if (error) { toast({ title: 'خطأ', variant: 'destructive' }); return; }
    setNewPlanOpen(false);
    setFormData({ patient_name: '', patient_email: '', title: '', description: '' });
    fetchPlans();
    if (data) selectPlan(data);
    toast({ title: 'تم إنشاء خطة العلاج' });
  };

  const addItem = async () => {
    if (!selectedPlan) return;
    const { error } = await supabase.from('treatment_plan_items').insert({
      plan_id: selectedPlan.id,
      procedure_name: itemForm.procedure_name,
      description: itemForm.description || null,
      cost: parseFloat(itemForm.cost) || 0,
      tooth_number: itemForm.tooth_number ? parseInt(itemForm.tooth_number) : null,
      step_order: items.length + 1,
    });
    if (error) { toast({ title: 'خطأ', variant: 'destructive' }); return; }
    setNewItemOpen(false);
    setItemForm({ procedure_name: '', description: '', cost: '', tooth_number: '' });
    loadItems(selectedPlan.id);
    updatePlanTotal(selectedPlan.id);
    toast({ title: 'تمت إضافة الإجراء' });
  };

  const updateItemStatus = async (itemId: string, status: string) => {
    await supabase.from('treatment_plan_items').update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }).eq('id', itemId);
    if (selectedPlan) loadItems(selectedPlan.id);
  };

  const updatePlanTotal = async (planId: string) => {
    const { data } = await supabase.from('treatment_plan_items').select('cost').eq('plan_id', planId);
    const total = (data || []).reduce((sum, i) => sum + (Number(i.cost) || 0), 0);
    await supabase.from('treatment_plans').update({ total_cost: total }).eq('id', planId);
    fetchPlans();
  };

  const updatePlanStatus = async (planId: string, status: string) => {
    await supabase.from('treatment_plans').update({ status }).eq('id', planId);
    fetchPlans();
    if (selectedPlan?.id === planId) setSelectedPlan(prev => prev ? { ...prev, status } : null);
  };

  const deletePlan = async (id: string) => {
    await supabase.from('treatment_plans').delete().eq('id', id);
    if (selectedPlan?.id === id) { setSelectedPlan(null); setItems([]); }
    fetchPlans();
    toast({ title: 'تم حذف الخطة' });
  };

  const deleteItem = async (id: string) => {
    await supabase.from('treatment_plan_items').delete().eq('id', id);
    if (selectedPlan) { loadItems(selectedPlan.id); updatePlanTotal(selectedPlan.id); }
  };

  const completedItems = items.filter(i => i.status === 'completed').length;
  const progressPct = items.length > 0 ? (completedItems / items.length) * 100 : 0;
  const totalCost = items.reduce((s, i) => s + (Number(i.cost) || 0), 0);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background" dir="rtl">
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 hero-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
              <ClipboardList className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">خطط العلاج</h1>
              <p className="text-sm text-muted-foreground">إنشاء ومتابعة خطط العلاج للمرضى</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plans List */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">خطط العلاج</CardTitle>
                <Button size="sm" onClick={() => setNewPlanOpen(true)} className="rounded-xl"><Plus className="h-4 w-4 ml-1" /> جديد</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : plans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد خطط علاج</p>
              ) : plans.map(plan => (
                <div key={plan.id} onClick={() => selectPlan(plan)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{plan.title}</p>
                    <Badge variant={STATUS_MAP[plan.status]?.variant || 'outline'}>{STATUS_MAP[plan.status]?.label || plan.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.patient_name}</p>
                  <p className="text-xs font-mono text-primary mt-1">{Number(plan.total_cost).toFixed(2)} ر.س</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plan Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPlan ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg bg-card/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-xs text-muted-foreground">الإجراءات</p><p className="text-xl font-bold">{items.length}</p></div>
                    </div>
                  </Card>
                  <Card className="border-0 shadow-lg bg-card/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-emerald-500" /></div>
                      <div><p className="text-xs text-muted-foreground">المكتمل</p><p className="text-xl font-bold">{completedItems}/{items.length}</p></div>
                    </div>
                  </Card>
                  <Card className="border-0 shadow-lg bg-card/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-amber-500" /></div>
                      <div><p className="text-xs text-muted-foreground">التكلفة</p><p className="text-xl font-bold">{totalCost.toFixed(0)}</p></div>
                    </div>
                  </Card>
                </div>

                {/* Progress */}
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedPlan.title}</CardTitle>
                        <CardDescription>{selectedPlan.patient_name} - {selectedPlan.patient_email}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Select value={selectedPlan.status} onValueChange={v => updatePlanStatus(selectedPlan.id, v)}>
                          <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="destructive" size="icon" onClick={() => deletePlan(selectedPlan.id)} className="rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <Progress value={progressPct} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">{progressPct.toFixed(0)}% مكتمل</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">الإجراءات</h3>
                      <Button size="sm" onClick={() => setNewItemOpen(true)} className="rounded-xl"><Plus className="h-4 w-4 ml-1" /> إضافة</Button>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">لا توجد إجراءات بعد</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">#</TableHead>
                            <TableHead className="text-right">الإجراء</TableHead>
                            <TableHead className="text-right">السن</TableHead>
                            <TableHead className="text-right">التكلفة</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">إجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono">{item.step_order}</TableCell>
                              <TableCell>
                                <p className="font-medium text-sm">{item.procedure_name}</p>
                                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                              </TableCell>
                              <TableCell>{item.tooth_number || '-'}</TableCell>
                              <TableCell className="font-mono">{Number(item.cost).toFixed(0)}</TableCell>
                              <TableCell>
                                <Select value={item.status} onValueChange={v => updateItemStatus(item.id, v)}>
                                  <SelectTrigger className="w-[100px] h-7 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(ITEM_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-0 shadow-lg bg-card/80"><CardContent className="p-12 text-center text-muted-foreground">
                <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">اختر خطة علاج أو أنشئ خطة جديدة</p>
              </CardContent></Card>
            )}
          </div>
        </div>
      </main>

      {/* New Plan Dialog */}
      <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إنشاء خطة علاج جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>عنوان الخطة</Label><Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="مثال: علاج تسوس الأضراس" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>اسم المريض</Label><Input value={formData.patient_name} onChange={e => setFormData(p => ({ ...p, patient_name: e.target.value }))} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input value={formData.patient_email} onChange={e => setFormData(p => ({ ...p, patient_email: e.target.value }))} type="email" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>الوصف</Label><Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="rounded-xl" /></div>
          </div>
          <DialogFooter><Button onClick={createPlan} disabled={!formData.title || !formData.patient_name || !formData.patient_email} className="rounded-xl">إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Item Dialog */}
      <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة إجراء جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>اسم الإجراء</Label><Input value={itemForm.procedure_name} onChange={e => setItemForm(p => ({ ...p, procedure_name: e.target.value }))} placeholder="مثال: حشوة ضوئية" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>الوصف (اختياري)</Label><Textarea value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>رقم السن (اختياري)</Label><Input value={itemForm.tooth_number} onChange={e => setItemForm(p => ({ ...p, tooth_number: e.target.value }))} type="number" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>التكلفة</Label><Input value={itemForm.cost} onChange={e => setItemForm(p => ({ ...p, cost: e.target.value }))} type="number" className="rounded-xl" /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={addItem} disabled={!itemForm.procedure_name} className="rounded-xl">إضافة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreatmentPlansPage;
