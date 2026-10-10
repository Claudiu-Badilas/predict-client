import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { JsDateUtils } from 'src/app/shared/utils/js-date.utils';
import {
  TransactionDomain,
  TransactionResponse,
} from '../models/transactions.model';

export const TransactionService_STORAGE_KEY = 'Transactions_Cache_Oct_2026_v2';

interface TransactionsApiResponse {
  transactions?: TransactionResponse[];
  economii?: TransactionResponse[];
  Transactions?: TransactionResponse[];
  Economii?: TransactionResponse[];
}

export interface TransactionData {
  transactions: TransactionDomain[];
  economii: TransactionDomain[];
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private parsedPreview: TransactionsApiResponse | null = null;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly localStorage: LocalStorageService,
  ) {}

  getTransactions(startDate: Date, endDate: Date): Observable<TransactionData> {
    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);
    const cachedData = this.localStorage.getItem<
      TransactionResponse[] | TransactionsApiResponse
    >(TransactionService_STORAGE_KEY);
    const source$: Observable<TransactionsApiResponse | TransactionResponse[]> =
      cachedData
        ? of(cachedData)
        : this.httpClient
            .get<TransactionResponse[]>(
              'https://localhost:8080/api/v1/transactions',
            )
            .pipe(
              tap((data) =>
                this.localStorage.setItem(TransactionService_STORAGE_KEY, data),
              ),
            );

    return source$.pipe(
      map((data) => {
        const response = this.groupByAccount(data);
        const allTransactions = [
          ...response.transactions,
          ...response.economii,
        ];
        const hasUnstoredPreview =
          allTransactions.length > 0 &&
          allTransactions.some((transaction) => transaction.id == null);
        this.parsedPreview = hasUnstoredPreview ? response : null;
        return response;
      }),
      map((response: TransactionsApiResponse) => {
        const transactions = response.transactions ?? [];
        const economii = response.economii ?? [];
        return {
          transactions: this.filterByDate(transactions, rangeStart, rangeEnd),
          economii: this.filterByDate(economii, rangeStart, rangeEnd),
        };
      }),
    );
  }

  get canSaveParsedTransactions(): boolean {
    return this.parsedPreview !== null;
  }

  saveParsedTransactions(): Observable<TransactionData> {
    const preview = this.parsedPreview;
    if (!preview) {
      return throwError(
        () => new Error('There are no parsed files ready to save.'),
      );
    }

    return this.httpClient
      .post<TransactionResponse[]>(
        'https://localhost:8080/api/v1/transactions/import',
        preview,
      )
      .pipe(
        map((response) => {
          this.parsedPreview = null;
          const grouped = this.groupByAccount(response);
          return {
            transactions: this.convertToModels(grouped.transactions),
            economii: this.convertToModels(grouped.economii),
          };
        }),
      );
  }

  private groupByAccount(
    data: TransactionsApiResponse | TransactionResponse[],
  ): TransactionsApiResponse {
    if (Array.isArray(data)) {
      return {
        transactions: data.filter(
          (transaction) => !this.isEconomii(transaction),
        ),
        economii: data.filter((transaction) => this.isEconomii(transaction)),
      };
    }

    const mainTransactions = data.transactions ?? data.Transactions ?? [];
    const economiiTransactions = data.economii ?? data.Economii ?? [];
    const allTransactions = [
      ...mainTransactions.map((transaction) => ({
        ...transaction,
        account: transaction.account || 'main',
      })),
      ...economiiTransactions.map((transaction) => ({
        ...transaction,
        account: transaction.account || 'economii',
      })),
    ];

    return {
      transactions: allTransactions.filter(
        (transaction) => !this.isEconomii(transaction),
      ),
      economii: allTransactions.filter((transaction) =>
        this.isEconomii(transaction),
      ),
    };
  }

  private isEconomii(transaction: TransactionResponse): boolean {
    return transaction.account?.trim().toLocaleLowerCase() === 'economii';
  }

  private filterByDate(
    dtos: TransactionResponse[],
    rangeStart: Date,
    rangeEnd: Date,
  ): TransactionDomain[] {
    return this.convertToModels(dtos).filter((transaction) => {
      const transactionDate =
        transaction.completionDate ?? transaction.registrationDate;
      return (
        JsDateUtils.isValidDate(transactionDate) &&
        transactionDate >= rangeStart &&
        transactionDate <= rangeEnd
      );
    });
  }

  private convertToModels(dtos: TransactionResponse[]): TransactionDomain[] {
    return dtos.map((dto) => new TransactionDomain(dto));
  }
}
