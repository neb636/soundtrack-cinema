---
description: Generates a new component folder scafolding
auto_execution_mode: 3
---

Generate a new Angular component boilerplate based off below. Add the boilerplate to the currently selected path in sidebar.

/component-name

- component-name.component.ts
- component-name.component.css

```component-name.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'component-name',
  styleUrls: ['./component-name.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div></div>`,
})
export class ComponentNameComponent {}
```
