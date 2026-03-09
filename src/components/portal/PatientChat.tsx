import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  patient_email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const PatientChat = ({ userEmail, userName }: { userEmail: string; userName?: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime messages
    const channel = supabase
      .channel('patient-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `patient_email=eq.${userEmail}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        // Mark as read if from admin
        if (newMsg.sender_role !== 'patient') {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', newMsg.id).then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('patient_email', userEmail)
      .order('created_at', { ascending: true });
    
    if (!error) {
      setMessages(data || []);
      // Mark unread messages as read
      const unread = (data || []).filter(m => !m.is_read && m.sender_role !== 'patient');
      if (unread.length > 0) {
        await supabase.from('chat_messages').update({ is_read: true }).in('id', unread.map(m => m.id));
      }
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setIsSending(true);
    
    const { error } = await supabase.from('chat_messages').insert({
      sender_id: user.id,
      sender_name: userName || user.email || 'مريض',
      sender_role: 'patient',
      patient_email: userEmail,
      message: newMessage.trim(),
    });

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إرسال الرسالة', variant: 'destructive' });
    } else {
      setNewMessage('');
    }
    setIsSending(false);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />الدردشة مع العيادة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto border rounded-lg p-4 mb-4 space-y-3 bg-muted/20">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground py-8">لا توجد رسائل بعد. ابدأ محادثة مع العيادة!</p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_role === 'patient' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender_role === 'patient'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border rounded-bl-sm'
              }`}>
                <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${msg.sender_role === 'patient' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          />
          <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
