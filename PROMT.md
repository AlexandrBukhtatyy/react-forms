# Проблема: Разделение логики шагов и валидации формы

## Контекст

**Текущая реализация**: [CreditApplicationForm](src/domains/credit-applications/form/components/CreditApplicationForm.tsx)

В файле [create-credit-application-form.ts:37-45](src/domains/credit-applications/form/schemas/create-credit-application-form.ts#L37-L45) состояние шагов (`currentStep`, `completedSteps`) хранится внутри `GroupNode` формы как обычные поля.

```typescript
const schema = {
  currentStep: { value: 1, component: () => null },
  completedSteps: { value: [] as number[], component: () => null },
  // ... остальные поля формы
}
```

## Проблемы текущего подхода

1. **Нарушение Single Responsibility Principle**:
   - `GroupNode` отвечает за данные формы И за UI-состояние навигации
   - Смешение доменной модели (данные заявки) с UI-состоянием (шаги)

2. **Сложность переиспользования**:
   - Невозможно использовать форму без логики шагов
   - Схему валидации нельзя применить к отдельному шагу

3. **Типизация**:
   - `currentStep`/`completedSteps` попадают в тип `CreditApplicationForm`
   - Эти поля отправляются на сервер при `getValue()`, хотя они не являются частью доменной модели

## Требования к решению

### 1. Разделение ответственности
- **GroupNode** должен содержать только данные формы (поля заявки)
- **Состояние шагов** должно храниться отдельно (React state, отдельный Store, или специальный класс)

### 2. Валидация по шагам
Нужна возможность создавать отдельные схемы валидации для каждого шага и передавать их в метод `validate()`:

```typescript
// Схемы валидации для каждого шага
const step1ValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  required(path.loanType);
  required(path.loanAmount);
  // ... только поля шага 1
};

const step2ValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  required(path.personalData.firstName);
  required(path.passportData.series);
  // ... только поля шага 2
};

const fullValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  // Вся валидация для всех шагов
  step1ValidationSchema(path);
  step2ValidationSchema(path);
  // ...
};

// Использование
await form.validate(step1ValidationSchema); // Валидация только шага 1
await form.validate(fullValidationSchema);  // Валидация всей формы при submit
```

### 3. Адаптация существующих компонентов
- Компоненты `NavigationButtons`, `StepIndicator` будут адаптированы под новую архитектуру
- Они должны работать с новым API управления шагами (React state / отдельный Store)
- Минимальные изменения в компонентах шагов (BasicInfoForm, PersonalInfoForm, и т.д.)

## Ожидаемые решения

Предложи **2-3 варианта архитектуры**, каждый с:

1. **Описание подхода** - как разделить состояние шагов и формы
2. **Пример кода** - как будет выглядеть использование
3. **Валидация по шагам** - как валидировать отдельный шаг
4. **Плюсы/минусы** - trade-offs каждого решения
5. **Миграционный путь** - как перейти от текущей реализации

## Дополнительный контекст

- **Архитектура**: GroupNode, FieldNode, ValidationSchema (см. [CLAUDE.md](CLAUDE.md))
- **Компоненты**: [NavigationButtons.tsx](src/lib/forms/components/other/NavigationButtons.tsx), [StepIndicator.tsx](src/lib/forms/components/other/StepIndicator.tsx)
- **Validation Schema**: [credit-application-validation.ts](src/domains/credit-applications/form/validation/credit-application-validation.ts)