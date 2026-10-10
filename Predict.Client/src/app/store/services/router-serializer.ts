import { RouterStateSnapshot, Params } from '@angular/router';
import { RouterStateSerializer } from '@ngrx/router-store';
import { Injectable } from '@angular/core';

export interface RouterState {
  url: string;
  params: Params;
  queryParams: Params;
}

@Injectable()
export class RouterSerializer implements RouterStateSerializer<RouterState> {
  serialize(routerState: RouterStateSnapshot): RouterState {
    let route = routerState.root;
    let params: Params = {};

    while (route.firstChild) {
      params = { ...params, ...route.params };
      route = route.firstChild;
    }
    params = { ...params, ...route.params };

    const {
      url,
      root: { queryParams },
    } = routerState;

    return { url, params, queryParams };
  }
}
