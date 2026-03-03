import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from './Modal';
import { Student, ApplicationStatus } from './StudentDetails';
import { setLocalStorageAndNotify, logActivity } from '../utils/storage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Admission, initialAdmissions, School, initialSchools } from './admin/pages/SettingsPage';
import { AdminStudent, initialAdminStudents, StudentStatus } from './admin/pages/StudentsPage';
import { AdmissionSettings } from './admin/pages/SecuritySettingsTab';
import NotificationPreviewModal from './admin/shared/NotificationPreviewModal';
import VideoPreviewModal from './admin/shared/VideoPreviewModal';

// Default settings
const defaultAdmissionSettings: AdmissionSettings = {
    adminOnlyAccess: false,
    autoApproveProspective: false,
    autoAdmitPolicy: 'all',
    autoAdmitStudents: [],
    autoApproveProtocol: false,
    autoPlacePolicy: 'all',
    autoPlaceStudents: [],
    houseAssignmentMethod: 'automatic',
    enableRoomManagement: true,
    dormAssignmentMethod: 'automatic',
    activateWhatsappId: false,
    enableProtocolApplication: true,
    allowStudentEdit: true,
    serialNumberFormat: 'numeric',
    serialNumberLength: 10,
    pinFormat: 'numeric',
    pinLength: 5,
    maintenanceTitle: 'Site under maintenance',
    maintenanceMessage: 'The online admission system is currently offline and will be back online soon.',
    maintenanceCountdownEnd: null,
};

const updateFaviconForSchool = (school?: School | null) => {
    if (!school?.logo) return;
    if (typeof document === 'undefined') return;
    try {
        const head = document.head || document.getElementsByTagName('head')[0];
        if (!head) return;

        const existingIcons = head.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(el => head.removeChild(el));

        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = school.logo;
        head.appendChild(link);
    } catch (e) {
        // Silently ignore favicon update errors
    }
};

// Helper function to check if a notification should be active
export const isNotificationActive = (notif: any, admissionId: string, type: 'scrolling' | 'popup' | 'video', currentPage: string) => {
    if (!notif || !notif.enabled) {
        return false;
    }
    // Check page targeting
    if (notif.targetPages && !notif.targetPages.includes('all') && !notif.targetPages.includes(currentPage)) {
        return false;
    }
    
    const now = new Date();
    if (notif.startTime && new Date(notif.startTime) > now) {
        return false;
    }
    if (notif.endTime && new Date(notif.endTime) < now) {
        return false;
    }
    if (notif.frequency === 'once') {
        const sessionKey = `${type}_shown_${currentPage}_${admissionId}`;
        if (sessionStorage.getItem(sessionKey)) {
            return false;
        }
    }
    return true;
};

const CountdownTimer = ({ endTime, onEnd }: { endTime: string; onEnd: () => void }) => {
    const calculateTimeLeft = useCallback(() => {
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const distance = end - now;

        if (distance <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, distance: 0 };
        }

        return {
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000),
            distance
        };
    }, [endTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (timeLeft.distance <= 0) {
            onEnd();
            return;
        }

        const timer = setTimeout(() => {
            const nextTime = calculateTimeLeft();
            setTimeLeft(nextTime);
            if (nextTime.distance <= 0) {
                onEnd();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft, onEnd, calculateTimeLeft]);
    
    const format = (num: number) => String(num).padStart(2, '0');

    return (
        <div className="mt-8">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest">Portal re-opens in:</p>
            <div className="flex justify-center gap-2 sm:gap-4 text-gray-800 dark:text-gray-100">
                <div className="text-center p-3 rounded-xl bg-gray-100 dark:bg-white/5 w-16 sm:w-20 border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="text-2xl sm:text-3xl font-bold font-mono">{format(timeLeft.days)}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Days</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-100 dark:bg-white/5 w-16 sm:w-20 border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="text-2xl sm:text-3xl font-bold font-mono">{format(timeLeft.hours)}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Hrs</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-100 dark:bg-white/5 w-16 sm:w-20 border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="text-2xl sm:text-3xl font-bold font-mono">{format(timeLeft.minutes)}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Min</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-100 dark:bg-white/5 w-16 sm:w-20 border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-logip-primary dark:text-logip-accent">{format(timeLeft.seconds)}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Sec</div>
                </div>
            </div>
        </div>
    );
};

const SchoolLogo: React.FC<{ school: School | null | undefined }> = ({ school }) => {
    if (school?.logo) {
        return (
            <div className="flex items-center justify-center mb-6">
                <img src={school.logo} alt={school.name} className="h-24 w-auto object-contain" />
            </div>
        )
    }
    // Fallback logo
    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12.6667L9.33333 18L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-base font-bold text-gray-800 dark:text-gray-100 text-left leading-tight">
                <div>Peki</div>
                <div className="flex items-center gap-1.5">
                    <span className="text-gray-400/80 dark:text-gray-600/80 font-normal">|</span>
                    <span>Senior</span>
                    <span className="text-gray-400/80 dark:text-gray-600/80 font-normal">|</span>
                </div>
                <div>High</div>
            </div>
        </div>
    )
}

