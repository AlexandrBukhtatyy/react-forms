# Варианты реализации императивного API для модальных окон

## Вариант 1: Стэк модалок с Context API (рекомендуемый)

```typescript
// contexts/ModalContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ModalOptions {
  title?: string;
  description?: string;
  content: ReactNode;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

interface ModalInstance<T = any> {
  id: string;
  options: ModalOptions;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

interface ModalContextValue {
  open: <T = any>(options: ModalOptions) => Promise<T>;
  close: (id: string, result?: any) => void;
  closeAll: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modals, setModals] = useState<ModalInstance[]>([]);

  const open = <T = any,>(options: ModalOptions): Promise<T> => {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(7);
      setModals((prev) => [...prev, { id, options, resolve, reject }]);
    });
  };

  const close = (id: string, result?: any) => {
    const modal = modals.find((m) => m.id === id);
    if (modal) {
      modal.resolve(result);
      setModals((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const closeAll = () => {
    modals.forEach((m) => m.reject(new Error('All modals closed')));
    setModals([]);
  };

  return (
    <ModalContext.Provider value={{ open, close, closeAll }}>
      {children}
      {modals.map((modal) => (
        <Dialog
          key={modal.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) close(modal.id);
          }}
        >
          <DialogContent
            className={modal.options.className}
            onEscapeKeyDown={(e) => {
              if (modal.options.closeOnEsc === false) e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (modal.options.closeOnOverlayClick === false) e.preventDefault();
            }}
          >
            {(modal.options.title || modal.options.description) && (
              <DialogHeader>
                {modal.options.title && <DialogTitle>{modal.options.title}</DialogTitle>}
                {modal.options.description && <DialogDescription>{modal.options.description}</DialogDescription>}
              </DialogHeader>
            )}
            {modal.options.content}
          </DialogContent>
        </Dialog>
      ))}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
};
```

**Использование:**
```typescript
// В компоненте
const modal = useModal();

const handleClick = async () => {
  try {
    const result = await modal.open({
      title: 'Подтверждение',
      description: 'Вы уверены?',
      content: <ConfirmDialog />,
      closeOnOverlayClick: false,
    });
    console.log('Результат:', result);
  } catch (error) {
    console.log('Отменено');
  }
};

// В компоненте ConfirmDialog
const ConfirmDialog = () => {
  const modal = useModal();

  return (
    <DialogFooter>
      <Button onClick={() => modal.close(id, false)}>Отмена</Button>
      <Button onClick={() => modal.close(id, true)}>Подтвердить</Button>
    </DialogFooter>
  );
};
```

---

## Вариант 2: Singleton с EventEmitter

```typescript
// services/ModalService.ts
import { EventEmitter } from 'events';

class ModalService extends EventEmitter {
  private static instance: ModalService;
  private modalId = 0;

  static getInstance() {
    if (!this.instance) {
      this.instance = new ModalService();
    }
    return this.instance;
  }

  open<T = any>(options: ModalOptions): Promise<T> {
    const id = ++this.modalId;

    return new Promise((resolve, reject) => {
      this.emit('open', { id, options, resolve, reject });
    });
  }

  close(id: number, result?: any) {
    this.emit('close', { id, result });
  }
}

export const modal = ModalService.getInstance();
```

**Плюсы:** Можно вызывать из любого места без хуков
**Минусы:** Сложнее с типизацией и интеграцией с React

---

## Вариант 3: Confirm/Alert/Prompt хелперы

```typescript
// hooks/useConfirm.ts
export const useConfirm = () => {
  const modal = useModal();

  const confirm = async (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  }): Promise<boolean> => {
    return modal.open({
      title: options.title || 'Подтверждение',
      content: (
        <div>
          <p className="mb-4">{options.message}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => modal.close(id, false)}
            >
              {options.cancelText || 'Отмена'}
            </Button>
            <Button
              variant={options.variant || 'default'}
              onClick={() => modal.close(id, true)}
            >
              {options.confirmText || 'Подтвердить'}
            </Button>
          </DialogFooter>
        </div>
      ),
    });
  };

  const alert = async (message: string, title?: string) => {
    return modal.open({
      title: title || 'Внимание',
      content: (
        <div>
          <p className="mb-4">{message}</p>
          <DialogFooter>
            <Button onClick={() => modal.close(id)}>OK</Button>
          </DialogFooter>
        </div>
      ),
    });
  };

  const prompt = async (message: string, defaultValue = ''): Promise<string | null> => {
    return modal.open({
      title: 'Ввод данных',
      content: <PromptDialog message={message} defaultValue={defaultValue} />,
    });
  };

  return { confirm, alert, prompt };
};
```

