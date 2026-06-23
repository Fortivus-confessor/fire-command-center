import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Search, MessageSquare, Trash2, Truck, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCanAccess } from '@/hooks/useCanAccess';

export const Route = createFileRoute('/despachos')({
  component: DespachosPage,
});

// ── Types ──────────────────────────────────────────────
interface Despacho {
  id: string;
  codigo: string;
  osVinculada: string;
  equipe: string;
  destino: string;
  horarioSaida: string;
  horarioChegada: string;
  tipo: 'Terrestre' | 'Aéreo' | 'Maquinário';
  status: 'Pendente' | 'Concluída';
}

// ── Mock Data ──────────────────────────────────────────
const initialData: Despacho[] = [
  { id: '1', codigo: 'DSP-001', osVinculada: 'OS-2025-001', equipe: 'Alfa-1', destino: 'Cuiabá - MT (Setor Norte)', horarioSaida: '06:30', horarioChegada: '08:15', tipo: 'Terrestre', status: 'Concluída' },
  { id: '2', codigo: 'DSP-002', osVinculada: 'OS-2025-002', equipe: 'Bravo-2', destino: 'Sinop - MT (BR-163 km 40)', horarioSaida: '07:00', horarioChegada: '09:30', tipo: 'Aéreo', status: 'Pendente' },
  { id: '3', codigo: 'DSP-003', osVinculada: 'OS-2025-003', equipe: 'Charlie-3', destino: 'Alta Floresta - MT', horarioSaida: '05:45', horarioChegada: '07:00', tipo: 'Maquinário', status: 'Pendente' },
  { id: '4', codigo: 'DSP-004', osVinculada: 'OS-2025-005', equipe: 'Delta-4', destino: 'Marabá - PA (Serra Sul)', horarioSaida: '08:00', horarioChegada: '10:45', tipo: 'Terrestre', status: 'Pendente' },
  { id: '5', codigo: 'DSP-005', osVinculada: 'OS-2025-006', equipe: 'Echo-5', destino: 'Palmas - TO', horarioSaida: '04:30', horarioChegada: '06:15', tipo: 'Aéreo', status: 'Concluída' },
  { id: '6', codigo: 'DSP-006', osVinculada: 'OS-2025-001', equipe: 'Foxtrot-6', destino: 'Cuiabá - MT (Chapada)', horarioSaida: '09:15', horarioChegada: '11:00', tipo: 'Terrestre', status: 'Pendente' },
];

// ── Helpers ────────────────────────────────────────────
function statusBadge(s: string) {
  switch (s) {
    case 'Pendente': return <Badge className="bg-warning/20 text-warning border-warning/30">{s}</Badge>;
    case 'Concluída': return <Badge className="bg-success/20 text-success border-success/30">{s}</Badge>;
    default: return <Badge variant="secondary">{s}</Badge>;
  }
}

// ▀▄▀▄ Page Component ▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄
function DespachosPage() {
  const navigate = useNavigate();
  const canRespond = useCanAccess('despachos', 'edit');
  const canDelete = useCanAccess('despachos', 'delete');
  const [data, setData] = useState<Despacho[]>(initialData);
  const [listAll, setListAll] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Despacho | null>(null);
  const [newStatus, setNewStatus] = useState<'Pendente' | 'Concluída'>('Pendente');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = data.filter((item) => {
    const matchSearch =
      !search ||
      item.codigo.toLowerCase().includes(search.toLowerCase()) ||
      item.equipe.toLowerCase().includes(search.toLowerCase()) ||
      item.destino.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openRespond(item: Despacho) {
    if (item.tipo === 'Terrestre') {
      navigate({ to: `/responder-terrestre/${item.id}` });
    } else if (item.tipo === 'Aéreo') {
      navigate({ to: `/responder-aereo/${item.id}` });
    } else if (item.tipo === 'Maquinário') {
      navigate({ to: `/responder-maquinario/${item.id}` });
    } else {
      setEditingItem(item);
      setDialogOpen(true);
    }
  }

  function handleSaveStatus() {
    if (editingItem) {
      setData((prev) => prev.map((d) => (d.id === editingItem.id ? { ...d, status: 'Concluída' } : d)));
    }
    setDialogOpen(false);
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (deletingId) setData((prev) => prev.filter((d) => d.id !== deletingId));
    setDeleteDialogOpen(false);
    setDeletingId(null);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-command" />
            Despachos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe e responda os despachos das equipes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, equipe ou destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px]">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden glass border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>OS Vinculada</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Chegada Prev.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum despacho encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="mono font-medium">{item.codigo}</TableCell>
                    <TableCell className="mono text-muted-foreground">{item.osVinculada}</TableCell>
                    <TableCell className="font-medium">{item.equipe}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{item.tipo}</Badge></TableCell>
                    <TableCell>{item.destino}</TableCell>
                    <TableCell className="mono">{item.horarioSaida}</TableCell>
                    <TableCell className="mono">{item.horarioChegada}</TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canRespond && (
                        <Button variant="ghost" size="sm" onClick={() => openRespond(item)} className="h-8 hover:text-command gap-1 px-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="hidden sm:inline">Responder</span>
                        </Button>
                        )}
                        {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id)} className="h-8 w-8 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        

      </div>

      {/* Respond Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Responder Despacho</DialogTitle>
            <DialogDescription>
              Atualize o status do despacho {editingItem?.codigo}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Descrição do Atendimento</Label>
              <Textarea placeholder="Descreva as ações tomadas e a situação encontrada..." className="min-h-[150px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveStatus} className="bg-fire hover:bg-fire/90 text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este despacho? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
