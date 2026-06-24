import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../lib/roles';
import { fetchWithAuth } from '../lib/api';
import { Save, Key, Camera, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/perfil')({
  component: PerfilPage,
});

function PerfilPage() {
  const { user, role, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageLoading(true);
      // Simulate image upload delay
      setTimeout(() => {
        setAvatarUrl(URL.createObjectURL(file));
        setImageLoading(false);
      }, 1500);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    // Validations
    if (formData.novaSenha) {
      if (!formData.senhaAtual) {
        alert('A senha atual é obrigatória para alterar a senha.');
        setLoading(false);
        return;
      }
      if (formData.novaSenha !== formData.confirmarSenha) {
        alert('A nova senha e a confirmação não coincidem.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        senhaAtual: formData.senhaAtual || null,
        novaSenha: formData.novaSenha || null,
      };

      await fetchWithAuth('/operacional/usuarios/perfil', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (formData.email !== user?.email) {
        alert('Seu e-mail foi atualizado com sucesso. Por motivos de segurança, você será desconectado e deverá fazer login novamente com o novo e-mail.');
        logout();
        return;
      }

      setSuccessMsg('Perfil atualizado com sucesso!');
      setFormData(prev => ({ ...prev, senhaAtual: '', novaSenha: '', confirmarSenha: '' }));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie suas informações pessoais e configurações de segurança.
          </p>
        </div>
        <Button variant="destructive" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" /> Sair da Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4 p-6 glass-strong rounded-xl border border-border/50">
          <div className="relative group cursor-pointer">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-background bg-secondary shadow-xl flex items-center justify-center relative">
              {imageLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-fire" />
                </div>
              ) : null}
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover transition-opacity duration-300" />
              ) : (
                <span className="text-4xl font-bold text-muted-foreground">
                  {user?.nome?.substring(0, 2).toUpperCase() || 'US'}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 h-10 w-10 bg-command hover:bg-command/90 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform group-hover:scale-110">
              <Camera className="h-5 w-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
          <div className="text-center">
            <h3 className="font-semibold">{user?.nome}</h3>
            <p className="text-xs text-muted-foreground mt-1">{role ? ROLE_LABELS[role] : ''}</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="glass-strong rounded-xl border border-border/50 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-border pb-2">Informações Básicas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input 
                    value={formData.nome} 
                    onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    className="bg-background/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium border-b border-border pb-2 flex items-center gap-2">
                <Key className="h-5 w-5 text-muted-foreground" /> Segurança
              </h3>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Senha Atual</label>
                  <Input 
                    type="password" 
                    placeholder="Necessário para alterar a senha"
                    value={formData.senhaAtual}
                    onChange={e => setFormData({ ...formData, senhaAtual: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nova Senha</label>
                    <Input 
                      type="password" 
                      value={formData.novaSenha}
                      onChange={e => setFormData({ ...formData, novaSenha: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirmar Senha</label>
                    <Input 
                      type="password" 
                      value={formData.confirmarSenha}
                      onChange={e => setFormData({ ...formData, confirmarSenha: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 rounded-md bg-success/10 text-success border border-success/20 text-sm flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                {successMsg}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" disabled={loading} className="gap-2 min-w-[140px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
