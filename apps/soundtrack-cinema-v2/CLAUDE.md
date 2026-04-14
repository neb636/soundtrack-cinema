# Claude Code Guidelines — soundtrack-cinema-v2

## Libraries & Tooling

- **Accessibility**: Use Angular CDK ARIA (`@angular/cdk/a11y`) for all accessibility needs — focus management, live announcements, keyboard navigation.
- **Styling**: Use our own custom CSS. Do not introduce CSS frameworks (Tailwind, Bootstrap, etc.) or component libraries (Angular Material, PrimeNG, etc.).
- **Utilities**: Use `lodash-es` for utility functions. Import individual functions (e.g. `import { groupBy } from 'lodash-es'`) to keep bundle size minimal.
- **State/Reactivity**: Use `@signality/core` for reactive primitives (e.g. `debounced`, `throttled` signals). For shared application state, use domain-specific singleton services with public Angular signals — similar to Zustand stores in React. State signals, computed derivations, and action methods all live together in a `providedIn: 'root'` service:

```typescript
// state service — signals are public and writable
@Injectable({ providedIn: 'root' })
export class CartStateService {

  // State
  items = signal<CartItem[]>([]);
  isCartOpen = signal(false);

  // Derived state
  itemCount = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  subtotal = computed(() => this.items().reduce((sum, item) => sum + item.price * item.quantity, 0));

  // Actions — the only place that calls .set()
  addItem(product: Product) { /* logic */ }
  removeItem(productId: string) { /* logic */ }
  resetState() { /* logic */ }
}

// component — consume with .asReadonly() to get a readonly view
@Component({ ... })
export class CartComponent {
  private cartState = inject(CartStateService);

  readonly items = this.cartState.items.asReadonly();
  readonly itemCount = this.cartState.itemCount; // computed() is already readonly
}
```

- **Service level**: signals are public and writable — mutation happens only inside action methods by convention.
- **Component level**: always consume signals via `.asReadonly()` — this prevents accidental `.set()` calls from within a component and makes the data-flow direction explicit.
- Do **not** use `private _field = signal() / readonly field = this._field.asReadonly()` at the service level — that boilerplate belongs at the component boundary instead.
