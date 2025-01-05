'use server';

import { AlcoholRecord, BeerRecord, User } from '@/actions/types';
import { revalidatePath } from 'next/cache';

const apiRoot = 'http://localhost:8000';

export async function resetData() {
  await fetch(`${apiRoot}/reset`, { method: 'POST' });

  revalidatePath(`${apiRoot}/users`);
}

export async function getUsers() {
  const response = await fetch(`${apiRoot}/users`);
  return (await response.json()) as User[];
}

export async function createUser(user: Omit<User, 'id'>) {
  const response = await fetch(
    `${apiRoot}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user),
    }
  );

  revalidatePath(`${apiRoot}/users`)

  return (await response.json()) as User;
}

export async function getActiveUser() {
  const response = await fetch(`${apiRoot}/users/active`);
  return (await response.json()) as User;
}

export async function activateUser(userId: number) {
  const response = await fetch(
    `${apiRoot}/users/${userId}/activate`, {
      method: 'POST'
    }
  );

  return (await response.json()) as User;
}

export async function getBeerRecords(userId: number) {
  const response = await fetch(`${apiRoot}/users/${userId}/beer-records`);
  return (await response.json()) as BeerRecord[];
}

export async function getLatestBeerRecords(userId: number) {
  const response = await fetch(`${apiRoot}/users/${userId}/beer-records/latest`);
  return (await response.json()) as BeerRecord[];
}

export async function getAlcoholRecords(userId: number) {
  const response = await fetch(`${apiRoot}/users/${userId}/alcohol-records`);
  return (await response.json()) as AlcoholRecord[];
}
