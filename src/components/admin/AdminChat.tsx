import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Loader2, Users } from 'lucide-react';
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

interface ChatThread {
  patient_email: string;
  patient_name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const AdminChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchThreads(); }, []);

  useEffect(() => {
    if (!selectedThread) return;
    fetchMessages(selectedThread);

    const channel = supabase
      .channel('admin-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `patient_email=eq.${selectedThread}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        if (newMsg.sender_role === 'patient') {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', newMsg.id).then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchThreads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const threadMap: Record<string, ChatThread> = {};
      data.forEach(msg => {
        if (!threadMap[msg.patient_email]) {
          threadMap[msg.patient_email] = {
            patient_email: msg.patient_email,
            patient_name: msg.sender_role === 'patient' ? msg.sender_name : msg.patient_email,
            lastMessage: msg.message,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
          };
        }
        if (msg.sender_role === 'patient' && !msg.is_read) {
          threadMap[msg.patient_email].unreadCount++;
        }
        if (msg.sender_role === 'patient') {
          threadMap[msg.patient_email].patient_name = msg.sender_name;
        }
      });
      setThreads(Object.values(threadMap).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
    }
    setIsLoading(false);
  };

  const fetchMessages = async (email: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('patient_email', email)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    // Mark unread from patients as read
    const unread = (data || []).filter(m => !m.is_read && m.sender_role === 'patient');
    if (unread.length > 0) {
      await supabase.from('chat_messages').update({ is_read: true }).in('id', unread.map(m => m.id));
      fetchThreads();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedThread) return;
    setIsSending(true);
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
    
    const { error } = await supabase.from('chat_messages').insert({
      sender_id: user.id,
      sender_name: profile?.full_name || 'الإدارة',
      sender_role: 'admin',
      patient_email: selectedThread,
      message: newMessage.trim(),
    });

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إرسال الرسالة', variant: 'destructive' });
    } else {
      setNewMessage('');
    }
    setIsSending(false);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Thread list */}
      <Card className="md:col-span-1 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />المحادثات</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto h-[calc(100%-60px)]">
          {threads.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">لا توجد محادثات</p>}
          {threads.map(thread => (
            <div
              key={thread.patient_email}
              onClick={() => setSelectedThread(thread.patient_email)}
              className={`p-3 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedThread === thread.patient_email ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{thread.patient_name}</span>
                {thread.unreadCount > 0 && <Badge variant="destructive" className="text-xs">{thread.unreadCount}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{thread.lastMessage}</p>
              <p className="text-[10px] text-muted-foreground">{format(new Date(thread.lastMessageTime), 'MM/dd hh:mm a')}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="md:col-span-2 overflow-hidden flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            {selectedThread ? `محادثة مع ${threads.find(t => t.patient_email === selectedThread)?.patient_name || selectedThread}` : 'اختر محادثة'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {!selectedThread && <p className="text-center text-muted-foreground py-12">اختر محادثة من القائمة</p>}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_role !== 'patient' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  msg.sender_role !== 'patient'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                }`}>
                  <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender_role !== 'patient' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {selectedThread && (
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="اكتب ردك..."
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChat;
