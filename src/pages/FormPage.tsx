import UsersForm from '@/domains/users/form/components/UsersForm';

function FormPage() {
  return (
    <>
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Форма пользователя</h1>
        <UsersForm/>
      </div>
    </>
  );
}

export default FormPage;
