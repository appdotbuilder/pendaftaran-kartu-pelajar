import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { trpc } from '@/utils/trpc';
import { LoginForm } from '@/components/LoginForm';
import { StudentRegistrationForm } from '@/components/StudentRegistrationForm';
import { StudentList } from '@/components/StudentList';
import { StudentCard } from '@/components/StudentCard';
import { ApplicationProfile } from '@/components/ApplicationProfile';
import { 
  GraduationCap, 
  Users, 
  IdCard, 
  LogOut, 
  UserCheck, 
  Info 
} from 'lucide-react';
import type { User, Student, StudentWithCard } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentCard, setStudentCard] = useState<StudentWithCard | null>(null);
  const [activeTab, setActiveTab] = useState('registration');
  const [showPublicRegistration, setShowPublicRegistration] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  // Load students (admin only)
  const loadStudents = useCallback(async () => {
    if (currentUser?.role !== 'ADMIN') return;
    try {
      setIsLoading(true);
      const result = await trpc.getStudents.query({ limit: 100, offset: 0 });
      setStudents(result);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      loadStudents();
    }
  }, [currentUser, loadStudents]);

  const handleLogin = async (userData: User) => {
    setCurrentUser(userData);
    if (userData.role === 'ADMIN') {
      setActiveTab('students');
    } else {
      setActiveTab('profile');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStudents([]);
    setSelectedStudent(null);
    setStudentCard(null);
    setActiveTab('registration');
  };

  const handleStudentCreated = (newStudent: Student) => {
    setStudents((prev: Student[]) => [...prev, newStudent]);
  };

  const handlePublicRegistration = (newStudent: Student) => {
    setRegistrationSuccess(`Pendaftaran berhasil! Anda dapat masuk menggunakan NISN (${newStudent.nisn}) sebagai username dan password.`);
    setShowPublicRegistration(false);
  };

  const handleStudentUpdated = (updatedStudent: Student) => {
    setStudents((prev: Student[]) => 
      prev.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
  };

  const handleStudentDeleted = (deletedId: number) => {
    setStudents((prev: Student[]) => prev.filter(student => student.id !== deletedId));
    if (selectedStudent?.id === deletedId) {
      setSelectedStudent(null);
      setStudentCard(null);
    }
  };

  const handleViewCard = async (student: Student) => {
    try {
      setIsLoading(true);
      const cardData = await trpc.getStudentWithCard.query({ id: student.id });
      setStudentCard(cardData);
      setSelectedStudent(student);
      setActiveTab('card');
    } catch (error) {
      console.error('Failed to load student card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Menu items for the sidebar
  const menuItems = [
    {
      id: 'registration',
      label: '📝 Pendaftaran',
      icon: UserCheck,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>📝 Formulir Pendaftaran Ulang Siswa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudentRegistrationForm 
              onStudentCreated={handleStudentCreated}
              isAdmin={currentUser?.role === 'ADMIN'}
            />
          </CardContent>
        </Card>
      )
    },
    ...(currentUser?.role === 'ADMIN' ? [{
      id: 'students',
      label: '👥 Data Siswa',
      icon: Users,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>👥 Data Siswa Terdaftar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudentList
              students={students}
              onStudentUpdated={handleStudentUpdated}
              onStudentDeleted={handleStudentDeleted}
              onViewCard={handleViewCard}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )
    }] : []),
    {
      id: 'profile',
      label: '👤 Profil',
      icon: UserCheck,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>👤 Profil Pengguna</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {currentUser?.username}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {currentUser?.role === 'ADMIN' ? '👨‍💼 Administrator' : '👨‍🎓 Siswa'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Terdaftar Sejak</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {currentUser?.created_at.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'card',
      label: '🎫 Kartu Pelajar',
      icon: IdCard,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IdCard className="h-5 w-5" />
              <span>🎫 Kartu Pelajar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent && studentCard ? (
              <StudentCard 
                studentData={studentCard} 
                onCreateCard={(studentId) => {
                  console.log('Creating card for student:', studentId);
                  // Refresh card data after creation
                  handleViewCard(selectedStudent);
                }}
              />
            ) : (
              <div className="text-center py-12">
                <IdCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Pilih siswa dari daftar untuk melihat atau membuat kartu pelajar
                </p>
                {currentUser?.role === 'ADMIN' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('students')}
                  >
                    👥 Lihat Daftar Siswa
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )
    },
    {
      id: 'app-profile',
      label: 'ℹ️ Profil Aplikasi',
      icon: Info,
      component: <ApplicationProfile />
    }
  ];

  // Login screen for unauthenticated users
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎓 Sistem Pendaftaran Ulang Siswa</h1>
            <p className="text-gray-600">
              {showPublicRegistration ? 'Daftarkan akun siswa baru' : 'Masuk untuk mengakses sistem pendaftaran dan kartu pelajar'}
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {showPublicRegistration ? 'Pendaftaran Akun Siswa Baru' : 'Masuk ke Sistem'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showPublicRegistration ? (
                <div className="space-y-4">
                  <StudentRegistrationForm 
                    onStudentCreated={handlePublicRegistration}
                    isAdmin={false}
                  />
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowPublicRegistration(false);
                        setRegistrationSuccess(null);
                      }}
                    >
                      Kembali ke Login
                    </Button>
                  </div>
                </div>
              ) : (
                <LoginForm 
                  onLogin={handleLogin} 
                  onShowRegistration={() => setShowPublicRegistration(true)}
                  successMessage={registrationSuccess}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get the active menu item
  const activeMenuItem = menuItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Left Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                🎓 Sistem Siswa
              </h1>
              <p className="text-xs text-gray-500">
                {currentUser.role === 'ADMIN' ? '👨‍💼 Admin Panel' : '👨‍🎓 Portal Siswa'}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                      activeTab === item.id
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-3">
            <UserCheck className="h-5 w-5 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser.role === 'ADMIN' ? 'Administrator' : 'Siswa'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Main Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {activeMenuItem?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Sistem Pendaftaran Ulang Siswa dan Pembuatan Kartu Pelajar
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeMenuItem?.component || (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Pilih menu dari sidebar untuk memulai</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;