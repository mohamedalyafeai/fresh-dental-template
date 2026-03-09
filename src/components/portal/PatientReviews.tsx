import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Review {
  id: string;
  patient_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const PatientReviews = ({ userEmail, userName }: { userEmail: string; userName?: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => { fetchReviews(); }, [userEmail]);

  const fetchReviews = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('patient_reviews')
      .select('*')
      .eq('patient_email', userEmail)
      .order('created_at', { ascending: false });
    setReviews(data || []);
    setIsLoading(false);
  };

  const submitReview = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('patient_reviews').insert({
      patient_email: userEmail,
      patient_name: userName || user.email || 'مريض',
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إرسال التقييم', variant: 'destructive' });
    } else {
      toast({ title: 'شكراً!', description: 'تم إرسال تقييمك بنجاح' });
      setComment('');
      setRating(5);
      fetchReviews();
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Submit Review */}
      <Card>
        <CardHeader><CardTitle>أضف تقييمك</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>التقييم</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star className={`h-8 w-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground'
                  }`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>تعليقك (اختياري)</Label>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="شاركنا تجربتك..." />
          </div>
          <Button onClick={submitReview} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
            إرسال التقييم
          </Button>
        </CardContent>
      </Card>

      {/* Previous Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle>تقييماتك السابقة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  ))}
                  <span className="text-sm text-muted-foreground mr-2">
                    {format(new Date(review.created_at), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </div>
                {review.comment && <p className="text-sm">{review.comment}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
