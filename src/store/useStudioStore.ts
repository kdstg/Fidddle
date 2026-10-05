import { create } from 'zustand';
import { DocumentField } from '@/types/document';

interface StudioState {
    fields: DocumentField[];
    selectedFieldId: string | null;
    activeRecipientId: string;
    currentPage: number;
    totalPages: number;

    // Actions
    setFields: (fields: DocumentField[]) => void;
    addField: (field: Omit<DocumentField, 'id'>) => void;
    updateFieldPosition: (id: string, xPct: number, yPct: number) => void;
    updateFieldSize: (id: string, widthPct: number, heightPct: number) => void;
    updateFieldValue: (id: string, value: string) => void;
    removeField: (id: string) => void;
    setSelectedFieldId: (id: string | null) => void;
    setActiveRecipientId: (recipientId: string) => void;
    setPageInfo: (currentPage: number, totalPages: number) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
    fields: [],
    selectedFieldId: null,
    activeRecipientId: 'signer_1',
    currentPage: 1,
    totalPages: 1,

    setFields: (fields) => set({ fields }),

    addField: (fieldData) =>
        set((state) => ({
            fields: [
                ...state.fields,
                {
                    ...fieldData,
                    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                },
            ],
        })),

    updateFieldPosition: (id, xPct, yPct) =>
        set((state) => ({
            fields: state.fields.map((field) =>
                field.id === id ? { ...field, xPct, yPct } : field
            ),
        })),

    updateFieldSize: (id, widthPct, heightPct) =>
        set((state) => ({
            fields: state.fields.map((field) =>
                field.id === id ? { ...field, widthPct, heightPct } : field
            ),
        })),

    updateFieldValue: (id, value) =>
        set((state) => ({
            fields: state.fields.map((field) =>
                field.id === id ? { ...field, value } : field
            ),
        })),

    removeField: (id) =>
        set((state) => ({
            fields: state.fields.filter((field) => field.id !== id),
            selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
        })),

    setSelectedFieldId: (selectedFieldId) => set({ selectedFieldId }),
    setActiveRecipientId: (activeRecipientId) => set({ activeRecipientId }),
    setPageInfo: (currentPage, totalPages) => set({ currentPage, totalPages }),
}));