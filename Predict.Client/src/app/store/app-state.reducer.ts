import { Params } from '@angular/router';
import * as fromRouter from '@ngrx/router-store';
import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import {
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
} from '@ngrx/store';
import { RouterState } from './services/router-serializer';

export interface AppState {
  router: fromRouter.RouterReducerState<RouterState>;
}

export const appReducer: ActionReducerMap<AppState> = {
  router: fromRouter.routerReducer,
};

const getRouterState =
  createFeatureSelector<fromRouter.RouterReducerState<RouterState>>('router');

// `router` is used as the default feature name. You can use the feature name
// of your choice by creating a feature selector and pass it to the
// `getRouterSelectors` function.
export const selectRouter =
  createFeatureSelector<RouterReducerState<RouterState>>('router');

export const {
  selectCurrentRoute, // select the current route
  selectFragment, // select the current route fragment
  selectQueryParams, // select the current route query params
  selectQueryParam, // factory function to select a query param
  selectRouteParams, // select the current route params
  selectRouteParam, // factory function to select a route param
  selectRouteData, // select the current route data
  selectRouteDataParam, // factory function to select a route data param
  selectUrl, // select the current url
  selectTitle, // select the title if available
} = getRouterSelectors(selectRouter);

// Your serializer already flattens params from every route level,
// so `selectRouteParams` is effectively the same as "nested params".
export const selectRouteNestedParams = selectRouteParams;

export const getRouterParams = createSelector(
  getRouterState,
  (state: fromRouter.RouterReducerState<RouterState> | undefined) =>
    state?.state?.params ?? null,
);

export const getRouterUrl = createSelector(
  getRouterState,
  (state: fromRouter.RouterReducerState<RouterState> | undefined) =>
    state?.state?.url ?? null,
);

export const getRouterQueryParams = createSelector(
  getRouterState,
  (state: fromRouter.RouterReducerState<RouterState> | undefined) =>
    state?.state?.queryParams ?? null,
);

export const selectRouteNestedParam = (param: string) =>
  createSelector(
    selectRouteParams,
    (params: Params) => params?.[param] ?? null,
  );