interface AuthFormProps {
  schoolSlug?: string;
  admissionSlug?: string;
  onVerificationSuccess: (student: Student, status: ApplicationStatus | StudentStatus, hasPaid: boolean, isExempt?: boolean, paymentType?: 'initial' | 'doc_access') => void;
  onSwitchToAdmin: () => void;
  onSwitchToProtocolAdmission: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ schoolSlug, admissionSlug, onVerificationSuccess, onSwitchToAdmin, onSwitchToProtocolAdmission }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode>('');
  const [errorTitle, setErrorTitle] = useState('Verification Failed');
  const [errorButtonText, setErrorButtonText] = useState('Try Again');
  const [isMaintenanceOverridden, setIsMaintenanceOverridden] = useState(false);
  
  const handleMaintenanceEnd = useCallback(() => {
      setIsMaintenanceOverridden(true);
  }, []);
  
  // State for Profile Preview Popup
  const [previewStudent, setPreviewStudent] = useState<{ student: Student, status: ApplicationStatus | StudentStatus, hasPaid: boolean, isExempt?: boolean, paymentType?: 'initial' | 'doc_access' } | null>(null);

  const [admissions] = useLocalStorage<Admission[]>('admin_admissions', initialAdmissions);
  const [adminStudents, setAdminStudents] = useLocalStorage<AdminStudent[]>('admin_students', initialAdminStudents);
  const [schools] = useLocalStorage<School[]>('admin_schools', initialSchools);

  // Multi-tenancy isolation: determine context based on slugs
  const activeSchool = useMemo(() => {
      const school = schoolSlug ? schools.find(s => s.slug === schoolSlug) : schools.find(s => s.id === 's1');
      if (school) {
          document.title = `${school.name} - Online Admission Portal`;
          updateFaviconForSchool(school);
      }
      return school;
  }, [schools, schoolSlug]);

  const activeAdmission = useMemo(() => {
      if (!activeSchool) return null;
      if (admissionSlug) return admissions.find(a => a.schoolId === activeSchool.id && a.slug === admissionSlug);
      return admissions.find(a => a.schoolId === activeSchool.id && a.status === 'Active') || admissions.find(a => a.schoolId === activeSchool.id);
  }, [admissions, admissionSlug, activeSchool]);

  const getInitialNotification = (type: 'scrolling' | 'popup' | 'video') => {
      if (!activeAdmission) return null;
      const key = `notification_${type}_${activeAdmission.schoolId}_${activeAdmission.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
          const data = JSON.parse(raw);
          if (isNotificationActive(data, activeAdmission.id, type, 'auth')) {
              return data;
          }
      }
      return null;
  };

  const [scrollingBanner, setScrollingBanner] = useState<any | null>(() => getInitialNotification('scrolling'));
  const [popupBanner, setPopupBanner] = useState<any | null>(() => getInitialNotification('popup'));
  const [videoNotification, setVideoNotification] = useState<any | null>(() => getInitialNotification('video'));
  
  const [isPopupBannerVisible, setIsPopupBannerVisible] = useState(() => !!getInitialNotification('popup'));
  const [isVideoNotificationVisible, setIsVideoNotificationVisible] = useState(() => !!getInitialNotification('video'));

  const scrollingSpeed = useMemo(() => `${scrollingBanner?.speed || 25}s`, [scrollingBanner]);

  useEffect(() => {
      if (activeAdmission) {
          if (popupBanner && popupBanner.frequency === 'once') sessionStorage.setItem(`popup_shown_auth_${activeAdmission.id}`, 'true');
          if (videoNotification && videoNotification.frequency === 'once') sessionStorage.setItem(`video_shown_auth_${activeAdmission.id}`, 'true');
          if (scrollingBanner && scrollingBanner.frequency === 'once') sessionStorage.setItem(`scrolling_shown_auth_${activeAdmission.id}`, 'true');
      }
  }, [activeAdmission, popupBanner, videoNotification, scrollingBanner]);

  useEffect(() => {
      if (!activeAdmission) return;
      
      const { schoolId, id: admissionId } = activeAdmission;
      const scrollingKey = `notification_scrolling_${schoolId}_${admissionId}`;
      const popupKey = `notification_popup_${schoolId}_${admissionId}`;
      const videoKey = `notification_video_${schoolId}_${admissionId}`;

      const checkNotifications = () => {
          const scroll = getInitialNotification('scrolling');
          const popup = getInitialNotification('popup');
          const video = getInitialNotification('video');
          
          setScrollingBanner(scroll);
          setPopupBanner(popup);
          setIsPopupBannerVisible(!!popup);
          setVideoNotification(video);
          setIsVideoNotificationVisible(!!video);
      };

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === scrollingKey || e.key === popupKey || e.key === videoKey) {
            checkNotifications();
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeAdmission]);
  
  const admissionSettingsKey = activeAdmission ? `admissionSettings_${activeAdmission.schoolId}_${activeAdmission.id}` : 'nullAdmissionSettingsKey';
  const [admissionSettings] = useLocalStorage<AdmissionSettings | null>(admissionSettingsKey, null);

  const effectiveSettings = useMemo(() => {
    return { ...defaultAdmissionSettings, ...(admissionSettings || {}) };
  }, [admissionSettings]);

  const { authMethod = 'Index number only', indexHint = '' } = activeAdmission || {};

  const generateCredential = (length: number, format: 'numeric' | 'alphabetic' | 'alphanumeric' | undefined): string => {
      const safeLength = (typeof length === 'number' && length > 0) ? length : 10;
      const safeFormat = format || 'numeric';
      let chars = '0123456789';
      if (safeFormat === 'alphabetic') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      else if (safeFormat === 'alphanumeric') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < safeLength; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
  };

  const requiredEnding = useMemo(() => {
    if (!indexHint) return null;
    const match = indexHint.match(/(\d+)$/);
    return match ? match[1] : null;
  }, [indexHint]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeAdmission) return;
    
    const isNumericInput = /^\d+$/.test(inputValue);
    if (authMethod === 'Index number only' || (authMethod === 'Either index number or full name' && isNumericInput)) {
        if (requiredEnding && !effectiveSettings.activateWhatsappId) { 
            if (inputValue.length === 12 && !inputValue.endsWith(requiredEnding)) { 
                setErrorTitle('Verification Failed');
                setErrorMessage(`BECE Index Number must end with '${requiredEnding}'.`);
                setErrorButtonText('Try again later');
                setIsErrorModalOpen(true);
                return; 
            }
        }
    }

    setIsLoading(true);
    const schoolPhone = activeAdmission?.headOfSchoolNumber || '0244889791';
    const itPhone = activeAdmission?.headOfItNumber || '0243339546';

    const defaultNotFoundError = (
      <>
        Record not found for this admission. Check and try again. Call the School on <a href={`tel:${schoolPhone}`} className="font-semibold underline hover:text-red-700">{schoolPhone}</a> or call the IT Department on <a href={`tel:${itPhone}`} className="font-semibold underline hover:text-red-700">{itPhone}</a>.
      </>
    );

    const customNotFoundError = effectiveSettings.verificationErrorMessage ? (
        <div className="whitespace-pre-wrap">{effectiveSettings.verificationErrorMessage}</div>
    ) : defaultNotFoundError;
    
    setIsLoading(false);
    let studentData: Student | null = null;
    const lowercasedInput = inputValue.toLowerCase();
    
    const dynamicStudent = adminStudents.find(s => {
        if (s.schoolId !== activeAdmission.schoolId || s.admissionId !== activeAdmission.id) return false;
        
        const indexMatch = s.indexNumber === inputValue;
        const nameMatch = s.name.toLowerCase() === lowercasedInput;
        const phoneMatch = effectiveSettings.activateWhatsappId && s.phoneNumber === inputValue;
        
        if (authMethod === 'Index number only') return indexMatch || !!phoneMatch;
        if (authMethod === 'Full name only') return nameMatch || !!phoneMatch;
        if (authMethod === 'Either index number or full name') return indexMatch || nameMatch || !!phoneMatch;
        return false;
    });
    
    if (dynamicStudent) {
        let studentForProcessing = { ...dynamicStudent };
        let statusUpdated = false;

        if (studentForProcessing.status === 'Prospective' && !studentForProcessing.isProtocol && effectiveSettings.autoApproveProspective) {
            studentForProcessing.status = 'Admitted';
            statusUpdated = true;
        } else if (studentForProcessing.status === 'Pending' && studentForProcessing.isProtocol && effectiveSettings.autoApproveProtocol) {
            studentForProcessing.status = 'Placed';
            statusUpdated = true;
            
            const schoolName = activeSchool?.name || 'the school';
            const admissionTitle = activeAdmission?.title || 'the admission type';
            const smsNumberRaw = localStorage.getItem(`smsNotificationNumber_${studentForProcessing.schoolId}_${studentForProcessing.indexNumber}`);
            const smsNumber = smsNumberRaw ? JSON.parse(smsNumberRaw) : (studentForProcessing.phoneNumber || "");
            
            console.log(`[SIMULATED SMS - AUTO] to ${smsNumber || 'student'}: Your protocol requested for ${schoolName} and ${admissionTitle} has been Approved.`);
        }

        if(statusUpdated) {
          setAdminStudents(prevStudents => prevStudents.map(s => s.id === studentForProcessing.id ? studentForProcessing : s));
        }
        
        if (studentForProcessing.status === 'Rejected') {
            setErrorTitle('Application Rejected!');
            setErrorMessage(<>We regret to inform you that your application was not successful.</>);
            setErrorButtonText('Close');
            setIsErrorModalOpen(true);
            return;
        }
        
        if (studentForProcessing.isProtocol && studentForProcessing.status === 'Pending') {
            setErrorTitle('Protocol Application Submitted');
            setErrorMessage(<>Your request is currently being reviewed. You will be notified once it has been approved or declined.</>);
            setErrorButtonText('Try again later');
            setIsErrorModalOpen(true);
            return;
        }
        
        studentData = {
            name: studentForProcessing.name,
            indexNumber: studentForProcessing.indexNumber,
            programme: studentForProcessing.programme,
            gender: studentForProcessing.gender,
            residence: studentForProcessing.residence,
            aggregate: studentForProcessing.aggregate,
            schoolId: studentForProcessing.schoolId,
            admissionId: studentForProcessing.admissionId,
            isProtocol: !!studentForProcessing.isProtocol,
            phoneNumber: studentForProcessing.phoneNumber,
        };

        const submissionStatusRaw = localStorage.getItem(`submissionStatus_${studentData.schoolId}_${studentData.indexNumber}`);
        const isSubmitted = submissionStatusRaw ? JSON.parse(submissionStatusRaw).submitted : false;

        const paymentStatusFromGatewayRaw = localStorage.getItem(`paymentStatus_${studentData.schoolId}_${studentData.indexNumber}`);
        const hasPaidViaGateway = paymentStatusFromGatewayRaw ? JSON.parse(paymentStatusFromGatewayRaw).paid : false;
        const hasPaidViaAdmin = studentForProcessing.feeStatus === 'Paid';
        
        const financialsKey = `financialsSettings_${studentData.schoolId}_${studentData.admissionId}`;
        const financialsRaw = localStorage.getItem(financialsKey);
        const financials = financialsRaw ? JSON.parse(financialsRaw) : { gatewayStatus: true, requirementPolicy: 'all', targetedStudents: [], exemptedStudents: [], docAccessFeeEnabled: false, docAccessFeeTarget: 'both' };
        
        let initialPaymentRequired = financials.gatewayStatus;
        if (initialPaymentRequired) {
            if (financials.requirementPolicy === 'selected') {
                initialPaymentRequired = financials.targetedStudents.includes(studentForProcessing.id);
            } else if (financials.requirementPolicy === 'exempted') {
                initialPaymentRequired = !financials.exemptedStudents.includes(studentForProcessing.id);
            }
        }

        // --- REQUIREMENT: if Global Status is off, always treat as exempt regardless of submission status
        const isGlobalStatusOff = !financials.gatewayStatus;
        const isExemptFromInitial = isGlobalStatusOff; 
        const hasPaidInitial = isExemptFromInitial || hasPaidViaGateway || hasPaidViaAdmin;
        
        const docUnlockStatusKey = `paymentStatus_docAccess_${studentData.schoolId}_${studentData.indexNumber}`;
        const docAccessPaidRaw = localStorage.getItem(docUnlockStatusKey);
        const hasPaidDocAccess = docAccessPaidRaw ? JSON.parse(docAccessPaidRaw).paid : false;
        
        const isAdmitted = studentForProcessing.status === 'Admitted';
        const isProspective = studentForProcessing.status === 'Prospective';
        
        let docAccessRequired = financials.docAccessFeeEnabled && !hasPaidDocAccess;
        if (docAccessRequired) {
            const target = financials.docAccessFeeTarget;
            if (target === 'admitted' && !isAdmitted) docAccessRequired = false;
            else if (target === 'prospective' && !isProspective) docAccessRequired = false;
            else if (target === 'both' && !isAdmitted && !isProspective) docAccessRequired = false;
        }

        logActivity(
            { name: studentForProcessing.name, avatar: '', type: 'student' },
            'successfully verified details and logged in',
            'security',
            `Index: ${studentForProcessing.indexNumber} (${activeAdmission.title})`,
            studentForProcessing.schoolId
        );

        // When payment is bypassed, we must ensure credentials exist for the subsequent login page
        if (isExemptFromInitial) {
            const credentialsKey = `credentials_${studentData.schoolId}_${studentData.indexNumber}`;
            if (!localStorage.getItem(credentialsKey)) {
                const serial = generateCredential(effectiveSettings.serialNumberLength || 10, effectiveSettings.serialNumberFormat);
                const pin = generateCredential(effectiveSettings.pinLength || 5, effectiveSettings.pinFormat);
                setLocalStorageAndNotify(credentialsKey, { serialNumber: serial, pin: pin });
                console.log(`[SYSTEM] Bypassed payment. Auto-generated credentials for ${studentData.indexNumber}`);
            }
        }

        if (isGlobalStatusOff && !previewStudent) {
            setPreviewStudent({
                student: studentData,
                status: studentForProcessing.status,
                hasPaid: hasPaidInitial,
                isExempt: isExemptFromInitial,
                paymentType: 'initial'
            });
            return;
        }

        if (!hasPaidInitial) {
            onVerificationSuccess(studentData, studentForProcessing.status, false, false, 'initial');
            return;
        }
        
        if (docAccessRequired) {
            onVerificationSuccess(studentData, studentForProcessing.status, false, false, 'doc_access');
            return;
        }

        onVerificationSuccess(studentData, studentForProcessing.status, true, isExemptFromInitial);
        return; 
    }

    logActivity(
        { name: 'Unknown Applicant', avatar: '', type: 'student' },
        'failed index verification attempt',
        'security',
        `Input: ${inputValue} (Admission: ${activeAdmission?.title || 'Unknown'})`,
        activeSchool?.id
    );

    setErrorTitle('Verification Failed');
    setErrorMessage(customNotFoundError);
    setErrorButtonText('Try again later');
    setIsErrorModalOpen(true);
  };

  const handleProceedFromPreview = () => {
    if (previewStudent) {
        onVerificationSuccess(previewStudent.student, previewStudent.status, previewStudent.hasPaid, previewStudent.isExempt, previewStudent.paymentType);
        setPreviewStudent(null);
    }
  };

  const closeErrorModal = () => setIsErrorModalOpen(false);
  
  const { placeholder, icon } = useMemo(() => {
    let p = 'Enter Index Number', i = '#';
    if (authMethod === 'Full name only') { p = 'Enter Your Full Name'; i = 'person'; }
    else if (authMethod === 'Either index number or full name') { p = 'Enter Index Number or Full Name'; i = 'badge'; }
    if (effectiveSettings.activateWhatsappId) i = 'badge';
    return { placeholder: p, icon: i };
  }, [authMethod, effectiveSettings]);

  const displayedHint = useMemo(() => {
    if (indexHint) return indexHint;
    if (authMethod === 'Full name only') {
      return "Enter your full name exactly as it appears on\nthe placement form. Example: Doe John";
    }
    return "Add the year you completed JHS\nExample: xxxxxxxxxxxx25";
  }, [authMethod, indexHint]);

  if (!activeSchool || !activeAdmission) {
      return (
          <div className="text-center py-4">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">Portal Context Missing</h1>
              <p className="mt-4 text-gray-600 dark:text-gray-400">This link appears to be invalid or the school does not have an active admission group.</p>
              <div className="mt-8">
                  <button onClick={onSwitchToAdmin} className="text-sm font-bold text-indigo-600">Go to Admin Dashboard</button>
              </div>
          </div>
      );
  }

  if (effectiveSettings.adminOnlyAccess && !isMaintenanceOverridden) {
    return (
        <div className="text-center animate-fadeIn py-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">{effectiveSettings.maintenanceTitle}</h1>
            <div className="h-1 w-16 bg-orange-500 mx-auto mt-4 rounded-full"></div>
            <p className="text-base text-gray-600 dark:text-gray-400 mt-8 max-w-sm mx-auto leading-relaxed">{effectiveSettings.maintenanceMessage}</p>
            
            {effectiveSettings.maintenanceCountdownEnd && (
                <CountdownTimer 
                    endTime={effectiveSettings.maintenanceCountdownEnd} 
                    onEnd={handleMaintenanceEnd} 
                />
            )}
        </div>
    );
  }

  return (
    <>
      <style>{`@keyframes logip-marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }`}</style>
      {scrollingBanner && (
          <div className={`fixed ${scrollingBanner.position === 'top' ? 'top-0' : 'bottom-0'} left-0 w-full h-12 z-[150] overflow-hidden flex items-center shadow-md`} style={{ backgroundColor: scrollingBanner.backgroundColor }}>
              <p className="whitespace-nowrap flex-shrink-0 inline-block" style={{ color: scrollingBanner.textColor, paddingLeft: '100%', animation: `logip-marquee ${scrollingSpeed} linear infinite`, fontSize: `${scrollingBanner.fontSize || 14}px`, fontWeight: scrollingBanner.isBold ? 'bold' : 'normal', fontStyle: scrollingBanner.isItalic ? 'italic' : 'normal', willChange: 'transform' }}>{scrollingBanner.text}</p>
          </div>
      )}
      {isPopupBannerVisible && popupBanner && (
        <NotificationPreviewModal isOpen={true} onClose={() => setIsPopupBannerVisible(false)} title={popupBanner.title} message={popupBanner.message} icon={popupBanner.icon} iconColor={popupBanner.iconColor} textColor={popupBanner.textColor} style={popupBanner.popupStyle || 'standard'} image={popupBanner.popupImage} />
      )}
      {isVideoNotificationVisible && videoNotification && (
        <VideoPreviewModal isOpen={true} onClose={() => setIsVideoNotificationVisible(false)} url={videoNotification.url} autoplay={videoNotification.autoplay} isDraggable={true} />
      )}

      <div>
        <div className="text-center mb-8">
          <SchoolLogo school={activeSchool} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{activeSchool?.name}</h1>
          <p className="text-base text-gray-500 mt-8">Verify Your Details - {activeAdmission.title}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                {icon !== '#' && <span className="material-symbols-outlined text-xl">{icon}</span>}
              </span>
              <input id="auth-input" name="authInput" type="text" required className={`appearance-none rounded-lg relative block w-full pr-4 py-4 border border-input-border-light dark:border-input-border-dark bg-gray-50/50 dark:bg-black/20 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base transition ${icon === '#' ? 'pl-4' : 'pl-10'}`} placeholder={placeholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            </div>
          </div>
          {displayedHint && (
            <div className="bg-info-bg-light dark:bg-yellow-950/40 border-l-4 border-info-border-light dark:border-yellow-500 text-info-text-light dark:text-yellow-200 p-4 rounded-r mb-8 flex items-start space-x-3 masonry-item overflow-x-auto no-scrollbar">
              <span className="material-symbols-outlined text-xl mt-0.5">info</span>
              <div className="min-w-0 flex-1">
                {displayedHint.split('\n').map((line, i) => {
                  const parts = line.split(/(Example:.*)/);
                  return (
                    <p key={i} className="font-semibold text-base whitespace-nowrap">
                      {parts.map((part, index) => {
                        if (part.startsWith('Example:')) {
                          return <span key={index} className="font-thin">{part}</span>;
                        }
                        return part;
                      })}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 text-lg font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transform transition-all duration-300 disabled:opacity-60">
              {isLoading ? 'Verifying...' : 'Verify Now'}
            </button>
          </div>
        </form>
        <div className="text-center mt-8 flex justify-center items-center gap-4">
          {effectiveSettings.enableProtocolApplication && (
            <button
              onClick={onSwitchToProtocolAdmission}
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-base">headphones</span>
              Protocol Admission
            </button>
          )}
        </div>
      </div>

      {/* Redesigned Applicant Information Modal to match Confirm Your Details UI */}
      <Modal isOpen={!!previewStudent} onClose={() => setPreviewStudent(null)} size="xl">
        <div className="flex flex-col items-center">
            {/* Top Warning Icon */}
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-4xl text-yellow-500">warning</span>
            </div>
            
            {/* Title & Instruction */}
            <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">Applicant Information</h2>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed text-left w-full">Please double-check the following information before proceeding:</p>
            
            {/* Gray Detail Container */}
            <dl className="mt-4 w-full text-left space-y-2 text-base bg-gray-100 dark:bg-gray-800/50 p-8 rounded-lg">
                <div className="flex justify-between items-center gap-4">
                    <dt className="text-gray-500 whitespace-nowrap">Full Name:</dt>
                    <dd className="font-semibold text-gray-900 dark:text-gray-100 text-right truncate">{previewStudent?.student.name}</dd>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <dt className="text-gray-500 whitespace-nowrap">Index Number:</dt>
                    <dd className="font-semibold text-gray-900 dark:text-gray-100 text-right font-mono">{previewStudent?.student.indexNumber}</dd>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <dt className="text-gray-500 whitespace-nowrap">Programme:</dt>
                    <dd className="font-semibold text-gray-900 dark:text-gray-100 text-right truncate">{previewStudent?.student.programme}</dd>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <dt className="text-gray-500 whitespace-nowrap">Gender:</dt>
                    <dd className="font-semibold text-gray-900 dark:text-gray-100 text-right">{previewStudent?.student.gender ? previewStudent.student.gender.charAt(0).toUpperCase() + previewStudent.student.gender.slice(1).toLowerCase() : 'N/A'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <dt className="text-gray-500 whitespace-nowrap">Residence:</dt>
                    <dd className="font-semibold text-gray-900 dark:text-gray-100 text-right">{previewStudent?.student.residence}</dd>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <dt className="text-gray-500 whitespace-nowrap">Aggregate:</dt>
                    <dd className="font-semibold text-gray-900 dark:text-gray-100 text-right">{previewStudent?.student.aggregate}</dd>
                </div>
            </dl>

            {/* Bottom Actions */}
            <div className="mt-8 w-full flex items-center gap-4">
                <button 
                    onClick={() => setPreviewStudent(null)} 
                    type="button" 
                    className="w-full py-2.5 px-4 text-base font-semibold rounded-lg text-gray-900 dark:text-gray-300 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-600 transition-colors"
                >
                    Go Back
                </button>
                <button 
                    onClick={handleProceedFromPreview} 
                    type="button" 
                    className="w-full py-2.5 px-4 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover shadow-md transition-all active:scale-[0.98]"
                >
                    Proceed to Application
                </button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isErrorModalOpen} onClose={closeErrorModal}>
        <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5"><span className="material-symbols-outlined text-4xl text-red-500">report_problem</span></div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{errorTitle}</h2>
            <div className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed">{errorMessage}</div>
            <button onClick={closeErrorModal} className="mt-8 w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700">{errorButtonText}</button>
        </div>
      </Modal>
    </>
  );
};

export default AuthForm;