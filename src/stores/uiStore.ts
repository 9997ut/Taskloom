import { create } from 'zustand';

interface UiState {
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // filter draft state for list view
  filterDraft: Record<string, unknown>;
  setFilterDraft: (draft: Record<string, unknown>) => void;
  resetFilterDraft: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  filterDraft: {},
  setFilterDraft: (draft) => set({ filterDraft: draft }),
  resetFilterDraft: () => set({ filterDraft: {} }),
}));
