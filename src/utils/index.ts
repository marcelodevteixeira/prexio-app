import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function calculateItemTotal(item: {
  quantity: number;
  price: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
}) {
  if (item.wholesalePrice && item.wholesaleMinQty && item.quantity >= item.wholesaleMinQty) {
    return item.quantity * item.wholesalePrice;
  }
  return item.quantity * item.price;
}
