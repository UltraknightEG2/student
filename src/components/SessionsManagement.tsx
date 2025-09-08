import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Calendar, Plus, Edit, Trash2, Search, Eye, X, Users, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, RotateCcw } from 'lucide-react';

export const SessionsManagement: React.FC = () => {
  const { sessions, classes, teachers, subjects, locations, grades, students, addSession, updateSession, deleteSession, toggleSessionStatus, getSessionStudents, addReport, updateReport, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState<string | null>(null);
  const [sessionStudents, setSessionStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showReportsForm, setShowReportsForm] = useState<{ show: boolean, sessionId: string, sessionName: string }>({ show: false, sessionId: '', sessionName: '' });
  const [studentReports, setStudentReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [sendingReports, setSendingReports] = useState<string | null>(null);
  const [reportsStatus, setReportsStatus] = useState<{ [sessionId: string]: any }>({});
  const [formData, setFormData] = useState({
    classId: '',
    locationId: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as const,
    notes: ''
  });

  // جلب حالة التقارير لجميع الحصص
  const fetchReportsStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reports/session-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        const statusMap: { [sessionId: string]: any } = {};
        
        (result.data || []).forEach((status: any) => {
          statusMap[status.session_id] = status;
        });
        
        setReportsStatus(statusMap);
      }
    } catch (error) {
      console.error('خطأ في جلب حالة التقارير:', error);
    }
  };

  // تحميل حالة التقارير عند بدء الصفحة
  useEffect(() => {
    fetchReportsStatus();
  }, []);

  // دالة لعرض حالة إرسال التقارير
  const getReportStatusDisplay = (sessionId: string) => {
    const status = reportsStatus[sessionId];
    
    if (!status) {
      return {
        icon: Clock,
        text: 'في الانتظار',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      };
    }

    switch (status.status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'في الانتظار',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
      case 'sending':
        return {
          icon: RotateCcw,
          text: 'جاري الإرسال',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'sent':
        return {
          icon: CheckCircle,
          text: 'تم الإرسال',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'failed':
        return {
          icon: XCircle,
          text: 'فشل الإرسال',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      case 'partial_failed':
        return {
          icon: AlertTriangle,
          text: 'إرسال جزئي',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      default:
        return {
          icon: Clock,
          text: 'في الانتظار',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  // دالة لعرض تفاصيل حالة التقارير
  const getReportStatusDetails = (sessionId: string) => {
    const status = reportsStatus[sessionId];
    
    if (!status) {
      return 'لم يتم إرسال تقارير بعد';
    }

    const total = status.total_students || 0;
    const success = status.successful_sends || 0;
    const failed = status.failed_sends || 0;
    
    switch (status.status) {
      case 'sent':
        return `تم الإرسال لجميع الطلاب (${success}/${total})`;
      case 'partial_failed':
        return `نجح: ${success} | فشل: ${failed} من أصل ${total}`;
      case 'failed':
        return `فشل الإرسال لجميع الطلاب (${total})`;
      case 'sending':
        return `جاري الإرسال... (${success}/${total})`;
      default:
        return 'لم يتم إرسال تقارير بعد';
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // حساب البيانات للصفحة الحالية
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = {
        classId: formData.classId,
        locationId: formData.locationId || null,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        status: formData.status,
        notes: formData.notes || null
      };

      if (editingSession) {
        await updateSession(editingSession, sessionData);
        setEditingSession(null);
      } else {
        await addSession(sessionData);
      }
      
      resetForm();
      // تحديث حالة التقارير بعد إضافة/تعديل جلسة
      await fetchReportsStatus();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('حدث خطأ أثناء حفظ الجلسة');
    }
  };

  const handleEdit = (session: any) => {
    setEditingSession(session.id);
    setFormData({
      classId: session.classId,
      locationId: session.locationId || '',
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: new Date(session.endTime).toISOString().slice(0, 16),
      status: session.status,
      notes: session.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الجلسة؟ سيتم حذف جميع سجلات الحضور والتقارير المرتبطة بها.')) {
      try {
        await deleteSession(id);
        // تحديث حالة التقارير بعد الحذف
        await fetchReportsStatus();
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('حدث خطأ أثناء حذف الجلسة');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleSessionStatus(id);
      // تحديث حالة التقارير بعد تغيير الحالة
      await fetchReportsStatus();
    } catch (error) {
      console.error('Error toggling session status:', error);
      alert('حدث خطأ أثناء تغيير حالة الجلسة');
    }
  };

  const handleShowDetails = async (sessionId: string) => {
    setShowSessionDetails(sessionId);
    setLoadingStudents(true);
    try {
      const students = await getSessionStudents(sessionId);
      setSessionStudents(students);
    } catch (error) {
      console.error('Error loading session students:', error);
      setSessionStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleShowReports = async (sessionId: string, sessionName: string) => {
    setShowReportsForm({ show: true, sessionId, sessionName });
    setLoadingReports(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/sessions/${sessionId}/reports`);
      if (response.ok) {
        const result = await response.json();
        setStudentReports(result.data || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setStudentReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSaveReport = async (studentId: string, reportData: any) => {
    try {
      const existingReport = studentReports.find(r => r.student_id === studentId);
      
      if (existingReport) {
        await updateReport(existingReport.id, reportData);
      } else {
        await addReport({
          studentId,
          sessionId: showReportsForm.sessionId,
          ...reportData
        });
      }
      
      // إعادة تحميل التقارير
      await handleShowReports(showReportsForm.sessionId, showReportsForm.sessionName);
    } catch (error) {
      console.error('Error saving report:', error);
      alert('حدث خطأ أثناء حفظ التقرير');
    }
  };

  const handleSendReports = async (sessionId: string) => {
    if (!window.confirm('هل أنت متأكد من إرسال تقارير هذه الجلسة عبر الواتساب؟')) {
      return;
    }

    setSendingReports(sessionId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/whatsapp/send-session-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('تم بدء إرسال التقارير بنجاح! يمكنك متابعة الحالة في صفحة "حالة التقارير"');
        // تحديث حالة التقارير فوراً
        await fetchReportsStatus();
      } else {
        alert(`فشل في إرسال التقارير: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending reports:', error);
      alert('حدث خطأ أثناء إرسال التقارير');
    } finally {
      setSendingReports(null);
    }
  };

  const resetForm = () => {
    setFormData({
      classId: '',
      locationId: '',
      startTime: '',
      endTime: '',
      status: 'scheduled',
      notes: ''
    });
    setEditingSession(null);
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدولة';
      case 'active': return 'نشطة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 ml-2" />
          إدارة الحصص
        </h1>
        {hasPermission('sessionsEdit') && (
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة جلسة
        </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingSession ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المجموعة *
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المجموعة</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المكان
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المكان</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} {location.roomNumber && `- ${location.roomNumber}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وقت البداية *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وقت النهاية *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">مجدولة</option>
                  <option value="active">نشطة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ملاحظات اختيارية..."
                />
              </div>
              
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingSession ? 'حفظ التغييرات' : 'إضافة الجلسة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الجلسة */}
      {showSessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            {(() => {
              const session = sessions.find(s => s.id === showSessionDetails);
              if (!session) return null;
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">تفاصيل الجلسة</h2>
                    <button
                      onClick={() => setShowSessionDetails(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">المجموعة</h3>
                      <p className="text-blue-700">{session.className}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900">المعلم</h3>
                      <p className="text-green-700">{session.teacherName || 'غير محدد'}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-900">المادة</h3>
                      <p className="text-purple-700">{session.subjectName || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">قائمة الطلاب ({sessionStudents.length})</h3>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleShowReports(session.id, session.className || 'جلسة')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        إدارة التقييمات
                      </button>
                      <button
                        onClick={() => handleSendReports(session.id)}
                        disabled={sendingReports === session.id}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sendingReports === session.id ? 'جاري الإرسال...' : 'إرسال التقارير'}
                      </button>
                    </div>
                  </div>
                  
                  {loadingStudents ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-500">جاري تحميل الطلاب...</p>
                    </div>
                  ) : sessionStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">حالة الحضور</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">التقييم</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sessionStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{student.barcode}</td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  student.attendanceStatus === 'present' ? 'bg-green-100 text-green-800' :
                                  student.attendanceStatus === 'absent' ? 'bg-red-100 text-red-800' :
                                  student.attendanceStatus === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                  student.attendanceStatus === 'excused' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {student.attendanceStatus === 'present' ? 'حاضر' :
                                   student.attendanceStatus === 'absent' ? 'غائب' :
                                   student.attendanceStatus === 'late' ? 'متأخر' :
                                   student.attendanceStatus === 'excused' ? 'معذور' : 'غير محدد'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {student.teacherRating ? (
                                  <span className="text-green-600">تم التقييم</span>
                                ) : (
                                  <span className="text-gray-400">لم يتم التقييم</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>لا يوجد طلاب في هذه الجلسة</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* نافذة إدارة التقييمات */}
      {showReportsForm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">إدارة التقييمات - {showReportsForm.sessionName}</h2>
              <button
                onClick={() => setShowReportsForm({ show: false, sessionId: '', sessionName: '' })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {loadingReports ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">جاري تحميل التقييمات...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الطالب</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">تقييم المعلم</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">درجة التسميع</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">درجة الاختبار</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المشاركة</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">السلوك</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الواجب</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">التعليقات</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessionStudents.map((student) => {
                      const existingReport = studentReports.find(r => r.student_id === student.id);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                          <td className="px-4 py-2">
                            <select
                              value={existingReport?.teacher_rating || ''}
                              onChange={(e) => handleSaveReport(student.id, { teacherRating: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="">اختر</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={existingReport?.recitation_score || ''}
                              onChange={(e) => handleSaveReport(student.id, { recitationScore: parseInt(e.target.value) || null })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              placeholder="0-10"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={existingReport?.quiz_score || ''}
                              onChange={(e) => handleSaveReport(student.id, { quizScore: parseInt(e.target.value) || null })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              placeholder="0-100"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={existingReport?.participation || ''}
                              onChange={(e) => handleSaveReport(student.id, { participation: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="">اختر</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={existingReport?.behavior || ''}
                              onChange={(e) => handleSaveReport(student.id, { behavior: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="">اختر</option>
                              <option value="ممتاز">ممتاز</option>
                              <option value="جيد جداً">جيد جداً</option>
                              <option value="جيد">جيد</option>
                              <option value="مقبول">مقبول</option>
                              <option value="ضعيف">ضعيف</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={existingReport?.homework || ''}
                              onChange={(e) => handleSaveReport(student.id, { homework: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="">اختر</option>
                              <option value="completed">مكتمل</option>
                              <option value="partial">جزئي</option>
                              <option value="incomplete">غير مكتمل</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={existingReport?.comments || ''}
                              onChange={(e) => handleSaveReport(student.id, { comments: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              placeholder="تعليقات..."
                            />
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleSaveReport(student.id, {})}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              حفظ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* البحث والفلترة */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن جلسة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="active">نشطة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>
      </div>

      {/* قائمة الجلسات */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="desktop-table">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المجموعة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المعلم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ والوقت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حالة إرسال التقارير</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSessions.map((session) => {
                  const reportStatusDisplay = getReportStatusDisplay(session.id);
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {session.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.teacherName || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.subjectName || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(session.startTime).toLocaleDateString('en-GB')}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(session.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(session.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <reportStatusDisplay.icon className={`h-4 w-4 ${reportStatusDisplay.color} ${session.id === sendingReports ? 'animate-spin' : ''}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportStatusDisplay.bgColor} ${reportStatusDisplay.color}`}>
                            {reportStatusDisplay.text}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getReportStatusDetails(session.id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleShowDetails(session.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {hasPermission('sessionsEdit') && (
                          <button
                            onClick={() => handleEdit(session)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          )}
                          {hasPermission('whatsapp') && (
                          <button
                            onClick={() => handleSendReports(session.id)}
                            disabled={sendingReports === session.id}
                            className="text-purple-600 hover:text-purple-900 p-1 disabled:opacity-50"
                            title="إرسال التقارير"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          )}
                          {hasPermission('sessionsDelete') && (
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* عرض بطاقات للموبايل */}
          <div className="mobile-cards">
            {currentSessions.map((session) => {
              const reportStatusDisplay = getReportStatusDisplay(session.id);
              return (
                <div key={session.id} className="mobile-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-title">{session.className}</div>
                    <div className="mobile-btn-group">
                      <button
                        onClick={() => handleShowDetails(session.id)}
                        className="mobile-btn text-blue-600 hover:text-blue-900"
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {hasPermission('sessionsEdit') && (
                      <button
                        onClick={() => handleEdit(session)}
                        className="mobile-btn text-green-600 hover:text-green-900"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      )}
                      {hasPermission('whatsapp') && (
                      <button
                        onClick={() => handleSendReports(session.id)}
                        disabled={sendingReports === session.id}
                        className="mobile-btn text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        title="إرسال التقارير"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      )}
                      {hasPermission('sessionsDelete') && (
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="mobile-btn text-red-600 hover:text-red-900"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mobile-card-content">
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">المعلم</div>
                      <div className="mobile-card-value">{session.teacherName || 'غير محدد'}</div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">المادة</div>
                      <div className="mobile-card-value">{session.subjectName || 'غير محدد'}</div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">التاريخ والوقت</div>
                      <div className="mobile-card-value">
                        <div>{new Date(session.startTime).toLocaleDateString('en-GB')}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(session.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">الحالة</div>
                      <div className="mobile-card-value">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">حالة إرسال التقارير</div>
                      <div className="mobile-card-value">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <reportStatusDisplay.icon className={`h-4 w-4 ${reportStatusDisplay.color} ${session.id === sendingReports ? 'animate-spin' : ''}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportStatusDisplay.bgColor} ${reportStatusDisplay.color}`}>
                            {reportStatusDisplay.text}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getReportStatusDetails(session.id)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="mr-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{startIndex + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredSessions.length)}</span> من{' '}
                  <span className="font-medium">{filteredSessions.length}</span> نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filteredSessions.length === 0 ? 'لا توجد جلسات مطابقة للبحث' : 'لا توجد بيانات في هذه الصفحة'}
          </p>
        </div>
      )}
    </div>
  );
};