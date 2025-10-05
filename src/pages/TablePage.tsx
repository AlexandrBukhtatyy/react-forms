import UsersTable from "@/domains/users/table/components/UsersTable";

function TablePage() {

  return (
    <>
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
        <UsersTable/>
      </div>
    </>
  );
}

export default TablePage;
