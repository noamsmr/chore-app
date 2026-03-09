export interface Member {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Chore {
  id: number;
  title: string;
  description: string | null;
  category_id: number | null;
  member_id: number | null;
  recurrence_type: RecurrenceType;
  start_date: string;
  end_date: string | null;
  recurrence_meta: number | null;
  interval_days: number | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  member?: Member | null;
}

export interface CalendarEvent {
  id: string;
  chore_id: number;
  title: string;
  start: Date;
  end: Date;
  date: string;
  category: Category | null;
  member: Member | null;
  completed: boolean;
  completion_id: number | null;
  allDay: true;
}

export interface Completion {
  id: number;
  chore_id: number;
  date: string;
  member_id: number | null;
  note: string | null;
  completed_at: string;
}

export type ModalState =
  | { type: 'closed' }
  | { type: 'create'; prefillDate?: string }
  | { type: 'edit'; choreId: number };

export interface AppContextValue {
  selectedMemberIds: Set<number>;
  selectedCategoryIds: Set<number>;
  toggleMember: (id: number) => void;
  toggleCategory: (id: number) => void;
  modalState: ModalState;
  openCreate: (prefillDate?: string) => void;
  openEdit: (choreId: number) => void;
  closeModal: () => void;
  popoverEvent: CalendarEvent | null;
  setPopoverEvent: (e: CalendarEvent | null) => void;
}
