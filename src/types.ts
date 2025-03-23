export interface User {
  id: string;
  name: string;
  country: string;
  currency: string;
  kycVerified: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sender: User;
  receiver: User;
  exchangeRate: number;
  timestamp: number;
}

export interface WalletBalance {
  currency: string;
  amount: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'crypto';
  icon: string;
  description: string;
}

export interface CheckoutDetails {
  email: string;
  mobile: string;
  amount: number;
  paymentMethod?: string;
  emailOtp?: string;
  mobileOtp?: string;
  emailVerified: boolean;
  mobileVerified: boolean;
}