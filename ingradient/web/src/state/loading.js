import { create } from "zustand";

const useLoadingStore = create((set) => ({
  loading: false,
  progress: 0,
  loadingStatus: "Idle",

  setLoading: (loading) => set({ loading }),
  setProgress: (progress) => set({ progress }),
  setLoadingStatus: (loadingStatus) => set({ loadingStatus }),

  startLoading: () => set({ loading: true, progress: 0, loadingStatus: "Starting..." }),
  stopLoading: () => set({ loading: false, progress: 100, loadingStatus: "Completed" }),
}));

export default useLoadingStore;
