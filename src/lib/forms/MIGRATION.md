# Migration Guide: v1 → v2

> Руководство по миграции на новую архитектуру FormNode

---

## Обзор изменений

### Основные изменения

1. **FormStore → GroupNode** - новое имя для формы-группы
2. **FieldController → FieldNode** - новое имя для поля
3. **Computed signals** - `form.valid` → `form.valid.value`
4. **Прямой доступ** - `form.controls.email` → `form.email` (опционально)
5. **ArrayNode** - встроенная поддержка массивов форм

---

## Breaking Changes

### 1. Геттеры заменены на computed signals

**До (v1):**
```typescript
const form = new FormStore({
  email: { value: '', component: Input },
});

if (form.valid) {  // ❌ boolean геттер
  console.log('Form is valid');
}
```

**После (v2):**
```typescript
const form = new GroupNode({
  email: { value: '', component: Input },
});

if (form.valid.value) {  // ✅ ReadonlySignal<boolean>
  console.log('Form is valid');
}
```

**Миграция:**
- Заменить `form.valid` → `form.valid.value`
- Заменить `form.invalid` → `form.invalid.value`
- Заменить `form.touched` → `form.touched.value`
- Заменить `form.dirty` → `form.dirty.value`
- Заменить `form.pending` → `form.pending.value`

### 2. FormStore → GroupNode (рекомендуется)

**До (v1):**
```typescript
import { FormStore } from '@/lib/forms';

const form = new FormStore({
  email: { value: '', component: Input },
});
```

**После (v2):**
```typescript
import { GroupNode } from '@/lib/forms';

const form = new GroupNode({
  email: { value: '', component: Input },
});
```

**Обратная совместимость:**
FormStore остается как алиас для GroupNode, поэтому старый код будет работать.

### 3. FieldController → FieldNode (рекомендуется)

**До (v1):**
```typescript
import { FieldController } from '@/lib/forms';

const field = new FieldController({
  value: '',
  component: Input,
});
```

**После (v2):**
```typescript
import { FieldNode } from '@/lib/forms';

const field = new FieldNode({
  value: '',
  component: Input,
});
```

**Обратная совместимость:**
FieldController остается как алиас для FieldNode.

---

## Новые возможности

### 1. Прямой доступ к полям (без .controls)

**До (v1):**
```typescript
form.controls.email.setValue('test@mail.com');
form.controls.password.markAsTouched();
```

**После (v2):**
```typescript
form.email.setValue('test@mail.com');
form.password.markAsTouched();
```

**Примечание:** Старый синтаксис через `.controls` также работает (deprecated).

### 2. ArrayNode - встроенная поддержка массивов

**До (v1):**
```typescript
import { DeepFormStore } from '@/lib/forms';

const form = new DeepFormStore({
  properties: [
    {
      title: { value: '', component: Input },
      price: { value: 0, component: Input },
    }
  ],
});

// Работа с массивом через ArrayProxy
form.controls.properties.push();
```

**После (v2):**
```typescript
import { GroupNode } from '@/lib/forms';

const form = new GroupNode({
  properties: [
    {
      title: { value: '', component: Input },
      price: { value: 0, component: Input },
    }
  ],
});

// Работа с ArrayNode
form.properties.push();
form.properties.removeAt(0);
form.properties.at(0)?.title.setValue('Item 1');
```

### 3. Интеграция ресурсов

**Новое в v2:**
```typescript
import { GroupNode, preloadResource } from '@/lib/forms';

const form = new GroupNode({
  role: {
    value: null,
    component: Select,
    resource: preloadResource(async () => {
      return await fetchRoles();
    }),
  },
});

// Доступ к состоянию загрузки
const loading = form.role.loading.value;
const items = form.role.resourceItems.value;
const error = form.role.resourceError.value;
```

### 4. Единый интерфейс FormNode

Все узлы (FieldNode, GroupNode, ArrayNode) наследуют от FormNode:

```typescript
function validateNode(node: FormNode<any>) {
  return node.validate();
}

// Работает для любого типа узла
validateNode(form.email);        // FieldNode
validateNode(form.personalData); // GroupNode
validateNode(form.properties);   // ArrayNode
```

---

## Пошаговая миграция

### Шаг 1: Обновить импорты (опционально)

```bash
# Найти все использования FormStore
grep -r "FormStore" src/

# Заменить на GroupNode
sed -i 's/FormStore/GroupNode/g' src/**/*.ts
sed -i 's/FieldController/FieldNode/g' src/**/*.ts
```

