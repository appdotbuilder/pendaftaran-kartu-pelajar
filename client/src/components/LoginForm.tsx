import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { LogIn, AlertCircle, UserPlus } from 'lucide-react';
import type { User, LoginInput } from '../../../server/src/schema';

interface LoginFormProps {
  onLogin: (user: User) => void;
  onShowRegistration?: () => void;
  successMessage?: string | null;
}

export function LoginForm({ onLogin, onShowRegistration, successMessage }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginInput>({
    username: '',
    password: ''
  });

  // Clear error when success message changes
  useEffect(() => {
    if (successMessage) {
      setError(null);
    }
  }, [successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await trpc.login.mutate(formData);
      if (user) {
        onLogin(user);
      } else {
        setError('Username atau password salah. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Username atau password salah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Masukkan username Anda"
          value={formData.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: LoginInput) => ({ ...prev, username: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Masukkan password Anda"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        <LogIn className="h-4 w-4 mr-2" />
        {isLoading ? 'Masuk...' : 'Masuk'}
      </Button>

      {onShowRegistration && (
        <div className="text-center">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={onShowRegistration}
            disabled={isLoading}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Daftar Akun Siswa Baru
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-gray-600 mt-4">
        <p className="mb-2">🔒 Demo Akun:</p>
        <div className="text-xs space-y-1">
          <p><strong>Admin:</strong> admin / password</p>
          <p><strong>Siswa:</strong> siswa / password</p>
          <p className="mt-2 text-xs text-gray-500">
            <em>Siswa baru akan mendapat username dan password sesuai NISN mereka</em>
          </p>
        </div>
      </div>
    </form>
  );
}