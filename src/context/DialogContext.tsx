// ModalService.tsx
import React, { createContext, useState, useCallback, useContext, type ReactNode, type ComponentType } from "react";
import { Dialog, DialogContent } from "@/lib/ui/dialog";

type ModalState = {
  content: ComponentType<any>;
  onResolve: (value: any) => void;
};

type ModalContextType = {
  openModal: (content: ComponentType<any>) => Promise<any>;
  closeModal: (result?: any) => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ModalState | null>(null);

  const openModal = useCallback((content: ComponentType<any>) => {
    return new Promise<any>((resolve) => {
      setModal({ content, onResolve: resolve });
    });
  }, []);

  const closeModal = useCallback((result?: any) => {
    if (modal?.onResolve) modal.onResolve(result);
    setModal(null);
  }, [modal]);
  const ComponentInstance = modal?.content
  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modal && (
        <Dialog open={!!modal} onOpenChange={() => closeModal()}>
          <DialogContent>
            { ComponentInstance && <ComponentInstance/> }
            <button onClick={() => closeModal("Подтверждено")}>ОК</button>
          </DialogContent>
        </Dialog>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
};
