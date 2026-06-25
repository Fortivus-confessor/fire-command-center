import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, ArrowLeft, FileText, MapPin, ArrowRightLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import SituationMapClient from '../components/fortivus/map/SituationMapClient';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useEffect } from 'react';

export const Route = createFileRoute('/ordens-servico_/nova')({
  component: NovaOrdemServicoPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      eventoFogoId: search.eventoFogoId as string | undefined,
    }
  }
});

const emptyForm = {
  comando: '',
  equipe: '',
  tipoDespacho: '',
  prioridade: '',
  responsavel: '',
  descricao: '',
  latLng: '',
  eventoFogoId: '',
};

function NovaOrdemServicoPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const eventoFogoId = searchParams.eventoFogoId;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isDms, setIsDms] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [flyTo, setFlyTo] = useState<{lat: number, lng: number} | null>(null);

  const [addressSearch, setAddressSearch] = useState('');
  const [addressResults, setAddressResults] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressSearch.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${encodeURIComponent(addressSearch)}`)
          .then(res => res.json())
          .then(data => setAddressResults(data || []))
          .catch(console.error);
      } else {
        setAddressResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [addressSearch]);

  function handleAddressSelect(res: any) {
    const lat = parseFloat(res.lat);
    const lng = parseFloat(res.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      setForm(prev => ({ ...prev, latLng: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }));
      if (isDms) {
        setLatInput(ddToDms(lat, false));
        setLngInput(ddToDms(lng, true));
      } else {
        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
      }
      setFlyTo({ lat, lng });
      setAddressSearch(res.display_name);
      setAddressResults([]);
    }
  }

  const { data: centrosDeComandoDB = [] } = useQuery<any[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const { data: usuariosDB = [] } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios'),
  });

  const currentUser = usuariosDB.find(u => u.email === user?.email);
  const myCentroComandoId = currentUser?.centroComandoId ? String(currentUser.centroComandoId) : '';
  const isCentroComando = role === 'CENTRO_COMANDO';

  // We initialize the form conditionally but since we need data from query, we do it in a useEffect or lazily
  const [form, setForm] = useState({ ...emptyForm, eventoFogoId: eventoFogoId || '' });

  useEffect(() => {
    if (isCentroComando && myCentroComandoId && !form.comando) {
      setForm(prev => ({ ...prev, comando: myCentroComandoId }));
    }
  }, [isCentroComando, myCentroComandoId, form.comando]);

  const { data: escalasAtivas = [] } = useQuery<any[]>({
    queryKey: ['escalas-ativas', form.comando],
    queryFn: () => fetchWithAuth(`/operacional/escalas/centro/${form.comando}/ativas`),
    enabled: !!form.comando,
  });

  const { data: todasEscalas = [] } = useQuery<any[]>({
    queryKey: ['escalas'],
    queryFn: () => fetchWithAuth('/operacional/escalas')
  });

  const { data: ordensServicoDB = [] } = useQuery<any[]>({
    queryKey: ['ordens-servico'],
    queryFn: () => fetchWithAuth('/operacional/os'),
  });

  const { data: todosDespachos = [] } = useQuery<any[]>({
    queryKey: ['despachos'],
    queryFn: () => fetchWithAuth('/operacional/despachos')
  });

  const { data: eventoFogo } = useQuery<any>({
    queryKey: ['fireEvent', eventoFogoId],
    queryFn: async () => {
      if (!eventoFogoId) return null;
      try {
        const res = await fetch(`/api/v1/fire-events/buscar?q=${eventoFogoId}`);
        const data = await res.json();
        return data && data.length > 0 ? data[0] : null;
      } catch (e: any) {
        return null;
      }
    },
    enabled: !!eventoFogoId,
    retry: false
  });

  const isEscalaWorking = form.equipe ? todosDespachos.some(d => 
    String(d.escalaId) === form.equipe && 
    !['CONCLUIDA', 'CANCELADA'].includes(d.status)
  ) : false;

  async function save() {
    try {
      const newErrors: Record<string, string> = {};
      if (!form.tipoDespacho) newErrors.tipoDespacho = 'Obrigatório';
      if (!form.prioridade) newErrors.prioridade = 'Obrigatório';
      if (!form.comando) newErrors.comando = 'Obrigatório';
      if (!form.equipe) newErrors.equipe = 'Obrigatório';
      if (!form.responsavel) newErrors.responsavel = 'Obrigatório';
      if (!form.descricao) newErrors.descricao = 'Obrigatório';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }
      setErrors({});
      
      if (form.eventoFogoId) {
        const hasExistingOS = ordensServicoDB.some((os: any) => String(os.eventoFogoId) === String(form.eventoFogoId));
        if (hasExistingOS) {
          toast.error("Este Evento de Fogo já possui uma Ordem de Serviço vinculada.");
          return;
        }
      }

      const latDD = parseCoordinateToDD(latInput);
      const lngDD = parseCoordinateToDD(lngInput);
      
      const p = {
        descricaoTarefa: form.descricao,
        eventoFogoId: form.eventoFogoId || null,
        status: 'EM_EXECUCAO',
        prioridade: form.prioridade,
        escalaId: form.equipe,
        responsavelId: form.responsavel,
        tipoDespacho: form.tipoDespacho,
        latitude: !isNaN(latDD) ? latDD : null,
        longitude: !isNaN(lngDD) ? lngDD : null
      };

      const res = await fetchWithAuth('/operacional/os', {
        method: 'POST',
        body: JSON.stringify(p),
      });
      if (res && res.id) {
        toast.success("Despacho e OS criados com sucesso!");
        navigate({ to: '/ordens-servico', search: { highlightId: undefined } });
      } else {
        toast.error("Erro ao criar OS.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Ocorreu um erro inesperado.");
    }
  }

  function parseCoordinateToDD(coordStr: string): number {
    if (!coordStr) return NaN;
    if (coordStr.includes('°') || coordStr.includes('\'') || coordStr.includes('"')) {
      const parts = coordStr.match(/(-?\d+)\s*°?\s*(\d+)?\s*'?\s*([\d.]+)?\s*"?\s*([NSWE])?/i);
      if (!parts) return NaN;
      let dd = parseFloat(parts[1] || '0') + parseFloat(parts[2] || '0') / 60 + parseFloat(parts[3] || '0') / 3600;
      if (parts[4]) {
        const dir = parts[4].toUpperCase();
        if (dir === 'S' || dir === 'W') dd = -dd;
      } else if (coordStr.trim().startsWith('-')) {
         dd = -Math.abs(dd);
      }
      return dd;
    } else {
      return parseFloat(coordStr);
    }
  }

  function ddToDms(dd: number, isLng: boolean) {
    if (isNaN(dd)) return '';
    const dir = dd < 0 ? (isLng ? 'W' : 'S') : (isLng ? 'E' : 'N');
    const absDd = Math.abs(dd);
    const deg = Math.floor(absDd);
    const min = Math.floor((absDd - deg) * 60);
    const sec = ((absDd - deg - min / 60) * 3600).toFixed(1);
    return `${deg}° ${min}' ${sec}" ${dir}`;
  }

  function handleMapClick(lat: number, lng: number) {
    if (isDms) {
      setLatInput(ddToDms(lat, false));
      setLngInput(ddToDms(lng, true));
    } else {
      setLatInput(lat.toFixed(6));
      setLngInput(lng.toFixed(6));
    }
    setForm({ ...form, latLng: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
  }

  function toggleFormat() {
    const latDD = parseCoordinateToDD(latInput);
    const lngDD = parseCoordinateToDD(lngInput);
    
    if (isDms) {
      setLatInput(isNaN(latDD) ? latInput : latDD.toFixed(6));
      setLngInput(isNaN(lngDD) ? lngInput : lngDD.toFixed(6));
      setIsDms(false);
    } else {
      setLatInput(isNaN(latDD) ? latInput : ddToDms(latDD, false));
      setLngInput(isNaN(lngDD) ? lngInput : ddToDms(lngDD, true));
      setIsDms(true);
    }
  }

  function applyManualCoordinates() {
    const latDD = parseCoordinateToDD(latInput);
    const lngDD = parseCoordinateToDD(lngInput);
    if (!isNaN(latDD) && !isNaN(lngDD)) {
      setForm(prev => ({ ...prev, latLng: `${latDD.toFixed(6)}, ${lngDD.toFixed(6)}` }));
      setFlyTo({ lat: latDD, lng: lngDD });
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/ordens-servico', search: { highlightId: undefined } })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-fire" />
            {eventoFogoId ? 'Cadastrar OS para evento de fogo' : 'Nova Ordem de Serviço Livre'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione a equipe, defina as diretrizes e despache a Ordem de Serviço.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        {/* Left Side: Map */}
        <div className="flex flex-col gap-3 h-[500px] lg:h-auto">
          <div className="relative max-w-sm z-[400]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar endereço..."
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              className="pl-9 bg-background/90 backdrop-blur-sm border-border shadow-sm"
            />
            {addressResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-background border border-border rounded-md shadow-lg overflow-y-auto max-h-48 z-[500]">
                {addressResults.map((res: any, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-secondary/50 border-b border-border last:border-0"
                    onClick={() => handleAddressSelect(res)}
                  >
                    {res.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl overflow-hidden glass border border-border flex-1 relative">
            <SituationMapClient 
               selectedId={eventoFogoId} 
               isolatedEventId={eventoFogoId || 'NONE_ISOLATED'}
               onClickMap={handleMapClick}
               activePin={form.latLng ? { lat: parseFloat(form.latLng.split(',')[0]), lng: parseFloat(form.latLng.split(',')[1]) } : null}
               center={flyTo}
               hideEvents={true}
               extraMarkers={eventoFogo?.latitude && eventoFogo?.longitude ? [{ lat: eventoFogo.latitude, lng: eventoFogo.longitude, color: '#f97316', tooltip: 'Evento de Fogo' }] : []}
            />
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="rounded-xl glass border border-border p-6 overflow-y-auto">
          <div className="grid gap-5">
            {eventoFogoId && (
              <div className="space-y-2">
                <Label>ID do Evento de Fogo</Label>
                <div className="px-3 py-2 bg-secondary/50 rounded-md border border-border mono text-sm text-muted-foreground break-all">
                  {eventoFogoId}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={errors.tipoDespacho ? "text-red-500" : ""}>Tipo de Despacho *</Label>
                <Select value={form.tipoDespacho} onValueChange={(v) => { setForm({ ...form, tipoDespacho: v as any }); setErrors({...errors, tipoDespacho: ''}); }}>
                  <SelectTrigger className={errors.tipoDespacho ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TERRESTRE">Combate Incêndio Terrestre</SelectItem>
                    <SelectItem value="AEREO">Combate Incêndio Aéreo</SelectItem>
                    <SelectItem value="MAQUINARIO">Combate Incêndio Maquinário</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipoDespacho && <p className="text-xs text-red-500">{errors.tipoDespacho}</p>}
              </div>
              <div className="space-y-2">
                <Label className={errors.prioridade ? "text-red-500" : ""}>Prioridade *</Label>
                <Select value={form.prioridade} onValueChange={(v: any) => { setForm({ ...form, prioridade: v }); setErrors({...errors, prioridade: ''}); }}>
                  <SelectTrigger className={errors.prioridade ? "border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 - Imediata</SelectItem>
                    <SelectItem value="P2">P2 - Alta</SelectItem>
                    <SelectItem value="P3">P3 - Normal</SelectItem>
                  </SelectContent>
                </Select>
                {errors.prioridade && <p className="text-xs text-red-500">{errors.prioridade}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={errors.comando ? "text-red-500" : ""}>Comando (Centro) *</Label>
                <Select disabled={isCentroComando} value={form.comando || ''} onValueChange={(v) => { setForm({ ...form, comando: v, equipe: '', responsavel: '' }); setErrors({...errors, comando: ''}); }}>
                  <SelectTrigger className={errors.comando ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o comando" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosDeComandoDB.map((cc: any) => <SelectItem key={cc.id} value={String(cc.id)}>{cc.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.comando && <p className="text-xs text-red-500">{errors.comando}</p>}
              </div>
              <div className="space-y-2">
                <Label className={errors.equipe ? "text-red-500" : ""}>Equipe *</Label>
                <Select disabled={!form.comando} value={form.equipe || ''} onValueChange={(v) => { setForm({ ...form, equipe: v, responsavel: '' }); setErrors({...errors, equipe: ''}); }}>
                  <SelectTrigger className={errors.equipe ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione a escala/equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {escalasAtivas.map((eq: any) => {
                      return <SelectItem key={eq.id} value={String(eq.id)}>{eq.equipeNome} - {eq.comandanteNome || 'Sem Cmt'}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
                {errors.equipe && <p className="text-xs text-red-500">{errors.equipe}</p>}
                {isEscalaWorking && (
                  <div className="text-xs text-warning bg-warning/10 p-1.5 rounded border border-warning/20 mt-2">
                    Aviso: A escala selecionada possui despachos em andamento.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={errors.responsavel ? "text-red-500" : ""}>Usuário Responsável *</Label>
              <Select disabled={!form.equipe} value={form.responsavel || ''} onValueChange={(v) => { setForm({ ...form, responsavel: v }); setErrors({...errors, responsavel: ''}); }}>
                <SelectTrigger className={errors.responsavel ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosDB.filter((u: any) => {
                    const selectedScale = todasEscalas.find((e: any) => String(e.id) === String(form.equipe));
                    if (!selectedScale) return false;
                    const ids = [...(selectedScale.integranteIds || []), selectedScale.comandanteId].map(String);
                    return ids.includes(String(u.id));
                  }).map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.responsavel && <p className="text-xs text-red-500">{errors.responsavel}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ponto de Encontro / Local (Clique no mapa ou digite)</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs px-2"
                  onClick={toggleFormat}
                >
                  <ArrowRightLeft className="w-3 h-3 mr-1" />
                  {isDms ? 'Alternar para Decimal' : 'Alternar para Graus (DMS)'}
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 text-xs"
                    placeholder={isDms ? "Lat (ex: 15° 30' 0\" S)" : "Latitude (ex: -15.500)"}
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    onBlur={applyManualCoordinates}
                  />
                </div>
                <div className="relative flex-1">
                  <Input
                    className="text-xs"
                    placeholder={isDms ? "Lng (ex: 50° 0' 0\" W)" : "Longitude (ex: -50.000)"}
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    onBlur={applyManualCoordinates}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={errors.descricao ? "text-red-500" : ""}>Diretrizes da Missão *</Label>
              <Textarea 
                placeholder="Descreva as instruções operacionais para a equipe..." 
                className={`resize-none h-24 ${errors.descricao ? "border-red-500" : ""}`}
                value={form.descricao}
                onChange={(e) => { setForm({ ...form, descricao: e.target.value }); setErrors({...errors, descricao: ''}); }}
              />
              {errors.descricao && <p className="text-xs text-red-500">{errors.descricao}</p>}
            </div>
            
            <div className="pt-4 flex justify-end gap-3 border-t border-border">
              <Button variant="outline" onClick={() => navigate({ to: '/ordens-servico', search: { highlightId: undefined } })}>
                Cancelar
              </Button>
              <Button onClick={save} className="bg-fire hover:bg-fire/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Confirmar Despacho
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
