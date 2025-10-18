import UsersTable from "@/domains/users/table/components/UsersTable";

function TablePage() {

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Таблица пользователей</h1>
      <UsersTable/>
    </>
  );
}

export default TablePage;
