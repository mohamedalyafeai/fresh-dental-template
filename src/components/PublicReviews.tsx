import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Loader2, Sparkles, Quote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Review {
  id: string;
  patient_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const PublicReviews = () => {
  const { isRTL } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('patient_reviews')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      const reviews = data || [];
      setReviews(reviews);
      if (reviews.length > 0) {
        setAvgRating(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
      }
      setIsLoading(false);
    };
    fetch();
  }, []);

  if (isLoading) return null;
  if (reviews.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            تقييمات حقيقية من مرضانا
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ماذا يقول <span className="text-gradient">مرضانا</span>
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-5 w-5 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
              ))}
            </div>
            <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length} تقييم)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map(review => (
            <Card key={review.id} className="bg-card/80 backdrop-blur border-border/50">
              <CardContent className="p-6">
                <Quote className="h-6 w-6 text-primary/30 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                {review.comment && <p className="text-sm text-foreground mb-4 leading-relaxed">{review.comment}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {review.patient_name.charAt(0)}
                    </div>
                    <span className="font-medium text-sm">{review.patient_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicReviews;
