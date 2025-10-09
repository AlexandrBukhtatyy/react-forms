import './App.css';
import { useSignals } from '@preact/signals-react/runtime';
import TablePage from './pages/TablePage';
import FormPage from './pages/FormPage';
import { ModalProvider } from './context/ModalContext';


function App() {
  useSignals();
  return (
    <>
     <ModalProvider>
        <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
          <FormPage/>
          <hr />
          <TablePage/>
        </div>
      </ModalProvider>
    </>
  );
}

export default App;
