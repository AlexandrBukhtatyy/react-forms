import './App.css';
import { useSignals } from '@preact/signals-react/runtime';
import TablePage from './pages/TablePage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';


function App() {
  useSignals();
  return (
    <>
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
        <TablePage/>
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default App;
