import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ToothChart, TOOTH_CONDITIONS, ToothData } from '@/components/dental/ToothChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Search, Plus, Save, Sparkles, Trash2 } from 'lucide-react';

interface DentalChart {
  id: string;
  patient_email: string;
  patient_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const DentalChartPage = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [charts, setCharts] = useState<DentalChart[]>([]);
  const [selectedChart, setSelectedChart] = useState<DentalChart | null>(null);
  const [teeth, setTeeth] = useState<ToothData[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New chart dialog
  const [newChartOpen, setNewChartOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');

  // Tooth edit state
  const [editCondition, setEditCondition] = useState('healthy');
  const [editSurface, setEditSurface] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/auth?role=doctor');
  }, [user, isAdmin, authLoading]);

  useEffect(() => { fetchCharts(); }, []);

  const fetchCharts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('dental_charts')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error) setCharts(data || []);
    setIsLoading(false);
  };

  const loadChartTeeth = async (chartId: string) => {
    const { data } = await supabase
      .from('tooth_conditions')
      .select('*')
      .eq('chart_id', chartId);
    if (data) {
      setTeeth(data.map(t => ({
        number: t.tooth_number,
        condition: t.condition,
        surface: t.surface || undefined,
        notes: t.notes || undefined,
      })));
    }
  };

  const selectChart = async (chart: DentalChart) => {
    setSelectedChart(chart);
    setSelectedTooth(null);
    await loadChartTeeth(chart.id);
  };

  const createChart = async () => {
    if (!newPatientName || !newPatientEmail) return;
    const { data, error } = await supabase
      .from('dental_charts')
      .insert({ patient_name: newPatientName, patient_email: newPatientEmail, created_by: user?.id })
      .select()
      .single();
    if (error) {
      toast({ title: 'خطأ', description: 'فشل إنشاء المخطط', variant: 'destructive' });
      return;
    }
    setNewChartOpen(false);
    setNewPatientName('');
    setNewPatientEmail('');
    await fetchCharts();
    if (data) selectChart(data);
    toast({ title: 'تم بنجاح', description: 'تم إنشاء مخطط أسنان جديد' });
  };

  const handleToothClick = (num: number) => {
    setSelectedTooth(num);
    const existing = teeth.find(t => t.number === num);
    setEditCondition(existing?.condition || 'healthy');
    setEditSurface(existing?.surface || '');
    setEditNotes(existing?.notes || '');
  };

  const saveToothCondition = async () => {
    if (!selectedChart || selectedTooth === null) return;
    setIsSaving(true);

    // Check if condition already exists
    const { data: existing } = await supabase
      .from('tooth_conditions')
      .select('id')
      .eq('chart_id', selectedChart.id)
      .eq('tooth_number', selectedTooth)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('tooth_conditions')
        .update({ condition: editCondition, surface: editSurface || null, notes: editNotes || null })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('tooth_conditions')
        .insert({
          chart_id: selectedChart.id,
          tooth_number: selectedTooth,
          condition: editCondition,
          surface: editSurface || null,
          notes: editNotes || null,
        });
    }

    // Update local state
    setTeeth(prev => {
      const filtered = prev.filter(t => t.number !== selectedTooth);
      return [...filtered, { number: selectedTooth!, condition: editCondition, surface: editSurface, notes: editNotes }];
    });

    setIsSaving(false);
    toast({ title: 'تم الحفظ', description: `تم تحديث حالة السن ${selectedTooth}` });
  };

  const deleteChart = async (chartId: string) => {
    await supabase.from('dental_charts').delete().eq('id', chartId);
    if (selectedChart?.id === chartId) {
      setSelectedChart(null);
      setTeeth([]);
    }
    fetchCharts();
    toast({ title: 'تم الحذف', description: 'تم حذف المخطط' });
  };

  const filteredCharts = charts.filter(c =>
    c.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.patient_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background" dir="rtl">
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 hero-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">مخطط الأسنان</h1>
                <p className="text-sm text-muted-foreground">مخطط تفاعلي لتسجيل حالة أسنان المرضى</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts List */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">سجلات المرضى</CardTitle>
                <Button size="sm" onClick={() => setNewChartOpen(true)} className="rounded-xl">
                  <Plus className="h-4 w-4 ml-1" /> جديد
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو البريد..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-10 rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filteredCharts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد سجلات</p>
              ) : filteredCharts.map(chart => (
                <div
                  key={chart.id}
                  onClick={() => selectChart(chart)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedChart?.id === chart.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{chart.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{chart.patient_email}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); deleteChart(chart.id); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chart View */}
          <div className="lg:col-span-2 space-y-6">
            {selectedChart ? (
              <>
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>مخطط أسنان: {selectedChart.patient_name}</CardTitle>
                    <CardDescription>انقر على أي سن لتعديل حالته</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ToothChart
                      teeth={teeth}
                      onToothClick={handleToothClick}
                      selectedTooth={selectedTooth}
                    />
                  </CardContent>
                </Card>

                {/* Tooth Edit Panel */}
                {selectedTooth !== null && (
                  <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm border-r-4 border-r-primary">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Badge variant="outline" className="text-base">سن رقم {selectedTooth}</Badge>
                        تعديل حالة السن
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>الحالة</Label>
                        <Select value={editCondition} onValueChange={setEditCondition}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TOOTH_CONDITIONS.map(c => (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${c.color.replace('fill-', 'bg-')}`} />
                                  {c.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>السطح المصاب</Label>
                        <Input
                          value={editSurface}
                          onChange={e => setEditSurface(e.target.value)}
                          placeholder="مثال: الوجهي، اللساني، الطاحن..."
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ملاحظات</Label>
                        <Textarea
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          placeholder="ملاحظات إضافية..."
                          className="rounded-xl"
                        />
                      </div>
                      <Button onClick={saveToothCondition} disabled={isSaving} className="w-full rounded-xl">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                        حفظ التعديلات
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">اختر سجل مريض أو أنشئ سجلاً جديداً</p>
                  <p className="text-sm">لعرض مخطط الأسنان التفاعلي</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* New Chart Dialog */}
      <Dialog open={newChartOpen} onOpenChange={setNewChartOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء مخطط أسنان جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المريض</Label>
              <Input value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="أدخل اسم المريض" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={newPatientEmail} onChange={e => setNewPatientEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl" type="email" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createChart} disabled={!newPatientName || !newPatientEmail} className="rounded-xl">إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DentalChartPage;
