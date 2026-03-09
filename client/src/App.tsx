import { createContext, useContext, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppContextValue, ModalState, CalendarEvent } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import CalendarView from './components/CalendarView.tsx';
import ChoreModal from './components/ChoreModal.tsx';
import EventPopover from './components/EventPopover.tsx';

const queryClient = new QueryClient();

export const AppContext = createContext<AppContextValue>({} as AppContextValue);
export const useApp = () => useContext(AppContext);

function AppInner() {
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null);

  const toggleMember = useCallback((id: number) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((id: number) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const openCreate = useCallback((prefillDate?: string) => {
    setPopoverEvent(null);
    setModalState({ type: 'create', prefillDate });
  }, []);

  const openEdit = useCallback((choreId: number) => {
    setPopoverEvent(null);
    setModalState({ type: 'edit', choreId });
  }, []);

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), []);

  return (
    <AppContext.Provider value={{
      selectedMemberIds, selectedCategoryIds,
      toggleMember, toggleCategory,
      modalState, openCreate, openEdit, closeModal,
      popoverEvent, setPopoverEvent,
    }}>
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <CalendarView />
        </main>
      </div>
      {modalState.type !== 'closed' && <ChoreModal />}
      {popoverEvent && <EventPopover />}
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
