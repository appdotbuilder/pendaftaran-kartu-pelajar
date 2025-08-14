import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, Code, Calendar, Shield, Users, IdCard } from 'lucide-react';

export function ApplicationProfile() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span>ℹ️ Informasi Aplikasi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg">
              <GraduationCap className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Sistem Pendaftaran Ulang Siswa dan Pembuatan Kartu Pelajar
              </h2>
              <Badge variant="secondary" className="text-sm">
                Versi 1.0
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>Dikembangkan oleh</span>
                </h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">
                  Tim Pengembangan Sistem Sekolah
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Tanggal Rilis</span>
                </h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">
                  Januari 2024
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>🎯 Fitur Utama</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span>📝 Pendaftaran Ulang Siswa</span>
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Formulir pendaftaran lengkap</li>
                  <li>• Data pribadi dan alamat siswa</li>
                  <li>• Upload foto siswa</li>
                  <li>• Validasi NISN otomatis</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                  <IdCard className="h-4 w-4 text-blue-600" />
                  <span>🎫 Pembuatan Kartu Pelajar</span>
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Kartu pelajar digital</li>
                  <li>• QR Code dengan NISN siswa</li>
                  <li>• Masa berlaku kartu otomatis</li>
                  <li>• Cetak kartu dalam format PDF</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>👥 Manajemen Pengguna</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">👨‍💼 Admin Sekolah</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Kelola data siswa</li>
                  <li>• Buat dan cetak kartu pelajar</li>
                  <li>• Akses semua fitur administrasi</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">👨‍🎓 Siswa</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Lihat profil pribadi</li>
                  <li>• Akses kartu pelajar digital</li>
                  <li>• Update data minimal</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>🔒 Keamanan Sistem</span>
            </h3>
            <p className="text-sm text-amber-800">
              Sistem menggunakan otentikasi berbasis peran dengan enkripsi password menggunakan teknologi hash modern. 
              Setiap siswa mendapatkan akun otomatis dengan username dan password sesuai NISN mereka.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}