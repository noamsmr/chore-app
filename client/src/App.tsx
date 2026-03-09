import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppContextValue, ModalState, CalendarEvent, MemberModalState, CategoryModalState } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import CalendarView from './components/CalendarView.tsx';
import ChoreModal from './components/ChoreModal.tsx';
import EventPopover from './components/EventPopover.tsx';
import MemberModal from './components/MemberModal.tsx';
import CategoryModal from './components/CategoryModal.tsx';

const queryClient = new QueryClient();

export const AppContext = createContext<AppContextValue>({} as AppContextValue);
export const useApp = () => useContext(AppContext);

function AppInner() {
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null);
  const [memberModal, setMemberModal] = useState<MemberModalState>({ open: false });
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>({ open: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

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

  const openMemberModal = useCallback((memberId?: number) => {
    setMemberModal({ open: true, memberId });
  }, []);
  const closeMemberModal = useCallback(() => setMemberModal({ open: false }), []);

  const openCategoryModal = useCallback((categoryId?: number) => {
    setCategoryModal({ open: true, categoryId });
  }, []);
  const closeCategoryModal = useCallback(() => setCategoryModal({ open: false }), []);

  return (
    <AppContext.Provider value={{
      selectedMemberIds, selectedCategoryIds,
      toggleMember, toggleCategory,
      modalState, openCreate, openEdit, closeModal,
      popoverEvent, setPopoverEvent,
      memberModal, categoryModal,
      openMemberModal, openCategoryModal,
      closeMemberModal, closeCategoryModal,
      dark, setDark,
      sidebarOpen, setSidebarOpen,
    }}>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <CalendarView />
        </main>
      </div>
      {modalState.type !== 'closed' && <ChoreModal />}
      {popoverEvent && <EventPopover />}
      {memberModal.open && <MemberModal />}
      {categoryModal.open && <CategoryModal />}
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
