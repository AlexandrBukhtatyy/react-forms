# Mock API для загрузки данных кредитной заявки

## Описание

Этот модуль предоставляет имитацию загрузки данных кредитной заявки с сервера с задержкой 2 секунды.

## Использование

### Загрузка данных заявки

```typescript
import { useLoadCreditApplication } from '../hooks/useLoadCreditApplication';

function MyComponent() {
  const form = createCreditApplicationForm();

  // Загружаем заявку с ID '1' (или '2', или null для пустой формы)
  const { isLoading, error, dictionaries } = useLoadCreditApplication(form, '1');

  if (isLoading) return <Loader />;
  if (error) return <Error message={error} />;

  return <Form />;
}
```

### Имитация ошибок

```typescript
import { setSimulateError, getSimulateError } from './mock-credit-application-api';

// Включить имитацию ошибок
setSimulateError(true);

// Проверить текущее состояние
const isErrorSimulated = getSimulateError(); // true
```

### Доступные заявки

- **ID '1'**: Полная заявка на ипотеку
  - 2 объекта имущества
  - 1 существующий кредит
  - 1 созаемщик
  - Все поля заполнены

- **ID '2'**: Простая заявка на потребительский кредит
  - Базовые поля заполнены
  - Без имущества, кредитов и созаемщиков

- **null**: Пустая форма (новая заявка)

## Структура данных

### Справочники (Dictionaries)

```typescript
interface DictionariesResponse {
  banks: Array<{ value: string; label: string }>;      // 8 банков
  cities: Array<{ value: string; label: string }>;     // 10 городов
  propertyTypes: Array<{ value: string; label: string }>; // 4 типа
}
```

### Возвращаемое значение хука

```typescript
interface LoadingState {
  isLoading: boolean;           // Состояние загрузки
  error: string | null;         // Текст ошибки
  dictionaries: DictionariesResponse | null; // Загруженные справочники
}
```

## Особенности

1. **Автоматическое заполнение формы**: `form.setValue()` рекурсивно заполняет все поля, включая:
   - Вложенные объекты (personalData, passportData, addresses)
   - Массивы форм (properties, existingLoans, coBorrowers)

2. **Параллельная загрузка**: Данные заявки и справочники загружаются одновременно

3. **Задержка 2 секунды**: Имитирует реальную задержку сети

4. **Безопасность**: Поля согласий (шаг 6) не заполняются автоматически

## TODO: Интеграция справочников

В будущем справочники будут автоматически обновлять опции Select полей через:

```typescript
// Вариант 1: Resources (планируется)
form.registrationAddress.city.updateResource(dictionaries.cities);

// Вариант 2: updateComponentProps (если добавим в FieldNode)
form.registrationAddress.city.updateComponentProps({
  options: dictionaries.cities
});
```

Сейчас справочники доступны через `dictionaries` и могут использоваться вручную в компонентах.
