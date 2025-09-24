import './App.css';
import { Button } from '@/components/ui/button';
import { signal } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import { Input } from './lib/forms/components/input';
import { InputPassword } from './lib/forms/components/input-password';
import { InputSearch } from './lib/forms/components/input-search';
import { InputFiles } from './lib/forms/components/input-files';
import { Select } from './lib/forms/components/select';
import { Form } from './lib/forms/components/form';
import { FormField } from './lib/forms/components/form-field';
import { form } from './lib/forms/core/forms';
import { inputSearchResource } from './lib/forms/resouces/input-search';
import { selectResource } from './lib/forms/resouces/select';
import { filesResource } from './lib/forms/resouces/files';
import { fileUploader } from './lib/forms/file-uploaders/file-uploader';

type FormModel = {
  input: string | null;
  password: string | null;
  search: string | null;
  select: string | null;
  files: string | null;
  array: Array<{input1: string; input2: string;}>;
}

const formModel = signal<FormModel>({
  input: null,
  password: null,
  search: null,
  select: null,
  files: null,
  array: [
    { 
      input1: 'input1', 
      input2: 'input2' 
    },
  ]
});

// const addressSchema = schema<Address>((addr) => {
//   required(addr.street);
//   required(addr.city);
//   required(addr.zipCode);
//   validate(addr.street, async ({value}) => await checkStreetExist(value()));
//   validate(addr.city, cityExistValidator);
//   validate(addr.zipCode, ({value}) => value() > 0 ? undefined : 'Zip Code должн быть больше 0');
// });

const formSchema = (f) => {
  // readonly(f.userId);
  // apply(f.adress, addressSchema)
}

const testForm = form(formModel, formSchema);

function App() {
  useSignals();
  return (
    <>
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
        <div className="flex w-full gap-8">
          <div>
            <Form className="flex flex-col gap-4">
              <FormField control={testForm.input} type={Input} />
              <FormField control={testForm.password} type={InputPassword} />
              <FormField control={testForm.search} type={InputSearch} resource={inputSearchResource}/>
              <FormField control={testForm.select} type={Select} resource={selectResource}/>
              <FormField control={testForm.files} type={InputFiles} resource={filesResource} uploader={fileUploader}/>
              {testForm.array.map((formGroup, index, arr) => {
                return (
                <div key={index} className="p-2 border border-gray-300 rounded-md bg-gray-50 space-y-2">
                  <FormField control={formGroup.input1} type={Input} />
                  <FormField control={formGroup.input2} type={Input} />
                </div>
              )})}
              {/* TODO: form.subForm form.subForms */}
              <Button className="font-bold mt-6" onClick={() => testForm.reset()}>
                Reset form
              </Button>
            </Form>
          </div>
          <div>
            <h2>testForm</h2>
            <pre>{JSON.stringify(testForm.value, null, ' ')}</pre>
          </div>
            <div>
            <h2>formModel</h2>
            <pre>{JSON.stringify(formModel, null, ' ')}</pre>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
