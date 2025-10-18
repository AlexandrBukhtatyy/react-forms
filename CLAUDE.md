# CLAUDE.md

Этот файл содержит руководство для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

Экспериментальный React-проект, исследующий "серебряную пулю" архитектуры, объединяющий DDD (Domain-Driven Design), Signals (@preact/signals-react) и Immer для управления состоянием. Основной фокус — создание надежной библиотеки форм и таблиц на основе сигналов с разделением представления и поведения.

**Язык кодовой базы**: Русский (комментарии, названия переменных, TODO).

## Команды

**Разработка**:
```bash
npm run dev          # Запуск dev-сервера Vite
npm run build        # Сборка проекта (TypeScript compiler + Vite build)
npm run lint         # Запуск ESLint
npm run preview      # Предпросмотр production-сборки
```

## Архитектура

### Ключевые концепции

**Управление состоянием на основе Signal**: Использует @preact/signals-react для реактивного состояния. Архитектура разделяет:
- **Stores**: Классовые хранилища с Signal-примитивами для реактивного состояния
- **Controllers**: Управляют состоянием отдельных полей/компонентов
- **Resources**: Стратегии загрузки данных (static, preload, partial, server-paginated и т.д.)

**Интеграция Immer**: Мутации состояния используют `produce` из Immer через утилиту `mutateSignal` для иммутабельных обновлений.

### Ключевые паттерны

**Архитектура форм** ([src/lib/forms/](src/lib/forms/)):
- `FormStore<T>`: Основной контейнер состояния формы, использующий Signal-based поля
- `FieldController<T>`: Состояние отдельного поля с валидацией, touched, dirty состояниями
- Схема валидации, вдохновленная Angular Signal Forms
- Поддержка синхронных/асинхронных валидаторов, кросс-полевой валидации, условной валидации
- Три триггера валидации: `change`, `blur`, `submit`

**Архитектура таблиц** ([src/lib/tables/](src/lib/tables/)):
- `TableStore<T>`: Управляет состоянием таблицы (data, UI, config) через единый Signal
- Паттерны ресурсов для различных стратегий загрузки данных:
  - `server-paginated`: Серверная пагинация
  - `client-paginated`: Клиентская пагинация
  - `static`: Статические данные
  - `infinite-scroll`: Бесконечная прокрутка
  - `cached`: Кешированные данные с инвалидацией
  - `hybrid`: Смешанная клиент/сервер логика

**Domain-Driven структура** ([src/domains/](src/domains/)):
```
domains/
  users/
    _shared/services/    # Общие сервисы домена
    form/
      components/        # UI компоненты форм
      resources/         # Ресурсы для форм (select, search, file-uploader)
    table/
      components/        # UI компоненты таблиц
      resources/         # Ресурсы для таблиц (status, role)
      store/            # Доменно-специфичное хранилище таблицы
```

### Ключевые файлы

- [src/lib/forms/core/form-store.ts](src/lib/forms/core/form-store.ts): Реализация класса FormStore
- [src/lib/forms/core/field-controller.ts](src/lib/forms/core/field-controller.ts): FieldController с логикой валидации
- [src/lib/tables/store/TableStore.ts](src/lib/tables/store/TableStore.ts): TableStore с полным управлением состоянием таблицы
- [src/examples/validation-example.ts](src/examples/validation-example.ts): Комплексные примеры API валидации

### Path Aliases

Проект использует алиас `@/*` для `./src/*` (настроено в [tsconfig.json](tsconfig.json) и [vite.config.ts](vite.config.ts)).

## TODO List (из README)

Текущие приоритеты разработки:
- Реализовать вложенные формы в CreditApplicationForm (пошагово)
- Добавить массивы вложенных форм (имущество, кредиты, созаемщики)
- Исследовать подход Angular Signal Forms
- Сделать компоненты таблицы независимыми
- Реализовать крупный пример с вложенными формами/массивами
- Добавить тестовое покрытие
- Написать документацию
- Исправить возвращаемые значения для компонентов Select, Search, Files
- Добавить базовые поля форм (DatePicker, period, Segment, Checkbox, Radio)
