"use client";

import { useState } from "react";
import { createUser } from '@/actions/api';

export default function CreateUserForm() {
  const [name, setName] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void createUser({name}).catch((err) => alert(err))
  };

  return (
    <div className="p-8 bg-slate-200 rounded-lg">
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
            Jméno
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="text-slate-900 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="px-3 py-2 self-end bg-slate-600 rounded-md hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:outline-none"
          disabled={name.length === 0}
        >
          Přidat
        </button>
      </form>
    </div>
  );
}
