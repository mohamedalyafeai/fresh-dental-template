// Arabic translations for admin pages
export const ar = {
  // Common
  common: {
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'تم بنجاح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    search: 'بحث',
    refresh: 'تحديث',
    back: 'رجوع',
    signOut: 'تسجيل الخروج',
    you: 'أنت',
    noData: 'لا توجد بيانات',
  },

  // Staff Management
  staff: {
    title: 'إدارة الموظفين',
    subtitle: 'إدارة الأطباء والمرضى',
    totalUsers: 'إجمالي المستخدمين',
    doctorsAdmins: 'الأطباء/المشرفين',
    patients: 'المرضى',
    allUsers: 'جميع المستخدمين',
    manageRoles: 'إدارة أدوار المستخدمين والصلاحيات',
    searchPlaceholder: 'البحث بالاسم أو البريد الإلكتروني...',
    user: 'المستخدم',
    role: 'الدور',
    joined: 'تاريخ الانضمام',
    actions: 'الإجراءات',
    noName: 'بدون اسم',
    doctorAdmin: 'طبيب/مشرف',
    patient: 'مريض',
    promoteToDoctor: 'ترقية إلى طبيب',
    demoteToPatient: 'تخفيض إلى مريض',
    noUsersFound: 'لم يتم العثور على مستخدمين',
    noUsersSearch: 'لم يتم العثور على مستخدمين مطابقين للبحث',
    
    // Confirm dialogs
    promoteTitle: 'ترقية إلى طبيب/مشرف؟',
    demoteTitle: 'تخفيض إلى مريض؟',
    promoteDescription: 'سيمنح هذا صلاحيات المشرف لإدارة المواعيد والمرضى والموظفين.',
    demoteDescription: 'سيزيل هذا صلاحيات المشرف. سيكون لديه فقط صلاحيات المريض.',
    promote: 'ترقية',
    demote: 'تخفيض',
    
    // Toast messages
    userPromoted: 'تمت ترقية المستخدم',
    userDemoted: 'تم تخفيض المستخدم',
    isNowDoctor: 'أصبح الآن طبيب/مشرف',
    isNowPatient: 'أصبح الآن مريض',
    cannotDemoteSelf: 'لا يمكنك تخفيض نفسك',
    cannotDemoteSelfDesc: 'لا يمكنك إزالة صلاحيات المشرف الخاصة بك.',
    errorPromoting: 'فشل في ترقية المستخدم',
    errorDemoting: 'فشل في تخفيض المستخدم',
    errorLoading: 'فشل في تحميل المستخدمين',

    // Doctor selection
    selectDoctor: 'اختيار الطبيب',
    assignedDoctor: 'الطبيب المعالج',
    doctorsList: 'قائمة الأطباء',
    noDoctors: 'لا يوجد أطباء متاحين',
  },

  // Activity Log
  activity: {
    title: 'سجل النشاطات',
    subtitle: 'متابعة جميع التغييرات على أدوار المستخدمين',
    noActivities: 'لا توجد نشاطات مسجلة بعد',
    promote: 'ترقية',
    demote: 'تخفيض',
    promotedTo: 'قام بترقية',
    demotedTo: 'قام بتخفيض',
    toDoctor: 'إلى طبيب/مشرف',
    toPatient: 'إلى مريض',
  },

  // Admin Dashboard
  admin: {
    title: 'لوحة التحكم',
    subtitle: 'إدارة المواعيد وقائمة الانتظار',
    staffManagement: 'إدارة الموظفين',
    total: 'الإجمالي',
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    waitlist: 'قائمة الانتظار',
    appointments: 'المواعيد',
    patients: 'المرضى',
    analytics: 'التحليلات',
    patientHistory: 'سجل المريض',
    
    // Filters
    allServices: 'جميع الخدمات',
    clearFilters: 'مسح الفلاتر',
    filterByDate: 'تصفية حسب التاريخ',
    filterByService: 'تصفية حسب الخدمة',
    listView: 'عرض قائمة',
    calendarView: 'عرض تقويم',
    
    // Appointments table
    patientName: 'اسم المريض',
    service: 'الخدمة',
    dateTime: 'التاريخ والوقت',
    status: 'الحالة',
    noAppointments: 'لا توجد مواعيد',
    
    // Status options
    statusPending: 'قيد الانتظار',
    statusConfirmed: 'مؤكد',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغي',
    
    // Actions
    reschedule: 'إعادة جدولة',
    deleteAppointment: 'حذف الموعد',
    updateStatus: 'تحديث الحالة',
    sendReminder: 'إرسال تذكير',
    notifyWaitlist: 'إبلاغ قائمة الانتظار',
    
    // Export
    exportCSV: 'تصدير CSV',
    exportPDF: 'تصدير PDF',
    printReport: 'طباعة التقرير',
    
    // Patient details
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    totalVisits: 'إجمالي الزيارات',
    lastVisit: 'آخر زيارة',
    upcomingAppointments: 'المواعيد القادمة',
    completedAppointments: 'المواعيد المكتملة',
    cancelledAppointments: 'المواعيد الملغية',
    doctorNotes: 'ملاحظات الطبيب',
    addNote: 'إضافة ملاحظة',
    appointmentHistory: 'سجل المواعيد',
  },

  // Services
  services: {
    generalCheckup: 'فحص عام',
    teethCleaning: 'تنظيف الأسنان',
    teethWhitening: 'تبييض الأسنان',
    dentalImplants: 'زراعة الأسنان',
    rootCanal: 'علاج الجذور',
    bracesOrthodontics: 'تقويم الأسنان',
  },

  // Doctor badges/specialties
  doctorBadges: {
    seniorDentist: 'طبيب أسنان أول',
    orthodontist: 'أخصائي تقويم',
    implantSpecialist: 'أخصائي زراعة',
    endodontist: 'أخصائي علاج الجذور',
    prosthodontist: 'أخصائي تركيبات',
    periodontist: 'أخصائي لثة',
    oralSurgeon: 'جراح الفم والوجه',
    generalDentist: 'طبيب أسنان عام',
    pediatricDentist: 'طبيب أسنان أطفال',
    cosmeticDentist: 'طبيب تجميل الأسنان',
  },
};

