import { DateUtils } from 'src/app/shared/utils/date.utils';
import { PurchasedProductDto, ReceiptDto } from './receipts-dto.model';

export class ReceiptDomain {
  id: number;
  date: Date | null;
  totalPrice: number | null;
  totalDiscount: number | null;
  products: PurchasedProductDomain[];
  currency: string;
  provider: string;

  constructor(res: ReceiptDto) {
    Object.assign(this, res);

    this.date = DateUtils.fromSplittedStringToJsDate(res.date);
    this.products = res.products.map((p) => new PurchasedProductDomain(p));
  }
}

export class PurchasedProductDomain {
  id: number;
  name: string;
  price: number | null;
  vat: number | null;
  quantity: number | null;
  quantityType: string;
  receiptId: number;

  constructor(res: PurchasedProductDto) {
    Object.assign(this, res);
  }
}
