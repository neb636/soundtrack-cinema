import { computed, inject, Signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export const useQueryParameters = <T extends { [key: string]: undefined | string }>() => {
  const route = inject(ActivatedRoute);
  const paramMapSignal = toSignal(route.queryParamMap, { initialValue: route.snapshot.queryParamMap });

  return computed(() => paramMapSignal().keys.reduce((params, key) => ({ ...params, [key]: paramMapSignal().get(key) }), {} as T));
};

export const useQueryParameter = <T extends undefined | string>(paramName: string) => {
  const queryParameters = useQueryParameters();

  return computed(() => queryParameters()[paramName] as T);
};

export const useParameters = <T extends { [key: string]: undefined | string }>() => {
  const route = inject(ActivatedRoute);
  const paramMapSignal = toSignal(route.paramMap, { initialValue: route.snapshot.paramMap });

  return computed(() => paramMapSignal().keys.reduce((params, key) => ({ ...params, [key]: paramMapSignal().get(key) }), {} as T));
};

export const useParameter = <T extends undefined | string>(paramName: string) => {
  const parameters = useParameters();

  return computed(() => parameters()[paramName] as T);
};

export const useRouteFragment = () => {
  const route = inject(ActivatedRoute);

  return toSignal(route.fragment, { initialValue: route.snapshot.fragment });
};

export const useRouteData = <T extends { [key: string]: any }>() => {
  const route = inject(ActivatedRoute);
  const routeData = toSignal(route.data, { initialValue: route.snapshot.data }) as Signal<T>;

  return computed(() => routeData() || ({} as T));
};
