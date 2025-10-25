/**
 * ValidationRegistry - система регистрации и применения валидаторов
 *
 * Работает как стек контекстов:
 * 1. При вызове validation schema функции создается новый контекст
 * 2. Все вызовы validate(), applyWhen() и т.д. регистрируют валидаторы в текущем контексте
 * 3. После завершения схемы валидаторы применяются к GroupNode
 */

import type { GroupNode } from '../core/nodes/group-node';
import type {
  ValidatorRegistration,
  ContextualValidatorFn,
  ContextualAsyncValidatorFn,
  TreeValidatorFn,
  ConditionFn,
  ValidateOptions,
  ValidateAsyncOptions,
  ValidateTreeOptions,
} from '../types/validation-schema';

/**
 * Контекст регистрации валидаторов
 */
class RegistrationContext {
  private validators: ValidatorRegistration[] = [];
  private conditionStack: Array<{ fieldPath: string; conditionFn: ConditionFn }> = [];

  /**
   * Добавить валидатор в контекст
   */
  addValidator(registration: ValidatorRegistration): void {
    // Если есть активные условия, добавляем их к валидатору
    if (this.conditionStack.length > 0) {
      const condition = this.conditionStack[this.conditionStack.length - 1];
      registration.condition = condition;
    }

    this.validators.push(registration);
  }

  /**
   * Войти в условный блок
   */
  enterCondition(fieldPath: string, conditionFn: ConditionFn): void {
    this.conditionStack.push({ fieldPath, conditionFn });
  }

  /**
   * Выйти из условного блока
   */
  exitCondition(): void {
    this.conditionStack.pop();
  }

  /**
   * Получить все зарегистрированные валидаторы
   */
  getValidators(): ValidatorRegistration[] {
    return this.validators;
  }
}

/**
 * Глобальный реестр валидаторов
 */
class ValidationRegistryClass {
  private contextStack: RegistrationContext[] = [];
  private formStoreMap = new WeakMap<GroupNode<any>, ValidatorRegistration[]>();

  /**
   * Начать регистрацию валидаторов для формы
   */
  beginRegistration(): RegistrationContext {
    const context = new RegistrationContext();
    this.contextStack.push(context);
    return context;
  }

  /**
   * Завершить регистрацию и применить валидаторы к GroupNode
   */
  endRegistration<T>(form: GroupNode<T>): void {
    const context = this.contextStack.pop();
    if (!context) {
      throw new Error('No active registration context');
    }

    const validators = context.getValidators();
    this.formStoreMap.set(form, validators);

    // Применяем валидаторы к полям
    this.applyValidators(form, validators);
  }

  /**
   * Получить текущий контекст регистрации
   */
  getCurrentContext(): RegistrationContext | undefined {
    return this.contextStack[this.contextStack.length - 1];
  }

  /**
   * Зарегистрировать синхронный валидатор
   */
  registerSync(
    fieldPath: string,
    validator: ContextualValidatorFn,
    options?: ValidateOptions
  ): void {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error(
        'Validators can only be registered inside a validation schema function'
      );
    }

    context.addValidator({
      fieldPath,
      type: 'sync',
      validator,
      options,
    });
  }

  /**
   * Зарегистрировать асинхронный валидатор
   */
  registerAsync(
    fieldPath: string,
    validator: ContextualAsyncValidatorFn,
    options?: ValidateAsyncOptions
  ): void {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error(
        'Validators can only be registered inside a validation schema function'
      );
    }

    context.addValidator({
      fieldPath,
      type: 'async',
      validator,
      options,
    });
  }

  /**
   * Зарегистрировать tree валидатор
   */
  registerTree(
    validator: TreeValidatorFn,
    options?: ValidateTreeOptions
  ): void {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error(
        'Validators can only be registered inside a validation schema function'
      );
    }

    context.addValidator({
      fieldPath: options?.targetField || '__tree__',
      type: 'tree',
      validator,
      options,
    });
  }

  /**
   * Войти в условный блок
   */
  enterCondition(fieldPath: string, conditionFn: ConditionFn): void {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error(
        'Conditions can only be used inside a validation schema function'
      );
    }

    context.enterCondition(fieldPath, conditionFn);
  }

  /**
   * Выйти из условного блока
   */
  exitCondition(): void {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error('No active condition');
    }

    context.exitCondition();
  }

  /**
   * Получить зарегистрированные валидаторы для GroupNode
   */
  getValidators<T>(form: GroupNode<T>): ValidatorRegistration[] | undefined {
    return this.formStoreMap.get(form);
  }

  /**
   * Применить зарегистрированные валидаторы к GroupNode
   * @private
   */
  private applyValidators<T>(form: GroupNode<T>, validators: ValidatorRegistration[]): void {
    // Группируем валидаторы по полям
    const validatorsByField = new Map<string, ValidatorRegistration[]>();

    for (const registration of validators) {
      if (registration.type === 'tree') {
        // Tree валидаторы обрабатываются отдельно
        continue;
      }

      const existing = validatorsByField.get(registration.fieldPath) || [];
      existing.push(registration);
      validatorsByField.set(registration.fieldPath, existing);
    }

    // Валидаторы сохранены в formStoreMap
    // Они будут применяться при вызове GroupNode.validate()
    console.log(`Registered ${validators.length} validators for GroupNode`);
  }
}

/**
 * Синглтон реестра валидаторов
 */
export const ValidationRegistry = new ValidationRegistryClass();
