import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  IdCard, 
  Phone, 
  MapPin,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { Student } from '../../../server/src/schema';

interface StudentListProps {
  students: Student[];
  onStudentUpdated: (student: Student) => void;
  onStudentDeleted: (studentId: number) => void;
  onViewCard: (student: Student) => void;
  isLoading: boolean;
}

export function StudentList({ 
  students, 
  onStudentUpdated, 
  onStudentDeleted, 
  onViewCard, 
  isLoading 
}: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredStudents = students.filter((student: Student) =>
    student.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.nisn.includes(searchQuery) ||
    student.alamat_desa.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Yakin ingin menghapus data siswa ${student.nama_lengkap}?`)) {
      return;
    }

    setDeleteLoading(student.id);
    setError(null);
    setSuccess(null);

    try {
      await trpc.deleteStudent.mutate({ id: student.id });
      onStudentDeleted(student.id);
      setSuccess(`✅ Data siswa ${student.nama_lengkap} berhasil dihapus.`);
    } catch (error) {
      console.error('Failed to delete student:', error);
      setError('Gagal menghapus data siswa. Silakan coba lagi.');
    } finally {
      setDeleteLoading(null);
    }
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

  const getLivingWithIcon = (livingWith: string) => {
    const icons: { [key: string]: string } = {
      'ORANG_TUA': '👨‍👩‍👧‍👦',
      'WALI': '👤',
      'ASRAMA': '🏠',
      'KOST': '🏡',
      'LAINNYA': '📍'
    };
    return icons[livingWith] || '📍';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Memuat data siswa...</p>
      </div>
    );
  }

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

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Cari siswa</Label>
          <Input
            id="search"
            placeholder="🔍 Cari berdasarkan nama, NISN, atau desa..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <Badge variant="secondary">
          {filteredStudents.length} dari {students.length} siswa
        </Badge>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchQuery ? 'Tidak ada siswa yang sesuai dengan pencarian' : 'Belum ada siswa terdaftar'}
          </p>
          {searchQuery && (
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Hapus Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student: Student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{getGenderIcon(student.jenis_kelamin)}</span>
                      <span>{student.nama_lengkap}</span>
                      <Badge variant="outline">NISN: {student.nisn}</Badge>
                      {student.nis && (
                        <Badge variant="secondary">NIS: {student.nis}</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{student.tempat_lahir}, {student.tanggal_lahir.toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{getReligionIcon(student.agama)}</span>
                        <span>{student.agama}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCard(student)}
                    >
                      <IdCard className="h-3 w-3 mr-1" />
                      🎫 Kartu
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteStudent(student)}
                      disabled={deleteLoading === student.id}
                    >
                      {deleteLoading === student.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {/* Alamat */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 font-medium text-gray-700">
                      <MapPin className="h-3 w-3" />
                      <span>Alamat</span>
                    </div>
                    <p className="text-gray-600">{student.alamat_jalan}</p>
                    {student.alamat_dusun && (
                      <p className="text-gray-500 text-xs">Dusun: {student.alamat_dusun}</p>
                    )}
                    <p className="text-gray-500 text-xs">
                      {student.alamat_desa}, {student.alamat_kecamatan}
                    </p>
                  </div>

                  {/* Kontak */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 font-medium text-gray-700">
                      <Phone className="h-3 w-3" />
                      <span>Kontak</span>
                    </div>
                    <p className="text-gray-600">{student.nomor_hp}</p>
                  </div>

                  {/* Data Keluarga */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 font-medium text-gray-700">
                      <Users className="h-3 w-3" />
                      <span>Keluarga</span>
                    </div>
                    <p className="text-gray-600">
                      Anak ke-{student.anak_ke} dari {student.jumlah_saudara + 1} bersaudara
                    </p>
                    <p className="text-gray-500 text-xs flex items-center space-x-1">
                      <span>{getLivingWithIcon(student.tinggal_bersama)}</span>
                      <span>{student.tinggal_bersama.replace('_', ' ').toLowerCase()}</span>
                    </p>
                  </div>

                  {/* Asal Sekolah */}
                  <div className="space-y-1 md:col-span-2 lg:col-span-3">
                    <div className="font-medium text-gray-700">🎓 Asal Sekolah</div>
                    <p className="text-gray-600">{student.asal_sekolah}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      Terdaftar: {student.created_at.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}