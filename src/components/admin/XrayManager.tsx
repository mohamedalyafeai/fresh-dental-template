import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Image, Search, Eye } from 'lucide-react';

interface XrayImage {
  id: string;
  patient_email: string;
  patient_name: string;
  image_url: string;
  description: string | null;
  tooth_number: number | null;
  taken_date: string;
  created_at: string;
}

const XrayManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<XrayImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    patient_email: '', patient_name: '', description: '', tooth_number: '', taken_date: new Date().toISOString().split('T')[0]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('xray_images').select('*').order('created_at', { ascending: false });
    if (!error) setImages(data || []);
    setIsLoading(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.patient_email || !formData.patient_name) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة واختيار صورة', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${formData.patient_email}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('xray-images').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('xray-images').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('xray_images').insert({
        patient_email: formData.patient_email,
        patient_name: formData.patient_name,
        image_url: urlData.publicUrl,
        description: formData.description || null,
        tooth_number: formData.tooth_number ? parseInt(formData.tooth_number) : null,
        taken_date: formData.taken_date,
        uploaded_by: user?.id,
      });
      if (insertError) throw insertError;

      toast({ title: 'تم الرفع', description: 'تم رفع صورة الأشعة بنجاح' });
      setDialogOpen(false);
      setSelectedFile(null);
      setFormData({ patient_email: '', patient_name: '', description: '', tooth_number: '', taken_date: new Date().toISOString().split('T')[0] });
      fetchImages();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'خطأ', description: error.message || 'فشل في رفع الصورة', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('xray_images').delete().eq('id', id);
    if (!error) { toast({ title: 'تم الحذف' }); fetchImages(); }
  };

  const filtered = images.filter(img =>
    img.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.patient_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5 text-primary" />صور الأشعة السينية</CardTitle>
              <CardDescription>{images.length} صورة أشعة</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 ml-2" />رفع صورة أشعة</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو البريد..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(img => (
              <Card key={img.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative cursor-pointer" onClick={() => setPreviewUrl(img.image_url)}>
                  <img src={img.image_url} alt={img.description || 'X-Ray'} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="font-semibold">{img.patient_name}</p>
                  <p className="text-sm text-muted-foreground">{img.patient_email}</p>
                  {img.tooth_number && <p className="text-sm">سن رقم: {img.tooth_number}</p>}
                  {img.description && <p className="text-sm text-muted-foreground mt-1">{img.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{img.taken_date}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(img.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">لا توجد صور أشعة</p>}
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>رفع صورة أشعة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم المريض *</Label><Input value={formData.patient_name} onChange={e => setFormData(f => ({ ...f, patient_name: e.target.value }))} /></div>
            <div><Label>البريد الإلكتروني *</Label><Input type="email" value={formData.patient_email} onChange={e => setFormData(f => ({ ...f, patient_email: e.target.value }))} /></div>
            <div><Label>صورة الأشعة *</Label><Input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رقم السن</Label><Input type="number" value={formData.tooth_number} onChange={e => setFormData(f => ({ ...f, tooth_number: e.target.value }))} /></div>
              <div><Label>تاريخ التصوير</Label><Input type="date" value={formData.taken_date} onChange={e => setFormData(f => ({ ...f, taken_date: e.target.value }))} /></div>
            </div>
            <div><Label>وصف</Label><Textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}رفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>عرض صورة الأشعة</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="X-Ray Preview" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default XrayManager;
