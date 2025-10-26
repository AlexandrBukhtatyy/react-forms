# Задача: Интеграция валидации в форму кредитной заявки

## Контекст

Проект прошел через масштабный рефакторинг модуля работы с формами:
- **Старая архитектура**: `FormStore` + `FieldController` (deprecated)
- **Новая архитектура**: `FormNode` → `GroupNode`, `FieldNode`, `ArrayNode`

Валидационные схемы уже написаны и готовы к использованию, но в текущей реализации формы валидация **закомментирована** и требует интеграции с новой архитектурой.

## Структура кода

### Валидационные схемы (готовы)
- **Главная схема**: [src/domains/credit-applications/form/validation/credit-application-validation.ts](src/domains/credit-applications/form/validation/credit-application-validation.ts)
- **Схемы по шагам**:
  - Шаг 1: [src/domains/credit-applications/form/validation/step1/basic-info-validation.ts](src/domains/credit-applications/form/validation/step1/basic-info-validation.ts)
  - Шаг 2: [src/domains/credit-applications/form/validation/step2/personal-data-validation.ts](src/domains/credit-applications/form/validation/step2/personal-data-validation.ts)
  - Шаг 3: [src/domains/credit-applications/form/validation/step3/contact-info-validation.ts](src/domains/credit-applications/form/validation/step3/contact-info-validation.ts)
  - Шаг 4: [src/domains/credit-applications/form/validation/step4/employment-validation.ts](src/domains/credit-applications/form/validation/step4/employment-validation.ts)
  - Шаг 5: [src/domains/credit-applications/form/validation/step5/additional-validation.ts](src/domains/credit-applications/form/validation/step5/additional-validation.ts)
  - Шаг 6: [src/domains/credit-applications/form/validation/step6/confirmation-validation.ts](src/domains/credit-applications/form/validation/step6/confirmation-validation.ts)

### Форма (требует доработки)
- **Компонент**: [src/domains/credit-applications/form/components/CreditApplicationForm.tsx](src/domains/credit-applications/form/components/CreditApplicationForm.tsx)
- **Схема формы**: [src/domains/credit-applications/form/schemas/create-credit-application-form.ts](src/domains/credit-applications/form/schemas/create-credit-application-form.ts#L526-L527) — валидация закомментирована

## Что нужно сделать

1. **Анализ совместимости**:
   - Проверить, совместимы ли текущие валидационные схемы с новой архитектурой `FormNode`
   - Выявить потенциальные проблемы с типизацией
   - Проверить корректность путей к вложенным полям (`personalData`, `passportData`, `addresses`)
   - Проверить работу с массивами форм (`properties`, `existingLoans`, `coBorrowers`)

2. **Интеграция валидации**:
   - Раскомментировать и активировать `form.applyValidationSchema(creditApplicationValidation)` в [create-credit-application-form.ts:526-527](src/domains/credit-applications/form/schemas/create-credit-application-form.ts#L526-L527)
   - Убедиться, что валидация применяется корректно для:
     - Простых полей (`loanAmount`, `email`, и т.д.)
     - Вложенных форм (`personalData.firstName`, `passportData.series`)
     - Массивов форм (`properties[0].type`, `coBorrowers[0].personalData.lastName`)
   - Протестировать условную валидацию (`applyWhen` для ипотеки/автокредита)
   - Проверить кросс-полевую валидацию (`validateTree`)

3. **Тестирование**:
   - Проверить отображение ошибок валидации в UI
   - Убедиться, что `form.valid` корректно вычисляется
   - Проверить срабатывание валидации при переходе между шагами
   - Протестировать финальную отправку формы

## Задание

**Предложи 2-3 варианта решения** с описанием плюсов/минусов каждого подхода:

1. **Вариант с минимальными изменениями** — просто раскомментировать валидацию и исправить типы
2. **Вариант с пошаговой валидацией** — использовать `STEP_VALIDATIONS` для валидации только текущего шага
3. **Вариант с оптимизацией** — улучшить производительность через lazy-валидацию или другие техники

Сохрани каждый вариант в отдельный MD-файл в каталоге [docs/](docs/):
- `docs/validation-solution-1-minimal.md`
- `docs/validation-solution-2-step-by-step.md`
- `docs/validation-solution-3-optimized.md`

Каждое решение должно содержать:
- Описание подхода
- Необходимые изменения кода (с примерами)
- Плюсы и минусы
- Рекомендации по использованию