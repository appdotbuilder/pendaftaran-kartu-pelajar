import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Save, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import type { CreateStudentInput, Student } from '../../../server/src/schema';

interface StudentRegistrationFormProps {
  onStudentCreated: (student: Student) => void;
  isAdmin: boolean;
}

export function StudentRegistrationForm({ onStudentCreated, isAdmin }: StudentRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateStudentInput>({
    nisn: '',
    nama_lengkap: '',
    jenis_kelamin: 'LAKI_LAKI',
    tempat_lahir: '',
    tanggal_lahir: new Date(),
    alamat_jalan: '',
    alamat_dusun: null,
    alamat_desa: '',
    alamat_kecamatan: '',
    nomor_hp: '',
    agama: 'ISLAM',
    jumlah_saudara: 0,
    anak_ke: 1,
    tinggal_bersama: 'ORANG_TUA',
    asal_sekolah: '',
    foto_siswa: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newStudent = await trpc.createStudent.mutate(formData);
      onStudentCreated(newStudent);
      setSuccess('✅ Data siswa berhasil didaftarkan! Silakan lanjut ke pembuatan kartu pelajar.');
      
      // Reset form
      setFormData({
        nisn: '',
        nama_lengkap: '',
        jenis_kelamin: 'LAKI_LAKI',
        tempat_lahir: '',
        tanggal_lahir: new Date(),
        alamat_jalan: '',
        alamat_dusun: null,
        alamat_desa: '',
        alamat_kecamatan: '',
        nomor_hp: '',
        agama: 'ISLAM',
        jumlah_saudara: 0,
        anak_ke: 1,
        tinggal_bersama: 'ORANG_TUA',
        asal_sekolah: '',
        foto_siswa: null
      });
    } catch (error) {
      console.error('Failed to create student:', error);
      setError('Gagal mendaftarkan siswa. Pastikan NISN belum terdaftar sebelumnya.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, we would upload the file to a server
      // For now, we'll just store the filename as a placeholder
      const fakeUrl = `uploads/photos/${Date.now()}_${file.name}`;
      setFormData((prev: CreateStudentInput) => ({ 
        ...prev, 
        foto_siswa: fakeUrl 
      }));
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (value: string) => {
    setFormData((prev: CreateStudentInput) => ({
      ...prev,
      tanggal_lahir: new Date(value)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Data Identitas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Data Identitas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nisn">NISN (Nomor Induk Siswa Nasional) *</Label>
              <Input
                id="nisn"
                placeholder="1234567890"
                value={formData.nisn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, nisn: e.target.value }))
                }
                maxLength={10}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
              <Input
                id="nama_lengkap"
                placeholder="Nama lengkap siswa"
                value={formData.nama_lengkap}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, nama_lengkap: e.target.value }))
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenis_kelamin">Jenis Kelamin *</Label>
              <Select
                value={formData.jenis_kelamin}
                onValueChange={(value: 'LAKI_LAKI' | 'PEREMPUAN') =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, jenis_kelamin: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAKI_LAKI">👨 Laki-laki</SelectItem>
                  <SelectItem value="PEREMPUAN">👩 Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agama">Agama *</Label>
              <Select
                value={formData.agama}
                onValueChange={(value: any) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, agama: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ISLAM">☪️ Islam</SelectItem>
                  <SelectItem value="KRISTEN">✝️ Kristen</SelectItem>
                  <SelectItem value="KATOLIK">⛪ Katolik</SelectItem>
                  <SelectItem value="HINDU">🕉️ Hindu</SelectItem>
                  <SelectItem value="BUDDHA">☸️ Buddha</SelectItem>
                  <SelectItem value="KONGHUCU">☯️ Konghucu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempat_lahir">Tempat Lahir *</Label>
              <Input
                id="tempat_lahir"
                placeholder="Kota tempat lahir"
                value={formData.tempat_lahir}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, tempat_lahir: e.target.value }))
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal_lahir">Tanggal Lahir *</Label>
              <Input
                id="tanggal_lahir"
                type="date"
                value={formatDateForInput(formData.tanggal_lahir)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Alamat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🏠 Data Alamat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="alamat_jalan">Alamat Jalan *</Label>
              <Textarea
                id="alamat_jalan"
                placeholder="Jalan, RT/RW, No. rumah"
                value={formData.alamat_jalan}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, alamat_jalan: e.target.value }))
                }
                required
                disabled={isLoading}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat_dusun">Dusun (Opsional)</Label>
              <Input
                id="alamat_dusun"
                placeholder="Nama dusun"
                value={formData.alamat_dusun || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ 
                    ...prev, 
                    alamat_dusun: e.target.value || null 
                  }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat_desa">Desa/Kelurahan *</Label>
              <Input
                id="alamat_desa"
                placeholder="Nama desa/kelurahan"
                value={formData.alamat_desa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, alamat_desa: e.target.value }))
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat_kecamatan">Kecamatan *</Label>
              <Input
                id="alamat_kecamatan"
                placeholder="Nama kecamatan"
                value={formData.alamat_kecamatan}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, alamat_kecamatan: e.target.value }))
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomor_hp">Nomor HP/WA *</Label>
              <Input
                id="nomor_hp"
                placeholder="08123456789"
                value={formData.nomor_hp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, nomor_hp: e.target.value }))
                }
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Keluarga */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👨‍👩‍👧‍👦 Data Keluarga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jumlah_saudara">Jumlah Saudara</Label>
              <Input
                id="jumlah_saudara"
                type="number"
                min="0"
                value={formData.jumlah_saudara}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ 
                    ...prev, 
                    jumlah_saudara: parseInt(e.target.value) || 0 
                  }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anak_ke">Anak Ke- *</Label>
              <Input
                id="anak_ke"
                type="number"
                min="1"
                value={formData.anak_ke}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStudentInput) => ({ 
                    ...prev, 
                    anak_ke: parseInt(e.target.value) || 1 
                  }))
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tinggal_bersama">Tinggal Bersama *</Label>
              <Select
                value={formData.tinggal_bersama}
                onValueChange={(value: any) =>
                  setFormData((prev: CreateStudentInput) => ({ ...prev, tinggal_bersama: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORANG_TUA">👨‍👩‍👧‍👦 Orang Tua</SelectItem>
                  <SelectItem value="WALI">👤 Wali</SelectItem>
                  <SelectItem value="ASRAMA">🏠 Asrama</SelectItem>
                  <SelectItem value="KOST">🏡 Kost</SelectItem>
                  <SelectItem value="LAINNYA">📍 Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Pendidikan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎓 Data Pendidikan & Foto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asal_sekolah">Asal Sekolah Sebelumnya *</Label>
            <Input
              id="asal_sekolah"
              placeholder="Nama sekolah asal"
              value={formData.asal_sekolah}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateStudentInput) => ({ ...prev, asal_sekolah: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foto_siswa">Foto Siswa (Opsional)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="foto_siswa"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="file:mr-2 file:px-4 file:py-2 file:rounded-md file:border-0 file:text-sm file:font-medium"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            {formData.foto_siswa && (
              <p className="text-sm text-green-600">✅ Foto telah dipilih</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg" className="px-8">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Menyimpan...' : '💾 Daftar Siswa'}
        </Button>
      </div>
    </form>
  );
}