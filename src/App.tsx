import './App.css';
import { useSignals } from '@preact/signals-react/runtime';
import TablePage from './pages/TablePage';
import FormPage from './pages/FormPage';
import { DialogProvider } from './context/DialogContext';


function App() {
  useSignals();
  return (
    <>
     <DialogProvider>
        <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
          <FormPage/>
          <hr />
          <TablePage/>
        </div>
      </DialogProvider>
    </>
  );
}

export default App;
