---
trigger: always_on
---

You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

## General

- 'lodash-es' is avaliable for utility functions

## Coding standards

- Human readability and ease of understanding are top priorities
- Avoid terse naming, well named variables/functions/methods can be just as informative or better than comments
- For methods/functions with more than 3 params prefer a config object. `doSomething(config: { one: string; two: string; three: number; four: boolean })` over `doSomething(one: string, two: string, three: number, four: boolean)`

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## CSS naming

- Follow component name scope BEM style for css selectors. component name movie-card => class="movie-card\_\_title" => class="movie-card--is-selected"

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
- `NgOptimizedImage` does not work for inline base64 images.
- Use modern reactive Angular with Composables and Effects
- When making api requests use resource function instead of `HttpClient`

#### Angular Composables

Small composable functions are great for code reuse. They are easy to test and can be composed using other composables.

- Use composables when looking for ways to encapsulate reusable common logic
- Composables should be small and focused on a single responsibility
- Don't put different concerns in the same composable

```use-debounced-signal.composable.ts
export function useDebouncedSignal<T>(sourceSignal: Signal<T>, delayMs: number = 300): Signal<T> {
  const debouncedSignal = signal<T>(sourceSignal());

  const debouncedUpdate = debounce((value: T) => {
    debouncedSignal.set(value);
  }, delayMs);

  effect(() => {
    const value = sourceSignal();
    debouncedUpdate(value);
  });

  return debouncedSignal.asReadonly();
}
```

#### Effects

- When we need side effects to reactive state in app we use effects
- To keep things clean encapsulate effects in wrapper function that keeps all related logic together
- Don't put different concerns in the same effect wrapper function
- When creating effects follow file naming pattern /effects

```update-query-param-on-search-change.effect.ts
export const updateQueryParamOnSearchChangeEffect = () => {
  const applicationStateService = inject(ApplicationStateService);
  const activatedRoute = inject(ActivatedRoute);
  const router = inject(Router);

  effect(() => {
    const debouncedSearchQuery = applicationStateService.debouncedSearchQuery();

    router.navigate([], {
      relativeTo: this.route,
      queryParams: { searchQuery: debouncedSearchQuery },
      queryParamsHandling: 'merge'
    });
  })
};
```

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` for all services
- Use the `inject()` function instead of constructor injection
