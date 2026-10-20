import './globals.css';
import type { Metadata } from 'next';
import { ToastProvider } from '../providers/ToastContext';
import { AuthProvider } from '../providers/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'HireFlow ATS | Modern Applicant Tracking & Recruitment Platform',
  description:
    'Full-stack Applicant Tracking System connecting enterprise companies, recruiters, and candidates with interactive Kanban pipelines, interview workflows, and deep recruitment analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col">
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <div className="flex-1 flex w-full">
              <Sidebar />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
