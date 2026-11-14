import './globals.css';
import type { Metadata } from 'next';
import { ToastProvider } from '../providers/ToastContext';
import { AuthProvider } from '../providers/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'HireFlow ATS | Modern Recruitment Platform',
  description:
    'Enterprise-grade Applicant Tracking System connecting recruiters, candidates, and hiring managers with interactive Kanban pipelines, interview workflows, and deep analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-[#202033] bg-[#F5F6FA] min-h-screen flex flex-col selection:bg-[#EAE7FF] selection:text-[#6C5CE7]">
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <div className="flex-1 flex w-full relative">
              <Sidebar />
              <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 w-full max-w-[1600px] mx-auto transition-all duration-300">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
