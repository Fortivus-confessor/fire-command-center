import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Map, Route, TreePine, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center text-white relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2196F3]/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Main Content */}
      <div className="max-w-4xl w-full px-6 text-center space-y-12">
        
        {/* Logo and Title */}
        <div className="space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-500 blur-3xl opacity-20 rounded-full animate-pulse" />
            <div className="relative">
              <img src="/icone_fortivus_oficial.png" alt="Fortivus Logo" className="w-40 h-40 object-contain drop-shadow-2xl" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight font-display">
              FORTIVUS
            </h1>
            <p className="text-xl sm:text-2xl text-blue-200/60 font-medium tracking-wide">
              Gestão de Combate a Incêndios Florestais
            </p>
          </div>
        </div>

        {/* Feature Icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/5">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 bg-orange-500/10 rounded-2xl ring-1 ring-orange-500/20 text-orange-500">
              <Flame className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium text-orange-200/70">Incêndios</span>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 bg-[#2196F3]/10 rounded-2xl ring-1 ring-[#2196F3]/20 text-[#2196F3]">
              <Map className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium text-blue-200/70">Tecnologia</span>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 bg-[#22C55E]/10 rounded-2xl ring-1 ring-[#22C55E]/20 text-[#22C55E]">
              <TreePine className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium text-green-200/70">Proteção Ambiental</span>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 bg-[#2196F3]/10 rounded-2xl ring-1 ring-[#2196F3]/20 text-[#2196F3]">
              <Route className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium text-blue-200/70">Despacho de Campo</span>
          </div>
        </div>

        {/* Login Action */}
        <div className="pt-4">
          <Button 
            size="lg" 
            onClick={() => login()}
            className="h-14 px-10 text-lg font-bold tracking-wide bg-gradient-to-r from-blue-600 to-[#0F172A] hover:from-blue-500 hover:to-[#1E293B] border border-blue-500/30 text-white shadow-[0_0_20px_rgba(33,150,243,0.3)] hover:shadow-[0_0_30px_rgba(33,150,243,0.5)] transition-all duration-300 hover:-translate-y-1"
          >
            Acessar Sistema
          </Button>
          <p className="mt-6 text-sm text-white/30">
            Acesso restrito a usuários autorizados do sistema FORTIVUS.
          </p>
        </div>

      </div>
    </div>
  );
}
