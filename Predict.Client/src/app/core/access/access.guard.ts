import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { AccessService } from './access.service';

export const accessGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const accessService = inject(AccessService);

  if (route.routeConfig?.path === 'loan') {
    const queryKey = route.queryParamMap.get('key');
    if (queryKey !== null) {
      return accessService.saveAccessKey(queryKey)
        ? true
        : router.createUrlTree(['/access-denied']);
    }
  }

  return accessService.ensureValidAccessKey()
    ? true
    : router.createUrlTree(['/access-denied']);
};
