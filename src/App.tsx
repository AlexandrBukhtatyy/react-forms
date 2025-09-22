import { useState } from 'react';
import './App.css';
import { Button } from '@/components/ui/button';
import { signal } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import { Input } from './components/ui/input';
import { InputPassword } from './components/ui/input-password';
import { FormField } from './components/ui/form-field';
import { InputSearch } from './components/ui/input-search';
import {
  makeResource,
  type ResourceRequest,
  type ResourceResponse,
} from './forms/resource';
import { Form } from './components/ui/form';
import { cn } from '@/lib/utils';
import { InputFiles } from './components/ui/input-files';
import { setTimeout } from 'timers/promises';
// import { InputFiles } from './components/ui/input-files';

const form = {
  controls: {
    domain: signal({
      key: 'domain',
      value: '',
      errors: [{ message: 'isRequired' }, { message: 'isRequired 2' }],
    }),
    email: signal({
      key: 'email',
      value: '',
      errors: [{ message: 'isRequired' }, { message: 'isRequired 2' }],
    }),
    password: signal({
      key: 'password',
      value: '',
      errors: [{ message: 'isRequired' }, { message: 'isRequired 2' }],
    }),
    file: signal({
      key: 'files',
      value: '',
      errors: [{ message: 'isRequired' }, { message: 'isRequired 2' }],
    }),
  },
};

const resetFormHandler = () => {
  // form.reset();
};

const domainSearchResource = makeResource(async (params: ResourceRequest) => {
  const response = await setTimeout(1000, [1, 2, 3]);
  return {
    data: response,
  } as ResourceResponse;
});

const filesResource = makeResource(async (params: ResourceRequest) => {
  const response = await setTimeout(1000, [1, 2, 3]);
  return {
    data: response,
  } as ResourceResponse;
});

function App() {
  useSignals();
  return (
    <>
      <div className="flex w-full gap-8">
        <Form className="flex flex-col gap-4">
          <FormField
            type={InputSearch}
            control={form.controls.domain}
            resource={domainSearchResource}
          />
          <FormField type={Input} control={form.controls.email} />
          <FormField type={InputPassword} control={form.controls.password} />
          <FormField
            type={InputFiles}
            control={form.controls.file}
            resource={filesResource}
          />
          {/* TODO: form.controls.subForm form.controls.subForms */}
          <Button className="font-bold mt-6" onClick={() => resetFormHandler()}>
            Reset form
          </Button>
        </Form>
        <pre>{JSON.stringify(form.controls.email.value, null, ' ')}</pre>
      </div>
    </>
  );
}

export default App;
