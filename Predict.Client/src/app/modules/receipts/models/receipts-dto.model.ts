export interface ReceiptDto {
  id: number;
  date: string | null;
  totalPrice: number | null;
  totalDiscount: number | null;
  products: PurchasedProductDto[];
  currency: string;
  provider: string;
}

export interface PurchasedProductDto {
  id: number;
  name: string;
  price: number | null;
  vat: number | null;
  quantity: number | null;
  quantityType: string;
  receiptId: number;
}
