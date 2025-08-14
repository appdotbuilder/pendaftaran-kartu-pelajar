import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { LogIn, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import type { User, LoginInput } from '../../../server/src/schema';

interface AdminLoginFormProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

export function AdminLoginForm({ onLogin, onBack }: AdminLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginInput>({
    username: 'admin', // Pre-fill with default admin username
    password: ''
  });

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
        if (user.role !== 'ADMIN') {
          setError('Akun ini bukan akun administrator. Silakan gunakan akun admin yang valid.');
        } else {
          onLogin(user);
        }
      } else {
        setError('Username atau password salah. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      setError('Username atau password salah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">👨‍💼 Login Administrator</h2>
        <p className="text-gray-600">
          Masuk dengan akun administrator untuk mengelola data siswa dan sistem
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="admin-username">Username Administrator</Label>
          <Input
            id="admin-username"
            type="text"
            placeholder="Masukkan username admin"
            value={formData.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: LoginInput) => ({ ...prev, username: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            placeholder="Masukkan password admin"
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
          {isLoading ? 'Masuk...' : 'Masuk sebagai Admin'}
        </Button>

        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="text-center text-sm text-blue-800">
            <p className="mb-2">🔐 <strong>Kredensial Default Admin:</strong></p>
            <div className="text-sm font-mono bg-blue-100 p-2 rounded">
              <p><strong>Username:</strong> admin</p>
              <p><strong>Password:</strong> password</p>
            </div>
            <p className="mt-2 text-xs text-blue-600">
              <em>Gunakan kredensial di atas untuk akses administrator</em>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}