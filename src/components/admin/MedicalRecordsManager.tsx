import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Plus, Heart, AlertTriangle, Pill, Trash2, Save } from 'lucide-react';

interface PatientOption {
  email: string;
  name: string;
}

const MedicalRecordsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Medical record form
  const [record, setRecord] = useState({ blood_type: '', chronic_diseases: '', surgical_history: '', family_history: '', notes: '' });
  const [recordId, setRecordId] = useState<string | null>(null);

  // Allergies
  const [allergies, setAllergies] = useState<any[]>([]);
  const [allergyDialog, setAllergyDialog] = useState(false);
  const [newAllergy, setNewAllergy] = useState({ allergy_name: '', severity: 'mild', notes: '' });

  // Medications
  const [medications, setMedications] = useState<any[]>([]);
  const [medDialog, setMedDialog] = useState(false);
  const [newMed, setNewMed] = useState({ medication_name: '', dosage: '', frequency: '', notes: '' });

  const [isSaving, setIsSaving] = useState(false);

  // Fetch unique patients from appointments
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase.from('appointments').select('patient_email, patient_name');
      if (data) {
        const unique = new Map<string, string>();
        data.forEach(a => unique.set(a.patient_email, a.patient_name));
        setPatients(Array.from(unique.entries()).map(([email, name]) => ({ email, name })));
      }
    };
    fetchPatients();
  }, []);

  // Load patient data when selected
  useEffect(() => {
    if (!selectedPatientEmail) return;
    const load = async () => {
      setIsLoading(true);
      const [recRes, allRes, medRes] = await Promise.all([
        supabase.from('medical_records').select('*').eq('patient_email', selectedPatientEmail).maybeSingle(),
        supabase.from('patient_allergies').select('*').eq('patient_email', selectedPatientEmail),
        supabase.from('patient_medications').select('*').eq('patient_email', selectedPatientEmail),
      ]);
      if (recRes.data) {
        setRecordId(recRes.data.id);
        setRecord({
          blood_type: recRes.data.blood_type || '',
          chronic_diseases: recRes.data.chronic_diseases || '',
          surgical_history: recRes.data.surgical_history || '',
          family_history: recRes.data.family_history || '',
          notes: recRes.data.notes || '',
        });
      } else {
        setRecordId(null);
        setRecord({ blood_type: '', chronic_diseases: '', surgical_history: '', family_history: '', notes: '' });
      }
      setAllergies(allRes.data || []);
      setMedications(medRes.data || []);
      setIsLoading(false);
    };
    load();
  }, [selectedPatientEmail]);

  const selectedPatient = patients.find(p => p.email === selectedPatientEmail);
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveRecord = async () => {
    if (!selectedPatientEmail || !selectedPatient) return;
    setIsSaving(true);
    try {
      if (recordId) {
        await supabase.from('medical_records').update({ ...record, updated_at: new Date().toISOString() }).eq('id', recordId);
      } else {
        const { data } = await supabase.from('medical_records').insert({
          patient_email: selectedPatientEmail,
          patient_name: selectedPatient.name,
          ...record,
          created_by: user?.id,
        }).select().single();
        if (data) setRecordId(data.id);
      }
      toast({ title: 'تم الحفظ', description: 'تم حفظ السجل الطبي بنجاح' });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const addAllergy = async () => {
    if (!newAllergy.allergy_name || !selectedPatientEmail) return;
    try {
      const { data } = await supabase.from('patient_allergies').insert({
        patient_email: selectedPatientEmail,
        ...newAllergy,
        created_by: user?.id,
      }).select().single();
      if (data) setAllergies(prev => [...prev, data]);
      setNewAllergy({ allergy_name: '', severity: 'mild', notes: '' });
      setAllergyDialog(false);
      toast({ title: 'تمت الإضافة', description: 'تمت إضافة الحساسية' });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  };

  const deleteAllergy = async (id: string) => {
    await supabase.from('patient_allergies').delete().eq('id', id);
    setAllergies(prev => prev.filter(a => a.id !== id));
  };

  const addMedication = async () => {
    if (!newMed.medication_name || !selectedPatientEmail) return;
    try {
      const { data } = await supabase.from('patient_medications').insert({
        patient_email: selectedPatientEmail,
        ...newMed,
        is_current: true,
        created_by: user?.id,
      }).select().single();
      if (data) setMedications(prev => [...prev, data]);
      setNewMed({ medication_name: '', dosage: '', frequency: '', notes: '' });
      setMedDialog(false);
      toast({ title: 'تمت الإضافة', description: 'تمت إضافة الدواء' });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  };

  const deleteMedication = async (id: string) => {
    await supabase.from('patient_medications').delete().eq('id', id);
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            اختر المريض
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="ابحث بالاسم أو البريد..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {filteredPatients.map(p => (
              <Button
                key={p.email}
                variant={selectedPatientEmail === p.email ? 'default' : 'outline'}
                size="sm"
                className="justify-start text-xs truncate"
                onClick={() => setSelectedPatientEmail(p.email)}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPatientEmail && isLoading && (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      )}

      {selectedPatientEmail && !isLoading && (
        <>
          {/* Medical History Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                التاريخ المرضي - {selectedPatient?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>فصيلة الدم</Label>
                  <Select value={record.blood_type} onValueChange={v => setRecord(r => ({ ...r, blood_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الأمراض المزمنة</Label>
                  <Input value={record.chronic_diseases} onChange={e => setRecord(r => ({ ...r, chronic_diseases: e.target.value }))} placeholder="السكري، الضغط..." />
                </div>
                <div>
                  <Label>التاريخ الجراحي</Label>
                  <Input value={record.surgical_history} onChange={e => setRecord(r => ({ ...r, surgical_history: e.target.value }))} placeholder="العمليات السابقة" />
                </div>
                <div>
                  <Label>التاريخ العائلي</Label>
                  <Input value={record.family_history} onChange={e => setRecord(r => ({ ...r, family_history: e.target.value }))} placeholder="أمراض وراثية" />
                </div>
              </div>
              <div>
                <Label>ملاحظات إضافية</Label>
                <Textarea value={record.notes} onChange={e => setRecord(r => ({ ...r, notes: e.target.value }))} rows={3} />
              </div>
              <Button onClick={saveRecord} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                حفظ السجل الطبي
              </Button>
            </CardContent>
          </Card>

          {/* Allergies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                الحساسية ({allergies.length})
              </CardTitle>
              <Button size="sm" onClick={() => setAllergyDialog(true)}>
                <Plus className="h-4 w-4 ml-1" /> إضافة
              </Button>
            </CardHeader>
            <CardContent>
              {allergies.length > 0 ? (
                <div className="space-y-2">
                  {allergies.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.allergy_name}</span>
                        <Badge variant={a.severity === 'severe' ? 'destructive' : a.severity === 'moderate' ? 'default' : 'secondary'}>
                          {a.severity === 'severe' ? 'حاد' : a.severity === 'moderate' ? 'متوسط' : 'خفيف'}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteAllergy(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-3">لا توجد حساسية مسجلة</p>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                الأدوية الحالية ({medications.filter(m => m.is_current).length})
              </CardTitle>
              <Button size="sm" onClick={() => setMedDialog(true)}>
                <Plus className="h-4 w-4 ml-1" /> إضافة
              </Button>
            </CardHeader>
            <CardContent>
              {medications.length > 0 ? (
                <div className="space-y-2">
                  {medications.map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div>
                        <span className="font-semibold">{m.medication_name}</span>
                        <div className="text-sm text-muted-foreground">
                          {m.dosage && <span>الجرعة: {m.dosage} </span>}
                          {m.frequency && <span>| التكرار: {m.frequency}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteMedication(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-3">لا توجد أدوية مسجلة</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Allergy Dialog */}
      <Dialog open={allergyDialog} onOpenChange={setAllergyDialog}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة حساسية</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الحساسية</Label><Input value={newAllergy.allergy_name} onChange={e => setNewAllergy(a => ({ ...a, allergy_name: e.target.value }))} /></div>
            <div>
              <Label>الشدة</Label>
              <Select value={newAllergy.severity} onValueChange={v => setNewAllergy(a => ({ ...a, severity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">خفيف</SelectItem>
                  <SelectItem value="moderate">متوسط</SelectItem>
                  <SelectItem value="severe">حاد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>ملاحظات</Label><Input value={newAllergy.notes} onChange={e => setNewAllergy(a => ({ ...a, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={addAllergy}>إضافة</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medication Dialog */}
      <Dialog open={medDialog} onOpenChange={setMedDialog}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة دواء</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الدواء</Label><Input value={newMed.medication_name} onChange={e => setNewMed(m => ({ ...m, medication_name: e.target.value }))} /></div>
            <div><Label>الجرعة</Label><Input value={newMed.dosage} onChange={e => setNewMed(m => ({ ...m, dosage: e.target.value }))} /></div>
            <div><Label>التكرار</Label><Input value={newMed.frequency} onChange={e => setNewMed(m => ({ ...m, frequency: e.target.value }))} placeholder="مرتين يومياً" /></div>
            <div><Label>ملاحظات</Label><Input value={newMed.notes} onChange={e => setNewMed(m => ({ ...m, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={addMedication}>إضافة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalRecordsManager;
