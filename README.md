Всю пошаговую форму можно запихнуть в один компонент - наверное так и надо будет сделать
- Resources
- Mocks
- Валидация массива вложенных форм
- Поправить схемы валидации в соответствии с контрактами
- поправить контракт для вложенных форм - выдает ошибку при попытке открыть форму - не совпадают типы - при инициализации прописываем сигнал и передаем контрол
- Настроить работу FormArrayManager
- Форма не должна знать о шагах - должен быть отдельный компонент в который мы передаем массив схем на каждый шаг (НУЖНО что бы можно было схемы в моменте проверять)

# Эксперементалный проект - песочници
Суть проекта найти серебрянную пулу в организации проекта на React
Что уже есть
- DDD
- Signals
- Immer
- Зародышь концепции работы с формами на сигналах
- TanStack ???
- Разделение версти и поведения - создание нового функционала простое а поведение стабильное

# TODO
- перенести логику переходов между шагами в отдельный компонент
- Сделать вложенные свойства под каждый шаг а не отдельные поля формы

По хорошему форма и валидация ничего не должна знать про шаги (индексы и тд)

Не Form а Control
не должно быть обращения form.controls.name => form.name
Придумать Тип обертку для того что бы можно было описывать простой интерфейс формы и его оборачивать в схему
Перенести посторяющуюся вертску внутрь компонента FormArrayManager
методы навигации по форме доожны быть в соответствующем компоненте



StepIndicator - Перенести в другое место
NavigationButtons - Перенести в другое место
Избавиться от completedSteps и currentStep


Порефакторить и упростить модуль
Написать подробный стайл гайд по использованию модуля работы с формами
Зарешать вопросы с валидацией


- FormArrayManager
 - сделать его как headless-компонент
- Мне не нравится формат как инициализируются passportData, personalData и других подобные
- Можно внедрить варианты для полей
- Сделать вложенность в форме CreditApplicationForm - по шагам
- Дополнить схему вложенными формами - каждый шаг как вложенная форма
- Дополнить схему массивом вложенных форм
    <h3>Имущество</h3> массив подформ
    <h3>Кредиты</h3> массив подформ
    <h3>Созаемщики</h3> массив подформ
- дополнить исследование - All About Angular’s New Signal Forms - https://www.angulararchitects.io/blog/all-about-angulars-new-signal-forms/

- Сделать компоненты таблицы независимыми
- Nested Forms, Form Arrays and Form Groups + Валидация каждой группы
- Реализовать большой пример
- Покрыть тестами
- Написать доку
- Поправить возвращаемые значения (Select + dataprovider, Search + dataprovider, Files + fileUploader)
- Добавить базовые поля форы (DataPicker + period, Segment, Checkbox, Radio)

# Мысли
В моделе храним id
В проксе дадим достум к состоянию самого компонента - выбранной пропсе например?

---

# Variant 5: Proxy-based Deep Access ✅

**Статус**: Реализовано (2025-10-21)

## Что реализовано

Полная реализация Variant 5 - архитектурного подхода для работы с вложенными формами через Proxy:

### Компоненты

- ✅ **DeepFormStore** - форма с поддержкой вложенных структур
- ✅ **GroupProxy** - proxy для вложенных групп полей
- ✅ **ArrayProxy** - proxy для массивов форм
- ✅ **DeepFormSchema** - типы для автоматического определения схемы
- ✅ **Полная типизация TypeScript** - автоматический вывод типов

### Возможности

```typescript
// Простые поля
form.controls.name.value = 'John';

// Вложенные формы
form.controls.address.city.value = 'Moscow';

// Массивы
form.controls.items.push({ title: 'New' });
form.controls.items[0].title.value = 'Updated';
form.controls.items.remove(0);

// Массивы с вложенными формами
form.controls.coBorrowers[0].personalData.firstName.value = 'John';
```

### Документация

- 📖 [VARIANT_5_README.md](./docs/VARIANT_5_README.md) - полная документация
- 📖 [VARIANT_5_IMPLEMENTATION_PLAN.md](./docs/VARIANT_5_IMPLEMENTATION_PLAN.md) - план реализации
- 📖 [VARIANT_5_IMPROVED_ARRAY_SYNTAX.md](./docs/VARIANT_5_IMPROVED_ARRAY_SYNTAX.md) - синтаксис массивов
- 📖 [COMPLETE_FORM_EXAMPLES.md](./docs/COMPLETE_FORM_EXAMPLES.md) - примеры форм

### Примеры

- ✅ [variant5-basic-example.tsx](./src/examples/variant5-basic-example.tsx) - базовый пример
- ✅ [variant5-credit-application.tsx](./src/examples/variant5-credit-application.tsx) - комплексная форма

### Архитектура

- **Flat хранилище** - поля хранятся с dot notation (`"address.city"`)
- **Proxy-based доступ** - элегантный API через JavaScript Proxy
- **Автоматическое определение типов** - из структуры схемы
- **Реактивность через Signals** - интеграция с @preact/signals-react

## Быстрый старт

```typescript
import { DeepFormStore, DeepFormSchema } from '@/lib/forms';

interface MyForm {
  name: string;
  address: {
    city: string;
  };
  items: Array<{
    title: string;
  }>;
}

const schema: DeepFormSchema<MyForm> = {
  name: { value: '', component: Input },
  address: {
    city: { value: '', component: Input },
  },
  items: [{
    title: { value: '', component: Input },
  }],
};

const form = new DeepFormStore(schema);

// Использование
form.controls.name.value = 'John';
form.controls.address.city.value = 'Moscow';
form.controls.items.push({ title: 'Item 1' });
```

Подробнее см. [VARIANT_5_README.md](./docs/VARIANT_5_README.md)