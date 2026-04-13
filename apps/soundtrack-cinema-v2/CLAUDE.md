# Claude Code Guidelines — soundtrack-cinema-v2

## Libraries & Tooling

- **Accessibility**: Use Angular CDK ARIA (`@angular/cdk/a11y`) for all accessibility needs — focus management, live announcements, keyboard navigation.
- **Styling**: Use our own custom CSS. Do not introduce CSS frameworks (Tailwind, Bootstrap, etc.) or component libraries (Angular Material, PrimeNG, etc.).
- **Utilities**: Use `lodash-es` for utility functions. Import individual functions (e.g. `import { groupBy } from 'lodash-es'`) to keep bundle size minimal.
- **State/Reactivity**: Use `@signality/core` for state management and reactive primitives.