### Шаг 2: Обновить доступ к signals

```bash
# Найти все обращения к form.valid (без .value)
grep -r "\.valid[^.]" src/

# Заменить вручную или через IDE Find & Replace:
# form.valid → form.valid.value
# form.invalid → form.invalid.value
# и т.д.
```

### Шаг 3: Обновить доступ к полям (опционально)

```bash
# Найти все .controls.
grep -r "\.controls\." src/

# Заменить на прямой доступ:
# form.controls.email → form.email
```

### Шаг 4: Протестировать приложение

```bash
npm run build
npm run dev
# Ручное тестирование форм
```

---

## Обратная совместимость

### Что продолжает работать

✅ **FormStore** - алиас для GroupNode
✅ **FieldController** - алиас для FieldNode
✅ **DeepFormStore** - алиас для GroupNode
✅ **form.controls.field** - доступ через .controls (deprecated)

### Что изменилось (breaking)

❌ **form.valid** → требует `.value`
❌ **form.invalid** → требует `.value`
❌ **form.touched** → требует `.value`
❌ **form.dirty** → требует `.value`
❌ **form.pending** → требует `.value`

---

## Примеры миграции

### Пример 1: Простая форма

**До:**
```typescript
import { FormStore } from '@/lib/forms';

const loginForm = new FormStore({
  email: {
    value: '',
    component: Input,
    validators: [required, email],
  },
  password: {
    value: '',
    component: Input,
    validators: [required, minLength(8)],
  },
});

// Использование
if (loginForm.valid) {
  loginForm.submit(async (values) => {
    await login(values);
  });
}

loginForm.controls.email.setValue('test@mail.com');
```

**После:**
```typescript
import { GroupNode } from '@/lib/forms';

const loginForm = new GroupNode({
  email: {
    value: '',
    component: Input,
    validators: [required, email],
  },
  password: {
    value: '',
    component: Input,
    validators: [required, minLength(8)],
  },
});

// Использование
if (loginForm.valid.value) {  // ✅ Добавить .value
  loginForm.submit(async (values) => {
    await login(values);
  });
}

loginForm.email.setValue('test@mail.com');  // ✅ Без .controls
```

### Пример 2: Форма с массивом

**До:**
```typescript
import { DeepFormStore } from '@/lib/forms';

const form = new DeepFormStore({
  properties: [
    {
      title: { value: '', component: Input },
      price: { value: 0, component: Input },
    }
  ],
});

form.controls.properties.push();
form.controls.properties.remove(0);
```

**После:**
```typescript
import { GroupNode } from '@/lib/forms';

const form = new GroupNode({
  properties: [
    {
      title: { value: '', component: Input },
      price: { value: 0, component: Input },
    }
  ],
});

form.properties.push();          // ✅ Без .controls
form.properties.removeAt(0);     // ✅ Новое API
```

### Пример 3: React компонент

**До:**
```typescript
function LoginForm() {
  const form = new FormStore({
    email: { value: '', component: Input },
  });

  return (
    <div>
      <Input control={form.controls.email} />
      <button disabled={!form.valid}>Submit</button>
    </div>
  );
}
```

**После:**
```typescript
function LoginForm() {
  const form = new GroupNode({
    email: { value: '', component: Input },
  });

  return (
    <div>
      <Input control={form.email} />
      <button disabled={!form.valid.value}>Submit</button>
    </div>
  );
}
```

---

## Deprecation Warnings

Следующие элементы помечены как deprecated и будут удалены в версии 3.0:

- ⚠️ **FormStore** - используйте GroupNode
- ⚠️ **FieldController** - используйте FieldNode
- ⚠️ **DeepFormStore** - используйте GroupNode
- ⚠️ **form.controls.field** - используйте form.field

---

## FAQ

### Q: Нужно ли мигрировать немедленно?

A: Нет, старый код продолжит работать благодаря алиасам. Единственное breaking change - это добавление `.value` для signals.

### Q: Какая версия лучше - v1 или v2?

A: v2 значительно быстрее благодаря computed signals и имеет более чистый API.

### Q: Можно ли использовать FormStore и GroupNode одновременно?

A: Да, это один и тот же класс. FormStore = GroupNode.

### Q: Что делать если возникли проблемы?

A: Проверьте этот migration guide, или создайте issue в репозитории.

---

**Дата создания:** 2025-10-25
**Версия документа:** 1.0