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
  // Hero Section
  hero: {
    trustedBadge: 'موثوق من 10,000+ مريض',
    title: 'ابتسامتك تستحق',
    titleHighlight: 'رعاية متخصصة',
    subtitle: 'استمتع برعاية أسنان استثنائية في بيئة مريحة وحديثة. فريقنا من المتخصصين مكرس لمنحك الابتسامة الصحية والجميلة التي تستحقها.',
    bookAppointment: 'احجز موعداً',
    learnMore: 'اعرف المزيد',
    rating: 'تقييم 4.9',
    reviews: '500+ تقييم',
    years: '20+ سنة',
    experience: 'خبرة',
    certified: 'معتمد',
    specialists: 'متخصصون',
  },

  // About Section
  about: {
    badge: 'من نحن',
    title: 'تعرف على',
    titleHighlight: 'فريقنا المتخصص',
    subtitle: 'في برايت سمايل للأسنان، نجمع بين أحدث التقنيات والرعاية الحانية. فريقنا من المحترفين ذوي الخبرة مكرس لجعل كل زيارة مريحة وفعالة.',
    
    // Team members
    doctor1Name: 'د. مايكل روبرتس',
    doctor1Role: 'طبيب أسنان رئيسي ومؤسس',
    doctor1Desc: '20+ سنة خبرة في طب الأسنان الترميمي والتجميلي.',
    doctor2Name: 'د. سارة ميتشل',
    doctor2Role: 'أخصائية تقويم',
    doctor2Desc: 'متخصصة في إنفزلاين والتقويم التقليدي.',
    doctor3Name: 'إيما جونسون',
    doctor3Role: 'أخصائية صحة الأسنان',
    doctor3Desc: 'شغوفة بالرعاية الوقائية وتثقيف المرضى.',
    
    // Specialties
    implants: 'زراعة',
    cosmetic: 'تجميل',
    invisalign: 'إنفزلاين',
    braces: 'تقويم',
    cleaning: 'تنظيف',
    prevention: 'وقاية',
    
    // Stats
    happyPatients: 'مرضى سعداء',
    yearsExperience: 'سنوات الخبرة',
    expertStaff: 'فريق متخصص',
    satisfactionRate: 'نسبة الرضا',
    
    // Mission
    missionTitle: 'رسالتنا',
    missionPara1: 'نؤمن بأن الجميع يستحق الوصول إلى رعاية أسنان عالية الجودة. مهمتنا هي تقديم علاج استثنائي ومخصص في بيئة دافئة ومرحبة.',
    missionPara2: 'من التنظيف الروتيني إلى الإجراءات المعقدة، نستخدم أحدث التقنيات والأساليب لضمان أفضل النتائج الممكنة لمرضانا.',
    
    // Features
    feature1: 'معدات متطورة',
    feature2: 'بيئة مريحة',
    feature3: 'خطط علاج مخصصة',
    feature4: 'جدولة مرنة',
  },

  // Footer
  footer: {
    ctaTitle: 'هل أنت مستعد لابتسامة أفضل؟',
    ctaSubtitle: 'احجز موعدك اليوم واتخذ الخطوة الأولى نحو ابتسامة أكثر صحة وثقة.',
    bookAppointment: 'احجز موعداً',
    callNow: 'اتصل الآن',
    
    // Brand
    brandDesc: 'نقدم رعاية أسنان استثنائية للعائلة بأكملها منذ 2003. ابتسامتك هي أولويتنا.',
    
    // Quick Links
    quickLinks: 'روابط سريعة',
    home: 'الرئيسية',
    aboutUs: 'من نحن',
    servicesLink: 'الخدمات',
    bookNow: 'احجز الآن',
    
    // Services
    servicesTitle: 'الخدمات',
    generalDentistry: 'طب الأسنان العام',
    teethWhitening: 'تبييض الأسنان',
    rootCanals: 'علاج الجذور',
    emergencyCare: 'الرعاية الطارئة',
    cosmeticDentistry: 'طب الأسنان التجميلي',
    
    // Contact
    contactUs: 'تواصل معنا',
    address: '123 شارع الأسنان\nالطابق 100\nنيويورك، NY 10001',
    
    // Hours
    monFri: 'الإثنين - الجمعة: 8:00 ص - 6:00 م',
    saturday: 'السبت: 9:00 ص - 2:00 م',
    sunday: 'الأحد: مغلق',
    
    // Bottom
    copyright: '© 2024 برايت سمايل للأسنان. جميع الحقوق محفوظة.',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    accessibility: 'سهولة الوصول',
  },

  // Header
  header: {
    home: 'الرئيسية',
    about: 'من نحن',
    services: 'الخدمات',
    account: 'الحساب',
    adminDashboard: 'لوحة التحكم',
    myAppointments: 'مواعيدي',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    bookAppointment: 'احجز موعداً',
    theme: 'المظهر',
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

  // Hero Section
  hero: {
    trustedBadge: 'Trusted by 10,000+ Patients',
    title: 'Your Smile Deserves',
    titleHighlight: 'Expert Care',
    subtitle: 'Experience exceptional dental care in a comfortable, modern environment. Our team of specialists is dedicated to giving you the healthy, beautiful smile you deserve.',
    bookAppointment: 'Book Appointment',
    learnMore: 'Learn More',
    rating: '4.9 Rating',
    reviews: '500+ Reviews',
    years: '20+ Years',
    experience: 'Experience',
    certified: 'Certified',
    specialists: 'Specialists',
  },

  // About Section
  about: {
    badge: 'About Us',
    title: 'Meet Our',
    titleHighlight: 'Expert Team',
    subtitle: 'At BrightSmile Dental, we combine cutting-edge technology with compassionate care. Our team of experienced professionals is dedicated to making every visit comfortable and effective.',
    
    // Team members
    doctor1Name: 'Dr. Michael Roberts',
    doctor1Role: 'Lead Dentist & Founder',
    doctor1Desc: '20+ years of experience in restorative and cosmetic dentistry.',
    doctor2Name: 'Dr. Sarah Mitchell',
    doctor2Role: 'Orthodontist',
    doctor2Desc: 'Specialist in Invisalign and traditional braces treatments.',
    doctor3Name: 'Emma Johnson',
    doctor3Role: 'Dental Hygienist',
    doctor3Desc: 'Passionate about preventive care and patient education.',
    
    // Specialties
    implants: 'Implants',
    cosmetic: 'Cosmetic',
    invisalign: 'Invisalign',
    braces: 'Braces',
    cleaning: 'Cleaning',
    prevention: 'Prevention',
    
    // Stats
    happyPatients: 'Happy Patients',
    yearsExperience: 'Years Experience',
    expertStaff: 'Expert Staff',
    satisfactionRate: 'Satisfaction Rate',
    
    // Mission
    missionTitle: 'Our Mission',
    missionPara1: 'We believe everyone deserves access to quality dental care. Our mission is to provide exceptional, personalized treatment in a warm and welcoming environment.',
    missionPara2: 'From routine cleanings to complex procedures, we use the latest technology and techniques to ensure the best possible outcomes for our patients.',
    
    // Features
    feature1: 'State-of-the-art equipment',
    feature2: 'Comfortable environment',
    feature3: 'Personalized care plans',
    feature4: 'Flexible scheduling',
  },

  // Footer
  footer: {
    ctaTitle: 'Ready for Your Best Smile?',
    ctaSubtitle: 'Schedule your appointment today and take the first step towards a healthier, more confident smile.',
    bookAppointment: 'Book Appointment',
    callNow: 'Call Now',
    
    // Brand
    brandDesc: 'Providing exceptional dental care for the whole family since 2003. Your smile is our priority.',
    
    // Quick Links
    quickLinks: 'Quick Links',
    home: 'Home',
    aboutUs: 'About Us',
    servicesLink: 'Services',
    bookNow: 'Book Now',
    
    // Services
    servicesTitle: 'Services',
    generalDentistry: 'General Dentistry',
    teethWhitening: 'Teeth Whitening',
    rootCanals: 'Root Canals',
    emergencyCare: 'Emergency Care',
    cosmeticDentistry: 'Cosmetic Dentistry',
    
    // Contact
    contactUs: 'Contact Us',
    address: '123 Dental Avenue\nSuite 100\nNew York, NY 10001',
    
    // Hours
    monFri: 'Mon - Fri: 8:00 AM - 6:00 PM',
    saturday: 'Saturday: 9:00 AM - 2:00 PM',
    sunday: 'Sunday: Closed',
    
    // Bottom
    copyright: '© 2024 BrightSmile Dental. All rights reserved.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    accessibility: 'Accessibility',
  },

  // Header
  header: {
    home: 'Home',
    about: 'About',
    services: 'Services',
    account: 'Account',
    adminDashboard: 'Admin Dashboard',
    myAppointments: 'My Appointments',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    bookAppointment: 'Book Appointment',
    theme: 'Theme',
  },

  // Booking (English version)
  booking: {
    title: 'Book Appointment',
    subtitle: 'Book your appointment in simple steps',
    selectService: 'Select Service',
    services: {
      general: 'General Dentistry',
      whitening: 'Teeth Whitening',
      rootcanal: 'Root Canal',
      emergency: 'Emergency Care',
      crowns: 'Dental Crowns',
      cosmetic: 'Cosmetic Dentistry',
    },
    duration: 'min',
    selectDate: 'Select Date',
    pickDate: 'Pick a date',
    selectTime: 'Select Time',
    checkingAvailability: 'Checking availability...',
    noSlotsTitle: 'No slots available for this day',
    noSlotsDescription: 'All slots are booked. You can join the waitlist or choose another date.',
    joinWaitlistButton: 'Join Waitlist',
    bookedSlotsNote: 'Crossed-out times are already booked',
    yourInfo: 'Your Information',
    joinWaitlistTitle: 'Join Waitlist',
    waitlistNote: 'You will join the waitlist for {date}. We will contact you when a slot becomes available.',
    fullName: 'Full Name',
    namePlaceholder: 'John Doe',
    emailAddress: 'Email Address',
    emailPlaceholder: 'john@example.com',
    phoneNumber: 'Phone Number',
    phonePlaceholder: '(123) 456-7890',
    additionalNotes: 'Additional Notes (Optional)',
    notesPlaceholder: 'Any concerns or special requests...',
    appointmentSummary: 'Appointment Summary',
    waitlistRequest: 'Waitlist Request',
    service: 'Service:',
    date: 'Date:',
    preferredDate: 'Preferred Date:',
    time: 'Time:',
    continue: 'Continue',
    continueToWaitlist: 'Continue to Join',
    back: 'Back',
    confirmBooking: 'Confirm Booking',
    joinWaitlist: 'Join Waitlist',
    booking: 'Booking...',
    joining: 'Joining...',
    done: 'Done',
    appointmentConfirmed: 'Appointment Confirmed!',
    thankYou: 'Thank you for booking with BrightSmile Dental.',
    confirmationSent: 'A confirmation has been sent to {email}',
    addedToWaitlist: 'Added to Waitlist!',
    willNotify: 'We will notify you when a slot becomes available.',
    willContact: 'We will contact you at {email} when a slot becomes available.',
    slotUnavailable: 'Slot Unavailable',
    slotJustBooked: 'This slot was just booked by someone else. Please choose a different time.',
    bookingSuccess: 'Appointment Booked!',
    bookingSuccessDesc: 'A confirmation has been sent to you.',
    bookingFailed: 'Booking Failed',
    tryAgain: 'An error occurred. Please try again.',
    waitlistSuccess: 'Added to Waitlist!',
    waitlistSuccessDesc: 'We will contact you when a slot becomes available.',
    waitlistFailed: 'Failed to join waitlist',
  },

  // Doctor Profile
  doctorProfile: {
    title: 'Doctor Profile',
    subtitle: 'Update your information and specialty',
    badgeNumber: 'Medical Badge Number',
    doctorInfo: 'Doctor Information',
    completeProfile: 'Complete your profile to appear to patients when booking appointments',
    specialty: 'Specialty',
    selectSpecialty: 'Select Specialty',
    yearsExperience: 'Years of Experience',
    phone: 'Phone Number',
    bio: 'About You',
    bioPlaceholder: 'Write a brief description about your experience and qualifications...',
    availableForAppointments: 'Available for Appointments',
    availableDesc: 'When disabled, patients will not be able to select you for new appointments',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved',
    profileUpdated: 'Profile updated successfully',
    backToDashboard: 'Back to Dashboard',
    notDefined: 'Not defined',
    myProfile: 'My Profile',
  },

  // Realtime notifications
  realtime: {
    newAppointment: 'New Appointment!',
    statusChanged: 'Appointment Status Changed',
    appointmentDeleted: 'Appointment Deleted',
  },

  // Doctor assignment
  doctorAssignment: {
    selectDoctor: 'Select Assigned Doctor',
    assignedDoctor: 'Assigned Doctor',
    noDoctor: 'No doctor assigned',
    noDoctorsAvailable: 'No doctors available',
    loadingDoctors: 'Loading doctors...',
  },

  // Activity Log
  activity: {
    title: 'Activity Log',
    subtitle: 'Track all changes to user roles',
    noActivities: 'No activities logged yet',
    promote: 'Promote',
    demote: 'Demote',
    promotedTo: 'promoted',
    demotedTo: 'demoted',
    toDoctor: 'to Doctor/Admin',
    toPatient: 'to Patient',
  },

  // Admin Dashboard
  admin: {
    title: 'Dashboard',
    subtitle: 'Manage appointments and waitlist',
    staffManagement: 'Staff Management',
    total: 'Total',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    waitlist: 'Waitlist',
    appointments: 'Appointments',
    patients: 'Patients',
    analytics: 'Analytics',
    patientHistory: 'Patient History',
    allServices: 'All Services',
    clearFilters: 'Clear Filters',
    filterByDate: 'Filter by Date',
    filterByService: 'Filter by Service',
    listView: 'List View',
    calendarView: 'Calendar View',
    patientName: 'Patient Name',
    service: 'Service',
    dateTime: 'Date & Time',
    status: 'Status',
    noAppointments: 'No appointments',
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    reschedule: 'Reschedule',
    deleteAppointment: 'Delete Appointment',
    updateStatus: 'Update Status',
    sendReminder: 'Send Reminder',
    notifyWaitlist: 'Notify Waitlist',
    exportCSV: 'Export CSV',
    exportPDF: 'Export PDF',
    printReport: 'Print Report',
    email: 'Email',
    phone: 'Phone',
    totalVisits: 'Total Visits',
    lastVisit: 'Last Visit',
    upcomingAppointments: 'Upcoming Appointments',
    completedAppointments: 'Completed Appointments',
    cancelledAppointments: 'Cancelled Appointments',
    doctorNotes: 'Doctor Notes',
    addNote: 'Add Note',
    appointmentHistory: 'Appointment History',
  },

  // Services
  services: {
    generalCheckup: 'General Checkup',
    teethCleaning: 'Teeth Cleaning',
    teethWhitening: 'Teeth Whitening',
    dentalImplants: 'Dental Implants',
    rootCanal: 'Root Canal',
    bracesOrthodontics: 'Braces/Orthodontics',
  },

  // Doctor badges/specialties
  doctorBadges: {
    seniorDentist: 'Senior Dentist',
    orthodontist: 'Orthodontist',
    implantSpecialist: 'Implant Specialist',
    endodontist: 'Endodontist',
    prosthodontist: 'Prosthodontist',
    periodontist: 'Periodontist',
    oralSurgeon: 'Oral Surgeon',
    generalDentist: 'General Dentist',
    pediatricDentist: 'Pediatric Dentist',
    cosmeticDentist: 'Cosmetic Dentist',
  },
};

// Default to Arabic
export const t = ar;
