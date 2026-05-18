import { getUsers } from "@/app/actions/users";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { users, error } = await getUsers();

  if (error) {
    return <div className="p-8 text-red-500">Error loading users: {error}</div>;
  }

  return <UsersClient initialUsers={users || []} />;
}
