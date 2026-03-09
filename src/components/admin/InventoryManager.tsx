import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, AlertTriangle, Package, Search } from 'lucide-react';

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  unit_price: number;
  supplier: string | null;
  notes: string | null;
  created_at: string;
}

const CATEGORIES = ['general', 'dental_materials', 'instruments', 'medications', 'cleaning', 'protective', 'office'];
const UNITS = ['piece', 'box', 'pack', 'bottle', 'tube', 'roll', 'pair', 'set'];

const InventoryManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    item_name: '', category: 'general', quantity: 0, min_quantity: 5,
    unit: 'piece', unit_price: 0, supplier: '', notes: ''
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('inventory_items').select('*').order('item_name');
    if (!error) setItems(data || []);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.item_name.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم المادة', variant: 'destructive' });
      return;
    }
    const payload = { ...formData, created_by: user?.id };
    
    if (editingItem) {
      const { error } = await supabase.from('inventory_items').update(payload).eq('id', editingItem.id);
      if (error) { toast({ title: 'خطأ', description: 'فشل في التحديث', variant: 'destructive' }); return; }
      toast({ title: 'تم التحديث', description: 'تم تحديث المادة بنجاح' });
    } else {
      const { error } = await supabase.from('inventory_items').insert(payload);
      if (error) { toast({ title: 'خطأ', description: 'فشل في الإضافة', variant: 'destructive' }); return; }
      toast({ title: 'تمت الإضافة', description: 'تمت إضافة المادة بنجاح' });
    }
    setDialogOpen(false);
    setEditingItem(null);
    resetForm();
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (!error) {
      toast({ title: 'تم الحذف', description: 'تم حذف المادة' });
      fetchItems();
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name, category: item.category, quantity: item.quantity,
      min_quantity: item.min_quantity, unit: item.unit, unit_price: item.unit_price,
      supplier: item.supplier || '', notes: item.notes || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => setFormData({
    item_name: '', category: 'general', quantity: 0, min_quantity: 5,
    unit: 'piece', unit_price: 0, supplier: '', notes: ''
  });

  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity);
  const filtered = items
    .filter(i => filterCategory === 'all' || i.category === filterCategory)
    .filter(i => i.item_name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-semibold text-destructive">تنبيه: مواد منخفضة المخزون ({lowStockItems.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge key={item.id} variant="destructive">{item.item_name} ({item.quantity} {item.unit})</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />إدارة المخزون</CardTitle>
              <CardDescription>{items.length} مادة في المخزون</CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setEditingItem(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 ml-2" />إضافة مادة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المادة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>الحد الأدنى</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.min_quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.unit_price} ر.س</TableCell>
                  <TableCell>{item.supplier || '-'}</TableCell>
                  <TableCell>
                    {item.quantity <= item.min_quantity ? (
                      <Badge variant="destructive">منخفض</Badge>
                    ) : (
                      <Badge variant="secondary">متوفر</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد مواد</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingItem ? 'تعديل مادة' : 'إضافة مادة جديدة'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم المادة *</Label><Input value={formData.item_name} onChange={e => setFormData(f => ({ ...f, item_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الفئة</Label>
                <Select value={formData.category} onValueChange={v => setFormData(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>الوحدة</Label>
                <Select value={formData.unit} onValueChange={v => setFormData(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>الكمية</Label><Input type="number" value={formData.quantity} onChange={e => setFormData(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} /></div>
              <div><Label>الحد الأدنى</Label><Input type="number" value={formData.min_quantity} onChange={e => setFormData(f => ({ ...f, min_quantity: parseInt(e.target.value) || 0 }))} /></div>
              <div><Label>السعر</Label><Input type="number" value={formData.unit_price} onChange={e => setFormData(f => ({ ...f, unit_price: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label>المورد</Label><Input value={formData.supplier} onChange={e => setFormData(f => ({ ...f, supplier: e.target.value }))} /></div>
            <div><Label>ملاحظات</Label><Textarea value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editingItem ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManager;
