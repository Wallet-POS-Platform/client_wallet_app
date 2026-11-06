export type Wallet = {
  id: string;
  name: string;
  balance: number;
  disabled?: boolean;
};

export type Transaction = {
  id: string;
  walletId: string;
  title: string;
  dateGroup: string;
  dateText: string;
  amount: number;
};

export type SavedWalletState = {
  wallets: Wallet[];
  transactions: Transaction[];
  profileName: string;
  offlineLimit: number;
  twoFactor: boolean;
  paymentNotifications: boolean;
};

export const STORAGE_KEY = 'student-wallet-preview-v1';

export const initialWallets: Wallet[] = [
  { id: 'main', name: 'Main wallet', balance: 245.8 },
  { id: 'food', name: 'Food', balance: 85 },
  { id: 'books', name: 'Books', balance: 40 },
  { id: 'transport', name: 'Transport', balance: 25.5 },
  { id: 'other', name: 'Other', balance: 12 },
  { id: 'travel', name: 'Travel', balance: 0, disabled: true },
];

export const initialTransactions: Transaction[] = [
  {
    id: 'food-cafeteria',
    walletId: 'food',
    title: 'Campus Cafeteria',
    dateGroup: 'Today',
    dateText: 'Today · 12:42',
    amount: -8.5,
  },
  {
    id: 'main-cafeteria',
    walletId: 'main',
    title: 'Campus Cafeteria',
    dateGroup: 'Today',
    dateText: 'Today · 12:42',
    amount: -8.5,
  },
  {
    id: 'main-top-up',
    walletId: 'main',
    title: 'Wallet top-up',
    dateGroup: 'Today',
    dateText: 'Today · 09:18',
    amount: 50,
  },
  {
    id: 'food-coffee',
    walletId: 'food',
    title: 'Coffee Corner',
    dateGroup: 'Today',
    dateText: 'Today · 08:50',
    amount: -3.2,
  },
  {
    id: 'main-store',
    walletId: 'main',
    title: 'University Store',
    dateGroup: 'Yesterday',
    dateText: 'Yesterday · 15:32',
    amount: -4.2,
  },
  {
    id: 'main-coffee',
    walletId: 'main',
    title: 'Coffee Corner',
    dateGroup: 'Yesterday',
    dateText: 'Yesterday · 11:05',
    amount: -3.8,
  },
  {
    id: 'food-bistro',
    walletId: 'food',
    title: 'Campus Bistro',
    dateGroup: 'Yesterday',
    dateText: 'Yesterday · 13:10',
    amount: -6.9,
  },
  {
    id: 'transport-train',
    walletId: 'transport',
    title: 'Train ticket',
    dateGroup: 'Last month',
    dateText: '12 Oct · 08:42',
    amount: -18.4,
  },
  {
    id: 'books-transfer',
    walletId: 'books',
    title: 'Wallet transfer',
    dateGroup: 'Last month',
    dateText: '10 Oct · 17:20',
    amount: 30,
  },
];

export function formatMoney(value: number) {
  return `€ ${value.toFixed(2)}`;
}
