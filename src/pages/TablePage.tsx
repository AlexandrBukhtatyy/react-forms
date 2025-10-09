import UsersTable from "@/domains/users/table/components/UsersTable";

function TablePage() {

  return (
    <>
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Таблица пользователей</h1>
        <UsersTable/>
      </div>
    </>
  );
}

export default TablePage;
