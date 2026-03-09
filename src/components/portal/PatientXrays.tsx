import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Image, Eye } from 'lucide-react';

interface XrayImage {
  id: string;
  image_url: string;
  description: string | null;
  tooth_number: number | null;
  taken_date: string;
}

export const PatientXrays = ({ userEmail }: { userEmail: string }) => {
  const [images, setImages] = useState<XrayImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('xray_images')
        .select('*')
        .eq('patient_email', userEmail)
        .order('taken_date', { ascending: false });
      setImages(data || []);
      setIsLoading(false);
    };
    fetch();
  }, [userEmail]);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5 text-primary" />صور الأشعة</CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد صور أشعة مسجلة</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map(img => (
                <div key={img.id} className="border rounded-lg overflow-hidden cursor-pointer group" onClick={() => setPreviewUrl(img.image_url)}>
                  <div className="aspect-video bg-muted relative">
                    <img src={img.image_url} alt="X-Ray" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    {img.tooth_number && <p className="text-sm font-medium">سن رقم: {img.tooth_number}</p>}
                    {img.description && <p className="text-sm text-muted-foreground">{img.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{img.taken_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>صورة الأشعة</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="X-Ray" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
};