---

## Вариант 4: С поддержкой форм и валидации

```typescript
// Расширенные опции
interface ModalOptions<T = any> {
  title?: string;
  description?: string;
  content: ReactNode | ((props: ModalContentProps<T>) => ReactNode);

  // Размеры
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Поведение
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showClose?: boolean;

  // Кастомизация
  className?: string;
  overlayClassName?: string;

  // Кнопки
  footer?: ReactNode | ((props: ModalContentProps<T>) => ReactNode);
  showDefaultFooter?: boolean;
  confirmText?: string;
  cancelText?: string;

  // Колбэки
  onOpen?: () => void;
  onClose?: (result?: T) => void;
  onConfirm?: () => T | Promise<T>;
  onCancel?: () => void;

  // Валидация
  validate?: (data: any) => boolean | Promise<boolean>;
}

interface ModalContentProps<T> {
  close: (result?: T) => void;
  data?: any;
  setData?: (data: any) => void;
}
```

---

## Вариант 5: С поддержкой модалок-wizard

```typescript
interface WizardStep {
  title: string;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

const openWizard = async (steps: WizardStep[]): Promise<any> => {
  return modal.open({
    content: <WizardModal steps={steps} />,
    closeOnOverlayClick: false,
    size: 'lg',
  });
};

// Использование
const result = await openWizard([
  {
    title: 'Шаг 1',
    content: <Step1Form />,
    validate: () => form.validate(),
  },
  {
    title: 'Шаг 2',
    content: <Step2Form />,
  },
]);
```

---

## Дополнительные фичи

### 1. **Анимации и переходы**
```typescript
const modal = useModal();

modal.open({
  content: <MyContent />,
  animation: 'slide-up' | 'fade' | 'zoom' | 'slide-right',
  duration: 300,
});
```

### 2. **Приоритеты и z-index**
```typescript
modal.open({
  content: <MyContent />,
  priority: 'high', // Будет выше других модалок
  zIndex: 9999,
});
```

### 3. **Persist состояния**
```typescript
modal.open({
  content: <MyContent />,
  persistOnRouteChange: true, // Не закрывать при смене маршрута
  persistKey: 'edit-user-modal', // Восстанавливать при refresh
});
```

### 4. **Loading состояние**
```typescript
const modalId = modal.open({ content: <MyForm /> });

// Показать loader в модалке
modal.setLoading(modalId, true);

// Обновить контент
modal.updateContent(modalId, <NewContent />);
```

### 5. **Nested модалки**
```typescript
modal.open({
  content: <ParentModal />,
  allowNested: true, // Разрешить открытие других модалок
  stackIndex: 0,
});
```

### 6. **Drag & Drop для модалок**
```typescript
modal.open({
  content: <MyContent />,
  draggable: true,
  resizable: true,
  initialPosition: { x: 100, y: 100 },
});
```

---

## 🏆 Моя рекомендация

**Вариант 1** (Context API) + **Вариант 3** (хелперы) + дополнительные фичи:
- ✅ Типобезопасность
- ✅ Стэк модалок (можно открыть несколько)
- ✅ Promise-based API
- ✅ Удобные хелперы confirm/alert/prompt
- ✅ Легко расширять

---

## Пример полной интеграции

### 1. Обернуть приложение в Provider
```typescript
// App.tsx
import { ModalProvider } from './contexts/ModalContext';

function App() {
  return (
    <ModalProvider>
      <YourApp />
    </ModalProvider>
  );
}
```

### 2. Использовать в компонентах
```typescript
// Любой компонент
import { useModal } from './contexts/ModalContext';
import { useConfirm } from './hooks/useConfirm';

function MyComponent() {
  const modal = useModal();
  const { confirm, alert } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      message: 'Удалить пользователя?',
      variant: 'destructive',
    });

    if (confirmed) {
      // Удаляем
      await alert('Пользователь удален');
    }
  };

  const handleEdit = async () => {
    const result = await modal.open({
      title: 'Редактирование',
      content: <UserEditForm userId={123} />,
      size: 'lg',
    });

    if (result) {
      console.log('Сохранено:', result);
    }
  };

  return (
    <>
      <Button onClick={handleDelete}>Удалить</Button>
      <Button onClick={handleEdit}>Редактировать</Button>
    </>
  );
}
```
