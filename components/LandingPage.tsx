import React from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialSchools, initialAdmissions, School, Admission } from './admin/pages/SettingsPage';

interface LandingPageProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ toggleTheme, isDarkMode }) => {
  const [schools] = useLocalStorage<School[]>('admin_schools', initialSchools);
  const [admissions] = useLocalStorage<Admission[]>('admin_admissions', initialAdmissions);

  const activeSchools = schools.filter((s) => s.status === 'Active');

  const navigateToPortal = (school: School, admission: Admission | null) => {
    if (!admission) return;
    window.location.href = `/${school.slug}/${admission.slug}`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50 dark:from-background-dark dark:via-dark-bg dark:to-report-dark flex flex-col items-center justify-center px-4 py-10">
      <header className="w-full max-w-5xl flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-logip-primary text-white flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-logip-text-subtle dark:text-dark-text-secondary">
              Packets Out
            </p>
            <p className="text-base font-semibold text-logip-text-header dark:text-dark-text-primary">
              Online Admission System
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </header>

      <main className="w-full max-w-5xl grid lg:grid-cols-[1.3fr,1.2fr] gap-10 items-center">
        <section>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live admissions platform
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-logip-text-header dark:text-dark-text-primary mb-4">
            Seamless Online Admissions
            <br />
            for Senior High Schools.
          </h1>
          <p className="text-base sm:text-lg text-logip-text-body/80 dark:text-dark-text-secondary max-w-xl mb-6">
            Packets Out powers secure, modern admission portals for schools across Ghana.
            Choose your school to verify placement, complete forms, and download admission documents.
          </p>
          <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-6">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-emerald-500">verified_user</span>
              Secure student verification
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-sky-500">cloud_done</span>
              Cloud-based records
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-violet-500">chat</span>
              Built-in support connect
            </span>
          </div>
        </section>

        <section className="bg-logip-white/90 dark:bg-report-dark/90 border border-logip-border/60 dark:border-report-border rounded-2xl shadow-xl p-5 sm:p-6 lg:p-7 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-logip-text-header dark:text-dark-text-primary">
              Select a School
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-100 dark:border-blue-500/30">
              {activeSchools.length} active portals
            </span>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
            {activeSchools.map((school) => {
              const schoolAdmissions = admissions.filter(
                (a) => a.schoolId === school.id && a.status === 'Active'
              );
              const primaryAdmission = schoolAdmissions[0] || null;

              return (
                <button
                  key={school.id}
                  onClick={() => navigateToPortal(school, primaryAdmission)}
                  className="w-full text-left group flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-logip-border/70 dark:border-report-border hover:border-logip-primary hover:bg-blue-50/60 dark:hover:border-logip-primary dark:hover:bg-blue-500/10 transition-all"
                  disabled={!primaryAdmission}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-logip-border/40 dark:bg-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {school.logo ? (
                        <img
                          src={school.logo}
                          alt={school.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-xl text-logip-text-subtle dark:text-dark-text-secondary">
                          apartment
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-logip-text-header dark:text-dark-text-primary truncate">
                        {school.name}
                      </p>
                      <p className="text-xs text-logip-text-subtle/90 dark:text-dark-text-secondary truncate">
                        {primaryAdmission ? primaryAdmission.title : 'No active admission'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {primaryAdmission ? (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Open portal
                      </span>
                    ) : (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        Coming soon
                      </span>
                    )}
                    <span className="material-symbols-outlined text-xl text-logip-text-subtle group-hover:text-logip-primary dark:text-dark-text-secondary">
                      arrow_forward_ios
                    </span>
                  </div>
                </button>
              );
            })}

            {activeSchools.length === 0 && (
              <div className="text-center text-sm text-logip-text-subtle dark:text-dark-text-secondary py-8">
                No active school portals available at the moment.
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-10 text-xs text-logip-text-subtle/80 dark:text-dark-text-secondary">
        Powered by <span className="font-semibold">Packets Out LLC</span>
      </footer>
    </div>
  );
};

export default LandingPage;

