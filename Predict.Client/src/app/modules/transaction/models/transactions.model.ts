import { DateUtils } from 'src/app/shared/utils/date.utils';

export interface TransactionResponse {
  id: number | null;
  registrationDate: string | null;
  completionDate: string | null;
  amount: number | null;
  fee: number | null;
  currency: string | null;
  description: string | null;
  transactionType: string | null;
  provider: string | null;
  referenceId: number | null;
  identifier: string;
  account: string | null;
  documentFileName?: string | null;
  category: string;
  categoryLabel: string;
  serviceProvider: string | null;
  merchantName: string | null;
}

export enum TransactionCategory {
  MOBILE_BILL = 'mobile_bill',
  // Food & Dining
  SUPERMARKET = 'supermarket',
  RESTAURANT_FASTFOOD = 'restaurant_fastfood',
  CAFE_BAKERY = 'cafe_bakery',
  DELIVERY = 'delivery',

  // Transportation
  GAS_STATION = 'gas_station',
  TRANSPORT = 'transport',

  // Home & Utilities
  UTILITIES = 'utilities',
  RENT = 'rent',

  // Shopping
  SHOPPING = 'shopping',
  CLOTHING_ACCESSORIES = 'clothing_accessories',
  ELECTRONICS = 'electronics',
  HOME_IMPROVEMENT = 'home_improvement',
  SPORTS_OUTDOOR = 'sports_outdoor',

  // Health
  PHARMACY = 'pharmacy',
  HEALTHCARE = 'healthcare',
  GYM_FITNESS = 'gym_fitness',

  // Entertainment
  ENTERTAINMENT = 'entertainment',
  ONLINE_GAMING = 'online_gaming',
  SUBSCRIPTION = 'subscription',

  // Financial
  SALARY = 'salary',
  RECEIVED = 'received',
  INTERNAL_TRANSFER = 'internal_transfer',
  REFUNDS = 'refunds',
  BANK_FEES = 'bank_fees',
  ATM_WITHDRAWAL = 'atm_withdrawal',

  // Lifestyle
  ACCOMMODATION = 'travel_accommodation',
  EDUCATION = 'education',
  GIFTS = 'gifts',

  // Other
  TAXES_FINES = 'taxes_fines',
  OTHER = 'other',
}

export class TransactionDomain {
  id: number | null;
  registrationDate: Date | null;
  completionDate: Date | null;
  amount: number | null;
  fee: number | null;
  currency: string | null;
  description: string | null;
  transactionType: string | null;
  provider: string | null;
  referenceId: number | null;
  identifier: string;
  account: string | null;
  documentFileName?: string | null;
  category: TransactionCategory;
  categoryLabel: string;
  serviceProvider: string | null;
  merchantName: string | null;

  constructor(res: any) {
    Object.assign(this, res);

    this.registrationDate = DateUtils.fromSplittedStringToJsDate(
      res.registrationDate,
    );
    this.completionDate = DateUtils.fromSplittedStringToJsDate(
      res.completionDate,
    );

    this.category = res.category || TransactionCategory.OTHER;
    this.categoryLabel = res.categoryLabel || 'Other';
  }
}
