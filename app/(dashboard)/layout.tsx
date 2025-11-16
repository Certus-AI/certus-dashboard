import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex flex-col flex-1">
        {/* Dashboard Header */}
        <DashboardHeader
          greeting="Good Morning, Gurveer"
          subtitle="See how Certus does during his 24/7 shift!"
          userName="GV"
        />

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50">{children}</div>
      </main>
    </div>
  );
}
