import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  IdCard, 
  Calendar, 
  MapPin, 
  Phone, 
  User,
  QrCode,
  Download,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { StudentWithCard } from '../../../server/src/schema';

interface StudentCardProps {
  studentData: StudentWithCard;
  onCreateCard: (studentId: number) => void;
}

export function StudentCard({ studentData, onCreateCard }: StudentCardProps) {
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { student, card } = studentData;

  const handleCreateCard = async () => {
    setIsCreatingCard(true);
    setError(null);
    setSuccess(null);

    try {
      // Set validity period to 1 year from now
      const masaBerlaku = new Date();
      masaBerlaku.setFullYear(masaBerlaku.getFullYear() + 1);

      await trpc.createStudentCard.mutate({
        student_id: student.id,
        masa_berlaku: masaBerlaku
      });

      setSuccess('✅ Kartu pelajar berhasil dibuat!');
      onCreateCard(student.id);
    } catch (error) {
      console.error('Failed to create student card:', error);
      setError('Gagal membuat kartu pelajar. Silakan coba lagi.');
    } finally {
      setIsCreatingCard(false);
    }
  };

  const handleDownloadCard = () => {
    // In a real implementation, this would generate a PDF or image
    // For now, we'll simulate the download
    alert('🖨️ Fitur download kartu akan segera tersedia!');
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'LAKI_LAKI' ? '👨' : '👩';
  };

  const getReligionIcon = (religion: string) => {
    const icons: { [key: string]: string } = {
      'ISLAM': '☪️',
      'KRISTEN': '✝️',
      'KATOLIK': '⛪',
      'HINDU': '🕉️',
      'BUDDHA': '☸️',
      'KONGHUCU': '☯️'
    };
    return icons[religion] || '📿';
  };

  if (!card) {
    return (
      <div className="space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IdCard className="h-5 w-5" />
              <span>🎫 Pembuatan Kartu Pelajar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <IdCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Kartu Pelajar Belum Dibuat
              </h3>
              <p className="text-gray-500 mb-6">
                Siswa <strong>{student.nama_lengkap}</strong> belum memiliki kartu pelajar.
                Klik tombol di bawah untuk membuat kartu baru.
              </p>
              
              {/* Student Preview */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Data Siswa</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">NISN:</span>
                    <span>{student.nisn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama:</span>
                    <span>{getGenderIcon(student.jenis_kelamin)} {student.nama_lengkap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TTL:</span>
                    <span>{student.tempat_lahir}, {student.tanggal_lahir.toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agama:</span>
                    <span>{getReligionIcon(student.agama)} {student.agama}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateCard} 
                disabled={isCreatingCard}
                size="lg"
                className="px-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreatingCard ? 'Membuat Kartu...' : '🎫 Buat Kartu Pelajar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCardExpired = new Date() > card.masa_berlaku;

  return (
    <div className="space-y-6">
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

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">🎫 Kartu Pelajar</h2>
        <Button onClick={handleDownloadCard} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          📥 Download Kartu
        </Button>
      </div>

      {/* Student ID Card Preview */}
      <div className="max-w-2xl mx-auto">
        <Card className={`relative overflow-hidden ${isCardExpired ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
          {/* Card Header with School Info */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">🏫 KARTU PELAJAR</h2>
              <h3 className="text-lg font-semibold">SMA NEGERI CONTOH</h3>
              <p className="text-sm opacity-90">Jl. Pendidikan No. 123, Kota Contoh</p>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Student Photo */}
              <div className="flex justify-center md:justify-start">
                <div className="w-32 h-40 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                  {student.foto_siswa ? (
                    <img 
                      src={student.foto_siswa} 
                      alt={student.nama_lengkap}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Foto Siswa</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Information */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">NIS</Label>
                    <p className="text-lg font-bold text-blue-600">
                      {student.nis || 'Belum ada NIS'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Nama Lengkap</Label>
                    <p className="text-xl font-bold flex items-center space-x-2">
                      <span>{getGenderIcon(student.jenis_kelamin)}</span>
                      <span>{student.nama_lengkap}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">NISN</Label>
                      <p className="font-medium">{student.nisn}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">Agama</Label>
                      <p className="font-medium flex items-center space-x-1">
                        <span>{getReligionIcon(student.agama)}</span>
                        <span>{student.agama}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Tempat, Tanggal Lahir</Label>
                    <p className="font-medium flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{student.tempat_lahir}, {student.tanggal_lahir.toLocaleDateString('id-ID')}</span>
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Alamat</Label>
                    <p className="text-sm flex items-start space-x-1">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{student.alamat_jalan}, {student.alamat_desa}, {student.alamat_kecamatan}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Validity and QR Code */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Nomor Kartu</Label>
                    <p className="font-mono font-medium">{card.card_number}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Masa Berlaku</Label>
                    <div className="flex items-center space-x-2">
                      <p className={`font-medium ${isCardExpired ? 'text-red-600' : 'text-green-600'}`}>
                        {card.masa_berlaku.toLocaleDateString('id-ID')}
                      </p>
                      <Badge variant={isCardExpired ? 'destructive' : 'secondary'}>
                        {isCardExpired ? '❌ Kadaluarsa' : '✅ Aktif'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">QR Code</p>
                  <p className="text-xs text-gray-400 font-mono">{student.nisn}</p>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Kartu ini berlaku untuk tahun ajaran 2024/2025
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Status Info */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${card.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${card.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {card.is_active ? '✅ Aktif' : '❌ Tidak Aktif'}
                </span>
              </div>
              
              <div className="text-gray-500">
                Dibuat: {card.created_at.toLocaleDateString('id-ID')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Label component (in case it's not available)
function Label({ className = "", children, ...props }: React.ComponentProps<"label">) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}