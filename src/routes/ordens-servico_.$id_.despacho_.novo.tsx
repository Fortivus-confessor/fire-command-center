import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Send, MapPin, ArrowRightLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import SituationMapClient from '../components/fortivus/map/SituationMapClient';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const Route = createFileRoute('/ordens-servico_/$id_/despacho_/novo')({
  component: NovoDespachoPage,
});

const emptyForm = {
  comando: '',
  equipe: '',
  responsavel: '',
  categoria: '',
  descricao: '',
  latLng: '',
};

function NovoDespachoPage() {
  const { id: osId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isDms, setIsDms] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [flyTo, setFlyTo] = useState<{lat: number, lng: number} | null>(null);

  const [addressSearch, setAddressSearch] = useState('');
  const [addressResults, setAddressResults] = useState<any[]>([]);

  // Carrega OS original para podermos pular para o local dela
  const { data: os } = useQuery<any>({
    queryKey: ['os', osId],
    queryFn: () => fetchWithAuth(`/operacional/os/${osId}`),
    enabled: !!osId
  });

  // Pre-fill latitude/longitude if OS has it
  useEffect(() => {
    if (os && os.latitude && os.longitude && !form.latLng) {
      setLatInput(os.latitude.toFixed(6));
      setLngInput(os.longitude.toFixed(6));
      setForm(prev => ({ ...prev, latLng: `${os.latitude.toFixed(6)}, ${os.longitude.toFixed(6)}` }));
      setFlyTo({ lat: os.latitude, lng: os.longitude });
    }
  }, [os]);

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

  const { data: escalasAtivas = [] } = useQuery<any[]>({
    queryKey: ['escalas-ativas', form.comando],
    queryFn: () => fetchWithAuth(`/operacional/escalas/centro/${form.comando}/ativas`),
    enabled: !!form.comando,
  });

  const { data: todasEquipes = [] } = useQuery<any[]>({
    queryKey: ['equipes'],
    queryFn: () => fetchWithAuth('/admin/equipes')
  });

  const { data: todasEscalas = [] } = useQuery<any[]>({
    queryKey: ['todas-escalas'],
    queryFn: () => fetchWithAuth('/operacional/escalas')
  });

  const { data: todosUsuarios = [] } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios')
  });

  const { data: todosDespachos = [] } = useQuery<any[]>({
    queryKey: ['despachos'],
    queryFn: () => fetchWithAuth('/operacional/despachos')
  });

  // Check if selected scale is already working
  const isEscalaWorking = form.equipe ? todosDespachos.some(d => 
    String(d.escalaId) === form.equipe && 
    !['CONCLUIDA', 'CANCELADA'].includes(d.status)
  ) : false;

  async function save() {
    try {
      const newErrors: Record<string, string> = {};
      if (!form.comando) newErrors.comando = 'Obrigatório';
      if (!form.equipe) newErrors.equipe = 'Obrigatório';
      if (!form.responsavel) newErrors.responsavel = 'Obrigatório';
      if (!form.categoria) newErrors.categoria = 'Obrigatório';
      if (!form.descricao) newErrors.descricao = 'Obrigatório';

      const latDD = parseCoordinateToDD(latInput);
      const lngDD = parseCoordinateToDD(lngInput);
      if (isNaN(latDD) || isNaN(lngDD)) {
        newErrors.latLng = 'Coordenadas inválidas';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Por favor, preencha todos os campos corretamente");
        return;
      }
      setErrors({});

      const p = {
        ordemServicoId: Number(osId),
        escalaId: form.equipe,
        responsavelId: form.responsavel,
        categoria: form.categoria,
        descricaoTarefa: form.descricao,
        latitude: latDD,
        longitude: lngDD
      };

      const res = await fetchWithAuth('/operacional/despachos', {
        method: 'POST',
        body: JSON.stringify(p),
      });
      
      if (res && res.id) {
        toast.success("Despacho criado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['os', osId] });
        queryClient.invalidateQueries({ queryKey: ['despachos'] });
        navigate({ to: `/ordens-servico/${osId}` as any });
      } else {
        toast.error("Erro ao criar Despacho.");
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

  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/ordens-servico/${osId}` as any })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Send className="h-6 w-6 text-warning" />
            Adicionar Despacho
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha os dados e marque no mapa o local para despachar a equipe nesta Ordem de Serviço (OS{osId}).
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
            {(() => {
              const parsedLat = parseCoordinateToDD(latInput);
              const parsedLng = parseCoordinateToDD(lngInput);
              const hasValidPin = !isNaN(parsedLat) && !isNaN(parsedLng);
              return (
                <SituationMapClient 
                  selectedId={os?.eventoFogoId} 
                  isolatedEventId={os?.eventoFogoId || 'NONE_ISOLATED'}
                  onClickMap={handleMapClick}
                  flyTo={flyTo}
                  activePin={hasValidPin ? { lat: parsedLat, lng: parsedLng } : null}
                  extraMarkers={[
                    ...(os?.latitude ? [{ lat: os.latitude, lng: os.longitude, color: '#f59e0b', tooltip: 'Local Inicial da OS' }] : [])
                  ]}
                />
              );
            })()}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Clique no mapa ou busque um endereço para marcar a localização deste despacho.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="glass border border-border p-6 rounded-xl flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2">Informações do Despacho</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={errors.comando ? "text-red-500" : ""}>Centro de Comando *</Label>
                <Select value={form.comando} onValueChange={(v) => { setForm({ ...form, comando: v, equipe: '', responsavel: '' }); setErrors({...errors, comando: ''}); }}>
                  <SelectTrigger className={errors.comando ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o centro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosDeComandoDB.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.comando && <p className="text-xs text-red-500">{errors.comando}</p>}
              </div>
              <div className="space-y-2">
                <Label className={errors.equipe ? "text-red-500" : ""}>Escala / Equipe *</Label>
                <Select disabled={!form.comando} value={form.equipe} onValueChange={(v) => { setForm({ ...form, equipe: v, responsavel: '' }); setErrors({...errors, equipe: ''}); }}>
                  <SelectTrigger className={errors.equipe ? "border-red-500" : ""}>
                    <SelectValue placeholder={form.comando ? "Selecione..." : "Selecione comando..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {escalasAtivas.map(e => {
                      return <SelectItem key={e.id} value={String(e.id)}>{e.equipeNome || 'Desconhecida'} - {e.comandanteNome || 'Comandante Desconhecido'}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                {errors.equipe && <p className="text-xs text-red-500">{errors.equipe}</p>}
                {isEscalaWorking && (
                  <div className="text-xs text-warning bg-warning/10 p-1.5 rounded border border-warning/20">
                    Aviso: A escala selecionada possui despachos em andamento.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={errors.responsavel ? "text-red-500" : ""}>Usuário Responsável *</Label>
                <Select disabled={!form.equipe} value={form.responsavel} onValueChange={(v) => { setForm({ ...form, responsavel: v }); setErrors({...errors, responsavel: ''}); }}>
                  <SelectTrigger className={errors.responsavel ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o responsável..." />
                  </SelectTrigger>
                  <SelectContent>
                    {todosUsuarios.filter((u: any) => {
                      const selectedScale = todasEscalas.find((e: any) => String(e.id) === String(form.equipe));
                      if (!selectedScale) return false;
                      const ids = [...(selectedScale.integranteIds || []), selectedScale.comandanteId].map(String);
                      return ids.includes(String(u.id));
                    }).map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.responsavel && <p className="text-xs text-red-500">{errors.responsavel}</p>}
              </div>
              <div className="space-y-2">
                <Label className={errors.categoria ? "text-red-500" : ""}>Categoria *</Label>
                <Select value={form.categoria} onValueChange={(v) => { setForm({ ...form, categoria: v }); setErrors({...errors, categoria: ''}); }}>
                  <SelectTrigger className={errors.categoria ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TERRESTRE">Terrestre</SelectItem>
                    <SelectItem value="AEREO">Aéreo</SelectItem>
                    <SelectItem value="MAQUINARIO">Maquinário</SelectItem>
                    <SelectItem value="AQUATICO">Aquático</SelectItem>
                  </SelectContent>
                </Select>
                {errors.categoria && <p className="text-xs text-red-500">{errors.categoria}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={errors.descricao ? "text-red-500" : ""}>Descrição / Diretrizes *</Label>
              <Textarea
                placeholder="Diretrizes do despacho..."
                value={form.descricao}
                onChange={e => { setForm({...form, descricao: e.target.value}); setErrors({...errors, descricao: ''}); }}
                className={`min-h-[100px] ${errors.descricao ? "border-red-500" : ""}`}
              />
              {errors.descricao && <p className="text-xs text-red-500">{errors.descricao}</p>}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className={errors.latLng ? "text-red-500" : ""}>Ponto de Encontro / Local (Clique no mapa ou digite) *</Label>
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
                    className={`pl-9 text-xs ${errors.latLng ? "border-red-500" : ""}`}
                    placeholder={isDms ? "Lat (ex: 15° 30' 0\" S)" : "Latitude (ex: -15.500)"}
                    value={latInput}
                    onChange={(e) => { setLatInput(e.target.value); setErrors({...errors, latLng: ''}); }}
                    onBlur={applyManualCoordinates}
                  />
                </div>
                <div className="relative flex-1">
                  <Input
                    className={`text-xs ${errors.latLng ? "border-red-500" : ""}`}
                    placeholder={isDms ? "Lng (ex: 50° 0' 0\" W)" : "Longitude (ex: -50.000)"}
                    value={lngInput}
                    onChange={(e) => { setLngInput(e.target.value); setErrors({...errors, latLng: ''}); }}
                    onBlur={applyManualCoordinates}
                  />
                </div>
              </div>
              {errors.latLng && <p className="text-xs text-red-500">{errors.latLng}</p>}
            </div>
          </div>

          <div className="mt-auto pt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate({ to: `/ordens-servico/${osId}` as any })}>Cancelar</Button>
            <Button onClick={save} className="bg-fire hover:bg-fire/90 text-white min-w-[120px]">
              <Plus className="h-4 w-4 mr-2" /> Despachar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
