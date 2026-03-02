import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import StudentDetails, { ApplicationStatus, Student } from './components/StudentDetails';
import AdminLayout, { AdminUser } from './components/admin/AdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import PaymentGateway from './components/PaymentGateway';
import ApplicantLoginForm from './components/ApplicantLoginForm';
import ProtocolAdmissionPage from './components/ProtocolAdmissionPage';
import LandingPage from './components/LandingPage';
import { StudentStatus } from './components/admin/pages/StudentsPage';

type StudentView = 'auth' | 'payment' | 'applicant_login' | 'details' | 'protocol_admission';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.theme === 'dark') return true;
    if (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return false;
  });

  // Derive routing context from the URL
  // Student routes look like: /:schoolSlug/:admissionSlug
  // Admin login route: /login/admin
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const isAdminLoginRoute = pathSegments[0] === 'login' && pathSegments[1] === 'admin';
  const isLandingRoute = pathSegments.length === 0 && !isAdminLoginRoute;
  const schoolSlugFromPath = !isAdminLoginRoute && pathSegments.length >= 1 ? pathSegments[0] : undefined;
  const admissionSlugFromPath = !isAdminLoginRoute && pathSegments.length >= 2 ? pathSegments[1] : undefined;

  const [currentView, setCurrentView] = useState<StudentView>('auth');
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [appMode, setAppMode] = useState<'student' | 'admin'>(() => (isAdminLoginRoute ? 'admin' : 'student'));
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | StudentStatus>('not_submitted');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activePaymentType, setActivePaymentType] = useState<'initial' | 'doc_access'>('initial');

  useEffect(() => {
    document.documentElement.classList.remove('opacity-0');
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const handleVerificationSuccess = (student: Student, status: ApplicationStatus | StudentStatus, hasPaid: boolean, isExempt: boolean = false, paymentType: 'initial' | 'doc_access' = 'initial') => {
    setVerifiedStudent(student);
    setApplicationStatus(status);
    setActivePaymentType(paymentType);

    // Flow Requirement: Always show Serial/PIN login page if "Paid" or "Exempt"
    if (hasPaid || isExempt) { 
        setCurrentView('applicant_login');
    } else { 
        setCurrentView('payment');
    }
  };

  const handlePaymentSuccess = () => {
    setCurrentView('applicant_login');
  };
  
  const handleApplicantLoginSuccess = () => {
    setCurrentView('details');
  }

  const handleReturnToVerification = () => {
    setVerifiedStudent(null);
    setCurrentView('auth');
    setAppMode('student');
  };

  const handleSwitchToAdmin = () => {
    setAppMode('admin');
    setCurrentView('auth');
  };

  const handleSwitchToProtocolAdmission = () => {
    setCurrentView('protocol_admission');
  };

  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
  };

  const handleAdminLogoutAndReturn = () => {
    setAppMode('student');
    setAdminUser(null);
    setCurrentView('auth');
    setVerifiedStudent(null);
  };

  const isDashboardView = (appMode === 'admin' && !!adminUser) || 
                          (appMode === 'student' && currentView === 'details');

  // If someone visits /login or any other /login/* path that is NOT /login/admin,
  // show a 404-style page instead of the student portal.
  if (pathSegments[0] === 'login' && !isAdminLoginRoute) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-logip-bg dark:bg-background-dark p-4">
        <div className="bg-logip-white dark:bg-report-dark rounded-xl border border-logip-border dark:border-report-border px-8 py-10 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">404 - Not Found</h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
            The resource requested could not be found on this server.
          </p>
        </div>
      </div>
    );
  }

  // Root path: show Packets Out landing page for selecting school
  if (isLandingRoute) {
    return <LandingPage toggleTheme={toggleTheme} isDarkMode={isDarkMode} />;
  }

  if (isDashboardView) {
    const dashboardContent = appMode === 'admin' && adminUser
      ? <AdminLayout
            adminUser={adminUser}
            setAdminUser={setAdminUser}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            onExitAdmin={handleAdminLogoutAndReturn}
        />
      : <StudentDetails 
            student={verifiedStudent!} 
            onReturn={handleReturnToVerification} 
            applicationStatus={applicationStatus} 
            toggleTheme={toggleTheme} 
            isDarkMode={isDarkMode}
        />;
      
    return (
      <div className="animate-fadeIn">
        {dashboardContent}
      </div>
    );
  }

  let authContent: React.ReactNode;
  let authContentKey: string;

  if (appMode === 'admin' && !adminUser) {
      authContentKey = 'admin-login';
      authContent = <AdminLogin onLoginSuccess={handleAdminLoginSuccess} onReturnToStudentView={handleAdminLogoutAndReturn} />;
  } else {
      authContentKey = currentView;
      switch (currentView) {
          case 'auth':
              authContent = (
                <AuthForm
                  schoolSlug={schoolSlugFromPath}
                  admissionSlug={admissionSlugFromPath}
                  onVerificationSuccess={handleVerificationSuccess}
                  onSwitchToAdmin={handleSwitchToAdmin}
                  onSwitchToProtocolAdmission={handleSwitchToProtocolAdmission}
                />
              );
              break;
          case 'payment':
              const financialsKey = `financialsSettings_${verifiedStudent?.schoolId}_${verifiedStudent?.admissionId}`;
              const financialsRaw = localStorage.getItem(financialsKey);
              const financials = financialsRaw ? JSON.parse(financialsRaw) : {};
              
              authContent = (
                <PaymentGateway 
                    student={verifiedStudent!} 
                    onPaymentSuccess={handlePaymentSuccess} 
                    onClose={handleReturnToVerification}
                    isInitialVoucherPayment={activePaymentType === 'initial'}
                    customPrice={activePaymentType === 'doc_access' ? financials.docAccessFeePrice : undefined}
                    customTitle={activePaymentType === 'doc_access' ? "Document Access Fee" : undefined}
                    customSubtitle={activePaymentType === 'doc_access' ? "One-time payment to unlock your admission documents for printing." : undefined}
                />
              );
              break;
          case 'applicant_login':
              authContent = <ApplicantLoginForm student={verifiedStudent!} onLoginSuccess={handleApplicantLoginSuccess} />;
              break;
          case 'protocol_admission':
              authContent = (
                <ProtocolAdmissionPage
                  onReturnToVerification={handleReturnToVerification}
                  schoolSlug={schoolSlugFromPath}
                  admissionSlug={admissionSlugFromPath}
                />
              );
              break;
          default:
              authContent = <div className="p-10 text-center">Error: Invalid view</div>;
      }
  }

  const mainMaxWidthClass = (currentView === 'payment' || currentView === 'protocol_admission') ? 'max-w-4xl' : 'max-w-lg';
  const applyPadding = currentView !== 'payment';

  return (
    <>
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 p-2 rounded-full text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-logip-bg dark:bg-background-dark">
        <main className={`relative z-10 w-full ${mainMaxWidthClass} transition-all duration-300`}>
          <div className={`relative bg-logip-white dark:bg-report-dark rounded-xl border border-logip-border dark:border-report-border w-full ${applyPadding ? 'p-8 sm:p-10' : 'overflow-hidden'}`}>
            <div key={authContentKey} className="animate-fadeIn">
              {authContent}
            </div>
          </div>
        </main>
        <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <p className="text-xs text-gray-500/80 dark:text-gray-400/60">
            Powered by: Packets Out LLC
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;