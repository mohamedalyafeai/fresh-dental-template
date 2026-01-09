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

  // Doctor Profile
  doctorProfile: {
    title: 'الملف الشخصي للطبيب',
    subtitle: 'تحديث معلوماتك وتخصصك',
    badgeNumber: 'رقم الشارة الطبية',
    doctorInfo: 'معلومات الطبيب',
    completeProfile: 'أكمل ملفك الشخصي ليظهر للمرضى عند حجز المواعيد',
    specialty: 'التخصص',
    selectSpecialty: 'اختر التخصص',
    yearsExperience: 'سنوات الخبرة',
    phone: 'رقم الهاتف',
    bio: 'نبذة عنك',
    bioPlaceholder: 'اكتب نبذة مختصرة عن خبراتك ومؤهلاتك...',
    availableForAppointments: 'متاح للمواعيد',
    availableDesc: 'عند التعطيل، لن يتمكن المرضى من اختيارك للمواعيد الجديدة',
    saveChanges: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
    backToDashboard: 'العودة للوحة التحكم',
    notDefined: 'غير محدد',
    myProfile: 'ملفي الشخصي',
  },

  // Realtime notifications
  realtime: {
    newAppointment: 'موعد جديد!',
    statusChanged: 'تغيير حالة الموعد',
    appointmentDeleted: 'تم حذف موعد',
  },

  // Doctor assignment
  doctorAssignment: {
    selectDoctor: 'اختر الطبيب المعالج',
    assignedDoctor: 'الطبيب المعالج',
    noDoctor: 'بدون طبيب محدد',
    noDoctorsAvailable: 'لا يوجد أطباء متاحين حالياً',
    loadingDoctors: 'جاري تحميل الأطباء...',
  },

  // Booking Modal
  booking: {
    title: 'حجز موعد',
    subtitle: 'احجز موعدك في خطوات بسيطة',
    
    // Services
    selectService: 'اختر الخدمة',
    services: {
      general: 'طب الأسنان العام',
      whitening: 'تبييض الأسنان',
      rootcanal: 'علاج قناة الجذر',
      emergency: 'الرعاية الطارئة',
      crowns: 'تيجان الأسنان',
      cosmetic: 'طب الأسنان التجميلي',
    },
    duration: 'دقيقة',
    
    // Date & Time
    selectDate: 'اختر التاريخ',
    pickDate: 'اختر تاريخاً',
    selectTime: 'اختر الوقت',
    checkingAvailability: 'جاري التحقق من التوفر...',
    noSlotsTitle: 'لا توجد مواعيد متاحة لهذا اليوم',
    noSlotsDescription: 'جميع المواعيد محجوزة. يمكنك الانضمام لقائمة الانتظار أو اختيار تاريخ آخر.',
    joinWaitlistButton: 'انضم لقائمة الانتظار',
    bookedSlotsNote: 'الأوقات المشطوبة محجوزة مسبقاً',
    
    // Patient Info
    yourInfo: 'معلوماتك',
    joinWaitlistTitle: 'الانضمام لقائمة الانتظار',
    waitlistNote: 'ستنضم لقائمة الانتظار ليوم {date}. سنتواصل معك عند توفر موعد.',
    fullName: 'الاسم الكامل',
    namePlaceholder: 'أحمد محمد',
    emailAddress: 'البريد الإلكتروني',
    emailPlaceholder: 'ahmed@example.com',
    phoneNumber: 'رقم الهاتف',
    phonePlaceholder: '(123) 456-7890',
    additionalNotes: 'ملاحظات إضافية (اختياري)',
    notesPlaceholder: 'أي مخاوف أو طلبات خاصة...',
    
    // Summary
    appointmentSummary: 'ملخص الموعد',
    waitlistRequest: 'طلب قائمة الانتظار',
    service: 'الخدمة:',
    date: 'التاريخ:',
    preferredDate: 'التاريخ المفضل:',
    time: 'الوقت:',
    
    // Buttons
    continue: 'متابعة',
    continueToWaitlist: 'متابعة للانضمام',
    back: 'رجوع',
    confirmBooking: 'تأكيد الحجز',
    joinWaitlist: 'انضم لقائمة الانتظار',
    booking: 'جاري الحجز...',
    joining: 'جاري الانضمام...',
    done: 'تم',
    
    // Confirmation
    appointmentConfirmed: 'تم تأكيد الموعد!',
    thankYou: 'شكراً لحجزكم مع برايت سمايل لطب الأسنان.',
    confirmationSent: 'تم إرسال رسالة تأكيد إلى {email}',
    
    // Waitlist Confirmation
    addedToWaitlist: 'تمت الإضافة لقائمة الانتظار!',
    willNotify: 'سنُعلمك عند توفر موعد.',
    willContact: 'سنتواصل معك على {email} عند توفر موعد.',
    
    // Toast messages
    slotUnavailable: 'الوقت غير متاح',
    slotJustBooked: 'تم حجز هذا الوقت للتو من شخص آخر. يرجى اختيار وقت مختلف.',
    bookingSuccess: 'تم حجز الموعد!',
    bookingSuccessDesc: 'تم إرسال رسالة تأكيد إليك.',
    bookingFailed: 'فشل الحجز',
    tryAgain: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    waitlistSuccess: 'تمت الإضافة لقائمة الانتظار!',
    waitlistSuccessDesc: 'سنتواصل معك عند توفر موعد.',
    waitlistFailed: 'فشل الانضمام لقائمة الانتظار',
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
