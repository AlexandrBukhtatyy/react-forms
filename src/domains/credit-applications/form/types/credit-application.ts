// ============================================================================
// Базовые типы
// ============================================================================

export type LoanType = 'consumer' | 'mortgage' | 'car' | 'business' | 'refinancing';
export type EmploymentStatus = 'employed' | 'selfEmployed' | 'unemployed' | 'retired' | 'student';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type PropertyType = 'apartment' | 'house' | 'car' | 'land' | 'none';
export type EducationLevel = 'secondary' | 'specialized' | 'higher' | 'postgraduate';

// ============================================================================
// Вложенные интерфейсы
// ============================================================================

/**
 * Личные данные (вложенная форма)
 */
export interface PersonalData {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  birthPlace: string;
  gender: 'male' | 'female';
}

/**
 * Паспортные данные (вложенная форма)
 */
export interface PassportData {
  series: string;
  number: string;
  issueDate: string;
  issuedBy: string;
  departmentCode: string;
}

/**
 * Адрес (вложенная форма)
 */
export interface Address {
  region: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  postalCode: string;
}

// ============================================================================
// Элементы массивов
// ============================================================================

export interface PropertyItem {
  id?: string;
  type: PropertyType;
  description: string;
  estimatedValue: number;
  hasEncumbrance: boolean;
}

export interface ExistingLoan {
  id?: string;
  bank: string;
  type: string;
  amount: number;
  remainingAmount: number;
  monthlyPayment: number;
  maturityDate: string;
}

export interface CoBorrower {
  id?: string;
  personalData: {
    lastName: string;
    firstName: string;
    middleName: string;
    birthDate: string;
  };
  phone: string;
  email: string;
  relationship: string;
  monthlyIncome: number;
}

// ============================================================================
// Основной интерфейс формы
// ============================================================================

export interface CreditApplicationForm {
  // Шаг 1: Основная информация
  loanType: LoanType;
  loanAmount: number;
  loanTerm: number;
  loanPurpose: string;

  // Специфичные поля для ипотеки
  propertyValue?: number;
  initialPayment?: number;

  // Специфичные поля для автокредита
  carBrand?: string;
  carModel?: string;
  carYear?: number;
  carPrice?: number;

  // Шаг 2: Персональные данные
  personalData: PersonalData;
  passportData: PassportData;
  inn: string;
  snils: string;

  // Шаг 3: Контактная информация
  phoneMain: string;
  phoneAdditional?: string;
  email: string;
  emailAdditional?: string;
  registrationAddress: Address;
  sameAsRegistration: boolean;
  residenceAddress?: Address;

  // Шаг 4: Информация о занятости
  employmentStatus: EmploymentStatus;
  companyName?: string;
  companyInn?: string;
  companyPhone?: string;
  companyAddress?: string;
  position?: string;
  workExperienceTotal?: number;
  workExperienceCurrent?: number;
  monthlyIncome: number;
  additionalIncome?: number;
  additionalIncomeSource?: string;
  businessType?: string;
  businessInn?: string;
  businessActivity?: string;

  // Шаг 5: Дополнительная информация
  maritalStatus: MaritalStatus;
  dependents: number;
  education: EducationLevel;
  hasProperty: boolean;
  properties?: PropertyItem[];
  hasExistingLoans: boolean;
  existingLoans?: ExistingLoan[];
  hasCoBorrower: boolean;
  coBorrowers?: CoBorrower[];

  // Шаг 6: Согласия
  agreePersonalData: boolean;
  agreeCreditHistory: boolean;
  agreeMarketing: boolean;
  agreeTerms: boolean;
  confirmAccuracy: boolean;
  electronicSignature: string;
}
