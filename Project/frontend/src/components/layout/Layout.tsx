import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { EvidenceModal } from '../common/EvidenceModal';
import { useRepo } from '../../context/RepoContext';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeEvidence, setActiveEvidence } = useRepo();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopNavbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Detail / Evidence Modal */}
      <EvidenceModal
        finding={activeEvidence}
        onClose={() => setActiveEvidence(null)}
      />
    </div>
  );
};
