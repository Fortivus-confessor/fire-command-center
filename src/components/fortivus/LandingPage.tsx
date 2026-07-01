import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ArrowUpRight,
  LayoutDashboard,
  Users,
  Flame,
  MapPin,
  ClipboardCheck,
  ListChecks,
  CalendarClock,
  FileText,
  Radio,
  Satellite,
  ShieldCheck,
  Activity,
} from 'lucide-react';

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Gestão Operacional',
    desc: 'Sala de situação unificada para coordenar todo o ciclo de combate, do foco ao encerramento.',
    accent: 'command',
  },
  {
    icon: Users,
    title: 'Equipes & Efetivo',
    desc: 'Organize brigadas, escalas e recursos com visibilidade total da prontidão em campo.',
    accent: 'command',
  },
  {
    icon: Flame,
    title: 'Ocorrências',
    desc: 'Ordens de serviço criadas a partir de focos de calor, com priorização e rastreio de status.',
    accent: 'fire',
  },
  {
    icon: MapPin,
    title: 'Geolocalização',
    desc: 'Mapas interativos com focos NASA/FIRMS, posição das equipes e despacho georreferenciado.',
    accent: 'command',
  },
  {
    icon: ClipboardCheck,
    title: 'Vistorias',
    desc: 'Registro estruturado de inspeções terrestres, aéreas e de maquinário direto do local.',
    accent: 'success',
  },
  {
    icon: ListChecks,
    title: 'Checklists',
    desc: 'Procedimentos padronizados que garantem conformidade e segurança em cada operação.',
    accent: 'success',
  },
  {
    icon: CalendarClock,
    title: 'Escalas',
    desc: 'Planejamento de turnos e checkout de equipes com controle de disponibilidade em tempo real.',
    accent: 'command',
  },
  {
    icon: FileText,
    title: 'Relatórios',
    desc: 'Relatórios terrestres, aéreos e de maquinário que encerram o evento com trilha auditável.',
    accent: 'fire',
  },
  {
    icon: Radio,
    title: 'Comunicação',
    desc: 'Despacho e mensageria assíncrona conectando comando e campo sem perder informação.',
    accent: 'command',
  },
] as const;

const ACCENT: Record<string, { ring: string; bg: string; text: string }> = {
  command: { ring: 'ring-[#3B82F6]/25', bg: 'bg-[#3B82F6]/10', text: 'text-[#60A5FA]' },
  fire: { ring: 'ring-[#F97316]/25', bg: 'bg-[#F97316]/10', text: 'text-[#FB923C]' },
  success: { ring: 'ring-[#22C55E]/25', bg: 'bg-[#22C55E]/10', text: 'text-[#4ADE80]' },
};

