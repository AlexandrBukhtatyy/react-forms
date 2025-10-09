// DialogContext.tsx
import React, { createContext, useState, useCallback, useContext, type ReactNode, type ComponentType } from "react";
import { Dialog, DialogContent } from "@/lib/ui/dialog";

type DialogState = {
  title: string;
  content: ComponentType<any>;
  onResolve: (value: any) => void;
};

type DialogContextType = {
  openDialog: (title: string, content: ComponentType<any>) => Promise<any>;
  closeDialog: (result?: any) => void;
};

export const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const openDialog = useCallback((title: string, content: ComponentType<any>) => {
    return new Promise<any>((resolve) => {
      setDialog({ title, content, onResolve: resolve });
    });
  }, []);

  const closeDialog = useCallback((result?: any) => {
    if (dialog?.onResolve) dialog.onResolve(result);
    setDialog(null);
  }, [dialog]);
  const ComponentInstance = dialog?.content
  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {dialog && (
        <Dialog open={!!dialog} onOpenChange={() => closeDialog()}>
          <DialogContent>
            { dialog.title && <h2 className="text-2xl font-bold">{dialog.title}</h2>}
            { ComponentInstance && <ComponentInstance openInDialog={ true }/> }
          </DialogContent>
        </Dialog>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
};
