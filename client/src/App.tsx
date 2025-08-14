import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { LoginForm } from '@/components/LoginForm';
import { StudentRegistrationForm } from '@/components/StudentRegistrationForm';
import { StudentList } from '@/components/StudentList';
import { StudentCard } from '@/components/StudentCard';
import { GraduationCap, Users, IdCard, LogOut, UserCheck } from 'lucide-react';
import type { User, Student, StudentWithCard } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentCard, setStudentCard] = useState<StudentWithCard | null>(null);
  const [activeTab, setActiveTab] = useState('registration');

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

  // Login screen for unauthenticated users
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎓 Sistem Pendaftaran Ulang Siswa</h1>
            <p className="text-gray-600">Masuk untuk mengakses sistem pendaftaran dan kartu pelajar</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Masuk ke Sistem</CardTitle>
            </CardHeader>
            <CardContent>
              <LoginForm onLogin={handleLogin} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  🎓 Sistem Pendaftaran Ulang Siswa
                </h1>
                <p className="text-sm text-gray-500">
                  {currentUser.role === 'ADMIN' ? '👨‍💼 Admin Panel' : '👨‍🎓 Portal Siswa'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserCheck className="h-4 w-4" />
                <span>{currentUser.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="registration" className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>📝 Pendaftaran</span>
            </TabsTrigger>
            
            {currentUser.role === 'ADMIN' && (
              <TabsTrigger value="students" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>👥 Data Siswa</span>
              </TabsTrigger>
            )}
            
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>👤 Profil</span>
            </TabsTrigger>
            
            <TabsTrigger value="card" className="flex items-center space-x-2">
              <IdCard className="h-4 w-4" />
              <span>🎫 Kartu Pelajar</span>
            </TabsTrigger>
          </TabsList>

          {/* Student Registration Tab */}
          <TabsContent value="registration">
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
                  isAdmin={currentUser.role === 'ADMIN'}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students List Tab (Admin only) */}
          {currentUser.role === 'ADMIN' && (
            <TabsContent value="students">
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
            </TabsContent>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile">
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
                        {currentUser.username}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Role</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {currentUser.role === 'ADMIN' ? '👨‍💼 Administrator' : '👨‍🎓 Siswa'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Terdaftar Sejak</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {currentUser.created_at.toLocaleDateString('id-ID', {
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
          </TabsContent>

          {/* Student Card Tab */}
          <TabsContent value="card">
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
                    {currentUser.role === 'ADMIN' && (
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;