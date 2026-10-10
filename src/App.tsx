/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SurplusLinkProvider, useSurplusLink } from './context/SurplusLinkContext';
import { ToastProvider } from './components/shared/Toast';
import { TopBar } from './components/shared/TopBar';
import { ProviderShell } from './components/ProviderShell';
import { NgoShell } from './components/NgoShell';

function MainAppShell() {
  const { activeRole } = useSurplusLink();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Simple Top Bar with logo, role switcher, and notification bell */}
      <TopBar />

      {/* Main View Area - fully responsive with max-w-7xl */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeRole === 'provider' ? <ProviderShell /> : <NgoShell />}
      </main>

      {/* Footer with only one short line about estimates */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center">
        <p className="text-xs text-slate-500 max-w-7xl mx-auto px-4 leading-normal">
          Distance savings and travel durations are estimates calculated via OSRM road network routing.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SurplusLinkProvider>
      <ToastProvider>
        <MainAppShell />
      </ToastProvider>
    </SurplusLinkProvider>
  );
}
