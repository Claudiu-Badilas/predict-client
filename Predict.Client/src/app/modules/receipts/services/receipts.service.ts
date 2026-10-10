import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, from, map, mergeMap, Observable } from 'rxjs';
import {
  EncryptedData,
  EncryptionService,
} from 'src/app/core/services/encryption.service';
import { LoanEncryptionKeyBase64 } from '../../loan/services/loan.service';
import { ReceiptDomain } from '../models/receipts-domain.model';
import { ReceiptDto } from '../models/receipts-dto.model';

@Injectable({ providedIn: 'root' })
export class ReceiptsService {
  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _encryptionService: EncryptionService,
  ) {}

  getReceipts(startDate: Date, endDate: Date): Observable<ReceiptDomain[]> {
    return this.getReceiptDtos().pipe(
      map((dtos) => dtos.map((dto) => new ReceiptDomain(dto))),
      catchError((error: Error) => {
        console.error(
          'Could not load data; falling back to the loan API.',
          error.message,
        );
        return this._httpClient
          .get<ReceiptDto[]>(
            `https://localhost:8080/api/v1/receipts?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          )
          .pipe(
            mergeMap((dtos) =>
              from(
                this._encryptionService.encode<ReceiptDto>(
                  dtos,
                  LoanEncryptionKeyBase64,
                ),
              ).pipe(
                map((encoded) => {
                  // console.warn('🚀 ~ encoded', JSON.stringify(encoded));
                  return dtos.map((dto) => new ReceiptDomain(dto));
                }),
              ),
            ),
          );
      }),
    );
  }

  private getReceiptDtos(): Observable<ReceiptDto[]> {
    return this._httpClient
      .get<EncryptedData>('assets/data/receipts-data.txt')
      .pipe(
        mergeMap((encrypted) =>
          from(
            this._encryptionService.decode<ReceiptDto>(
              encrypted,
              LoanEncryptionKeyBase64,
            ),
          ),
        ),
      );
  }
}
