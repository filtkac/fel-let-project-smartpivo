import { create } from 'zustand';
import { User } from '@/actions/types';

interface StoreState {
  activeUser?: User;
  setActiveUser: (activeUser: User | undefined) => void;
}

const useStore = create<StoreState>((set) => ({
  setActiveUser: (activeUser: User | undefined) => set({ activeUser }),
}))

export default useStore;
