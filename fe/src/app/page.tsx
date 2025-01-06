import { getUsers } from '@/actions/api';
import CreateUserForm from '@/components/CreateUserForm';
import ActiveUsers from '@/components/ActiveUsers';
import BeerRecords from '@/components/BeerRecords';
import AlcoholRecords from '@/components/AlcoholRecords';

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await getUsers();

  return (
    <div className="flex flex-col w-screen lg:h-screen items-center justify-center">
      <header className="mt-10">
        <h1 className="font-bold lg:text-6xl text-5xl leading-tight mb-4">
          SmartPivo 3000
        </h1>
      </header>
      <div className="grow flex flex-col items-center w-11/12">
        <CreateUserForm />
        <ActiveUsers users={users}/>
        <div className="flex mt-6 w-full lg:flex-row flex-col lg:space-x-4 lg:space-y-0 space-y-4">
          <BeerRecords />
          <AlcoholRecords />
        </div>
      </div>
      <footer className="my-5">
        <div className="flex flex-col">
          <p>Lékařská technika (LET) projekt 2025</p>
          <p>Filip Tkáč, František Krupička</p>
        </div>
      </footer>
    </div>
  );
}