// English translations (for fallback)
export const en = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    refresh: 'Refresh',
    back: 'Back',
    signOut: 'Sign Out',
    you: 'You',
    noData: 'No data',
  },
  staff: {
    title: 'Staff Management',
    subtitle: 'Manage doctors and patients',
    totalUsers: 'Total Users',
    doctorsAdmins: 'Doctors/Admins',
    patients: 'Patients',
    allUsers: 'All Users',
    manageRoles: 'Manage User Roles & Permissions',
    searchPlaceholder: 'Search by name or email...',
    user: 'User',
    role: 'Role',
    joined: 'Joined',
    actions: 'Actions',
    noName: 'No Name',
    doctorAdmin: 'Doctor/Admin',
    patient: 'Patient',
    promoteToDoctor: 'Promote to Doctor',
    demoteToPatient: 'Demote to Patient',
    noUsersFound: 'No users found',
    noUsersSearch: 'No users found matching search',

    // Confirm dialogs
    promoteTitle: 'Promote to Doctor/Admin?',
    demoteTitle: 'Demote to Patient?',
    promoteDescription: 'This will grant admin privileges to manage appointments, patients, and staff.',
    demoteDescription: 'This will remove admin privileges. They will only have patient privileges.',
    promote: 'Promote',
    demote: 'Demote',

    // Toast messages
    userPromoted: 'User promoted',
    userDemoted: 'User demoted',
    isNowDoctor: 'is now a Doctor/Admin',
    isNowPatient: 'is now a Patient',
    cannotDemoteSelf: 'You cannot demote yourself',
    cannotDemoteSelfDesc: 'You cannot remove your own admin privileges.',
    errorPromoting: 'Failed to promote user',
    errorDemoting: 'Failed to demote user',
    errorLoading: 'Failed to load users',

    // Doctor selection
    selectDoctor: 'Select Doctor',
    assignedDoctor: 'Assigned Doctor',
    doctorsList: 'Doctors List',
    noDoctors: 'No doctors available',
  },
};

// Default to Arabic
export const t = ar;