export function LandingPage() {
  const { login } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToFeatures = () =>
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-[#070C16] text-white antialiased selection:bg-[#3B82F6]/30">
      {/* ══════════════ NAVBAR ══════════════ */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/10 bg-[#070C16]/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/icone_fortivus_oficial.png"
              alt="Fortivus"
              className="h-9 w-9 object-contain drop-shadow-[0_2px_10px_rgba(59,130,246,0.35)]"
            />
            <span className="text-lg font-extrabold tracking-tight font-display">
              FORTIVUS
            </span>
          </div>
          <Button
            onClick={() => login()}
            className="h-10 rounded-full bg-white/10 px-5 font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition-all hover:bg-white/20 hover:ring-white/30"
          >
            Entrar
          </Button>
        </nav>
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* Vídeo de fundo */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/icone_fortivus_oficial.png"
        >
          <source src="/video_home_fortivus.mp4" type="video/mp4" />
        </video>

        {/* Overlay escuro para legibilidade */}
        <div className="absolute inset-0 bg-[#050912]/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050912]/60 via-[#050912]/30 to-[#070C16]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050912]/80 via-transparent to-transparent" />

        {/* Conteúdo */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <div className="lp-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-blue-100/90 backdrop-blur-md">
              <Satellite className="h-4 w-4 text-[#60A5FA]" />
              Monitoramento por satélite NASA/FIRMS · Brasil inteiro
            </div>

            <h1
              className="lp-fade-up mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl font-display"
              style={{ animationDelay: '0.1s' }}
            >
              Comando e controle de
              <span className="mt-1 block bg-gradient-to-r from-[#60A5FA] via-[#93C5FD] to-[#FB923C] bg-clip-text text-transparent lp-shimmer">
                incêndios florestais
              </span>
            </h1>

            <p
              className="lp-fade-up mt-6 max-w-xl text-lg leading-relaxed text-blue-50/75 sm:text-xl"
              style={{ animationDelay: '0.2s' }}
            >
              A plataforma que integra detecção de focos, planejamento de ordens
              de serviço e despacho de brigadas, helitack e maquinário — em tempo
              real, para quem está na linha de frente.
            </p>

            <div
              className="lp-fade-up mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: '0.3s' }}
            >
              <Button
                size="lg"
                onClick={() => login()}
                className="group h-14 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-8 text-base font-bold text-white shadow-[0_10px_40px_-10px_rgba(37,99,235,0.8)] ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-8px_rgba(37,99,235,0.9)]"
              >
                Acessar Sistema
                <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToFeatures}
                className="h-14 rounded-full border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
              >
                Conhecer Plataforma
              </Button>
            </div>

            {/* Métricas de credibilidade */}
            <div
              className="lp-fade-up mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8"
              style={{ animationDelay: '0.4s' }}
            >
              {[
                { icon: Activity, value: 'Tempo real', label: 'Focos de calor' },
                { icon: MapPin, value: 'Nacional', label: 'Cobertura' },
                { icon: ShieldCheck, value: 'Auditável', label: 'Ciclo completo' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label}>
                  <Icon className="mb-2 h-5 w-5 text-[#60A5FA]" />
                  <div className="text-lg font-bold text-white">{value}</div>
                  <div className="text-sm text-blue-100/50">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Indicador de scroll */}
        <button
          onClick={scrollToFeatures}
          aria-label="Ver funcionalidades"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/40 transition-colors hover:text-white/80"
        >
          <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-current p-1.5">
            <div className="h-2 w-1 animate-bounce rounded-full bg-current" />
          </div>
        </button>
      </section>

      {/* ══════════════ FUNCIONALIDADES ══════════════ */}
      <section
        ref={featuresRef}
        className="relative border-t border-white/5 bg-[#070C16] py-24 sm:py-32"
      >
        {/* Glows ambientais */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-20 h-[32rem] w-[32rem] rounded-full bg-[#2563EB]/10 blur-[140px]" />
          <div className="absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-[#F97316]/8 blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/20 bg-[#3B82F6]/10 px-4 py-1.5 text-sm font-semibold text-[#60A5FA]">
              Uma plataforma, o ciclo inteiro
            </span>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl font-display">
              Tudo que o combate precisa,
              <span className="text-[#60A5FA]"> em um só lugar</span>
            </h2>
            <p className="mt-5 text-lg text-blue-50/60">
              Do primeiro foco detectado ao relatório final, o Fortivus conecta
              comando e campo com informação confiável e rastreável.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, accent }) => {
              const a = ACCENT[accent];
              return (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div
                    className={`inline-flex rounded-xl p-3 ring-1 ${a.bg} ${a.ring} ${a.text} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-blue-50/55">
                    {desc}
                  </p>
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-current opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10"
                    style={{ color: 'currentColor' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section className="relative overflow-hidden border-t border-white/5 bg-[#070C16] py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/15 blur-[130px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <img
            src="/icone_fortivus_oficial.png"
            alt="Fortivus"
            className="lp-float mx-auto h-20 w-20 object-contain drop-shadow-[0_8px_30px_rgba(59,130,246,0.4)]"
          />
          <h2 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-5xl font-display">
            Pronto para assumir o comando?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-blue-50/60">
            Acesso restrito a instituições autorizadas de combate a incêndios
            florestais. Entre com suas credenciais para iniciar.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              onClick={() => login()}
              className="group h-14 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-9 text-base font-bold text-white shadow-[0_10px_40px_-10px_rgba(37,99,235,0.8)] ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-8px_rgba(37,99,235,0.9)]"
            >
              Acessar Sistema
              <ArrowUpRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="border-t border-white/10 bg-[#050912] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/icone_fortivus_oficial.png"
              alt="Fortivus"
              className="h-7 w-7 object-contain"
            />
            <span className="text-sm font-bold tracking-tight font-display">
              FORTIVUS
            </span>
          </div>
          <p className="text-sm text-blue-100/40">
            Sistema de Gestão de Combate a Incêndios Florestais
          </p>
        </div>
      </footer>
    </div>
  );
}
