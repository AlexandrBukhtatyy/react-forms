import CreditApplicationForm from '@/domains/credit-applications/form/CreditApplicationForm';

function CreditFormPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Заявка на кредит</h1>
      <CreditApplicationForm />
    </>
  );
}

export default CreditFormPage;
