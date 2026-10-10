import { PurchasedProductDomain } from '../../models/receipts-domain.model';
import { ReceiptDomain } from './../../models/receipts-domain.model';

export class ReceiptsProductDomain {
  id: number;
  name: string;
  price: number | null;
  vat: number | null;
  quantity: number | null;
  quantityType: string;
  receiptId: number;
  purchasedDate: Date;
  provider: string;

  constructor(receipt: ReceiptDomain, product: PurchasedProductDomain) {
    Object.assign(this, product);

    this.purchasedDate = receipt.date;
    this.provider = receipt.provider;
  }
}
