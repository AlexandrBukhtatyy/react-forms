export { Form } from './core/form';
export { FormField } from './core/form-field';
export { FormArrayManager } from './other/FormArrayManager';
export { NavigationButtons } from './other/NavigationButtons';
export { StepIndicator } from './other/StepIndicator';
export { type StepIndicatorProps } from './other/StepIndicator';
export { Input } from './fields/input';
export { InputPassword } from './fields/input-password';
export { InputSearch } from './fields/input-search';
export { InputFiles } from './fields/input-files';
export { Select } from './fields/select';
export { Textarea } from './fields/textarea';
export { Checkbox } from './fields/checkbox';
export { RadioGroup } from './fields/radio-group';
export { InputMask } from './fields/input-mask';

export type { FormFieldProps } from './core/form-field';

// Псевдонимы для удобства
export { Input as InputNumber } from './fields/input'; // type="number"
export { Input as InputDate } from './fields/input'; // type="date"
export { Input as InputEmail } from './fields/input'; // type="email"
export { InputMask as InputPhone } from './fields/input-mask';
