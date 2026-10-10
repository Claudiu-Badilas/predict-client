import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import {
  EncryptedData,
  EncryptionService,
} from 'src/app/core/services/encryption.service';
import { RepaymentSchedule, RepaymentScheduleDto } from '../models/loan.model';

export const LoanEncryptionKeyBase64 = 'LoanEncryptionKeyBase64';

@Injectable({ providedIn: 'root' })
export class LoanService {
  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _encryptionService: EncryptionService,
  ) {}

  getRepaymentSchedules(): Observable<RepaymentSchedule[]> {
    return this.getRepaymentScheduleDtos().pipe(
      map((dtos) => dtos.map((dto) => new RepaymentSchedule(dto))),
      catchError((error: Error) => {
        console.error(
          'Could not load data; falling back to the loan API.',
          error.message,
        );
        return this._httpClient
          .get<RepaymentScheduleDto[]>('https://localhost:8080/api/v1/loan/bcr')
          .pipe(
            mergeMap((dtos) =>
              from(
                this._encryptionService.encode<RepaymentScheduleDto>(
                  dtos,
                  LoanEncryptionKeyBase64,
                ),
              ).pipe(
                map((encoded) => {
                  //console.warn('🚀 ~ encoded', JSON.stringify(encoded));
                  return dtos.map((dto) => new RepaymentSchedule(dto));
                }),
              ),
            ),
          );
      }),
    );
  }

  private getRepaymentScheduleDtos(): Observable<RepaymentScheduleDto[]> {
    return this._httpClient
      .get<EncryptedData>('assets/data/loan-data.txt')
      .pipe(
        mergeMap((encrypted) =>
          from(
            this._encryptionService.decode<RepaymentScheduleDto>(
              encrypted,
              LoanEncryptionKeyBase64,
            ),
          ),
        ),
      );
  }
}
