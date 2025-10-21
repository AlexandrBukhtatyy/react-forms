# Исследование: Вложенные формы в FormStore

## Цель
Разработать и предложить несколько архитектурных вариантов для поддержки вложенных форм (nested forms) и массивов форм (form arrays) в текущей реализации `FormStore`.

## Контекст проекта

### Текущая архитектура
- **FormStore** - главный класс для управления состоянием формы на основе сигналов (`@preact/signals-react`)
- **FieldController** - управление состоянием отдельного поля с валидацией
- **FormSchema** - схема конфигурации формы с метаданными полей
- **Валидация** - поддержка синхронных/асинхронных валидаторов, кросс-полевой валидации

### Существующая реализация
1. **Документация**: [docs/signals-in-angular/](docs/signals-in-angular/) - примеры и концепция из Angular Signal Forms
2. **Основной код**: [src/lib/forms/core/form-store.ts](src/lib/forms/core/form-store.ts)
3. **Практический пример**: [src/domains/credit-applications/form/](src/domains/credit-applications/form/)
   - Многошаговая форма заявки на кредит
   - Вложенные формы: `PassportDataForm`, `AddressForm`, `PersonalDataForm`
   - Массивы форм: `PropertyForm[]`, `ExistingLoanForm[]`, `CoBorrowerForm[]`

## Задача

### Что нужно исследовать
Предложить **3-5 вариантов** реализации вложенных форм с анализом:

1. **Вложенные формы (Nested Forms)**
   ```typescript
   // Пример: personalData как вложенная форма
   personalData: {
     lastName: string;
     firstName: string;
     middleName: string;
   }
   ```

2. **Массивы форм (Form Arrays)**
   ```typescript
   // Пример: массив имущества
   properties: Array<{
     type: string;
     value: number;
     description: string;
   }>
   ```

### Критерии оценки вариантов
Для каждого варианта проанализировать:
- **API и Developer Experience** - насколько удобно использовать
- **Типизация TypeScript** - type safety, автодополнение
- **Валидация** - как организована валидация вложенных форм
- **Реактивность** - работа с сигналами, производительность
- **Интеграция** - совместимость с существующим `FormStore`
- **Масштабируемость** - поддержка глубокой вложенности

### Требования к решению
1. Минимальные изменения в текущей архитектуре `FormStore`
2. Сохранение реактивности через сигналы
3. Поддержка валидации на всех уровнях вложенности
4. Type-safe API с выводом типов TypeScript
5. Удобное управление массивами форм (add, remove, reorder)

## Ожидаемый результат

### Формат ответа
Для каждого варианта предоставить:

1. **Описание подхода** - краткая концепция
2. **Пример API** - как будет выглядеть код использования
3. **Пример схемы** - как определяется вложенная форма в `FormSchema`
4. **Преимущества** - что хорошо в этом подходе
5. **Недостатки** - какие есть ограничения/проблемы
6. **Код реализации** (опционально) - ключевые фрагменты

### Дополнительно
- Рекомендация по выбору оптимального варианта
- Сравнительная таблица вариантов
- План поэтапной реализации выбранного варианта

## Источники для изучения
1. [docs/signals-in-angular/SIGNAL_FORMS_COMPLETE_GUIDE.md](docs/signals-in-angular/SIGNAL_FORMS_COMPLETE_GUIDE.md)
2. [docs/CREDIT_APPLICATION_IMPLEMENTATION.md](docs/CREDIT_APPLICATION_IMPLEMENTATION.md)
3. [src/lib/forms/core/form-store.ts](src/lib/forms/core/form-store.ts)
4. [src/domains/credit-applications/form/components/CreditApplicationForm.tsx](src/domains/credit-applications/form/components/CreditApplicationForm.tsx)
5. Angular Signal Forms - https://www.angulararchitects.io/blog/all-about-angulars-new-signal-forms/