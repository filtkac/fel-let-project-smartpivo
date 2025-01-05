'use client';

import useStore from '@/store/store';
import { User } from '@/actions/types';
import { useEffect } from 'react';
import { activateUser, getActiveUser, resetData } from '@/actions/api';

interface ActiveUsersProps {
  users: User[];
}

export default function ActiveUsers({ users }: ActiveUsersProps) {
  const { activeUser, setActiveUser } = useStore();

  useEffect(() => {
    getActiveUser().then((res) => setActiveUser(res))
  }, [setActiveUser]);

  const handleActivateUser = (userId: number) => {
    activateUser(userId).then((res) => setActiveUser(res));
  };

  const handleReset = () => {
    resetData().then(() => {
      setActiveUser(undefined);
    })
  }

  return (
    <div className="mt-2 flex flex-col items-center">
      {users.length === 0 && <span className="mb-2">Nejprve je nutné vytvořit uživatele</span>}
      <div className="flex space-x-2">
        {users.map((user: User) => (
          <button
            key={user.id}
            className={`px-3 py-2 rounded-md text-slate-900 ${user.id === activeUser?.id ? 'bg-slate-200' : 'bg-slate-600 text-white hover:bg-slate-700'}`}
            onClick={() => handleActivateUser(user.id)}
          >
            {user.name}
          </button>
        ))}
        <button
          className="px-3 py-2 rounded-md text-white bg-red-600"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
