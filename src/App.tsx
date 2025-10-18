import './App.css';
import { useSignals } from '@preact/signals-react/runtime';
import { Outlet } from 'react-router';
import { DialogProvider } from './context/DialogContext';
import { Header } from './components/Header';

function App() {
  useSignals();

  return (
    <DialogProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="w-full max-w-6xl mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </DialogProvider>
  );
}

export default App;
