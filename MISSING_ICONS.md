# Icon Library Abstraction

This project uses an icon library abstraction layer to allow easy switching between icon libraries.

## Current Library: Phosphor Icons

All icons are accessed through the abstraction layer in `src/modules/components/iconLibrary.ts`. No icons should be imported directly.

## Usage

```typescript
import { iconNameToReactComponent } from './iconUtils'

const MyIcon = iconNameToReactComponent('paint-brush')
if (MyIcon) {
  return <MyIcon className="icon" />
}
```

## Icon Names

Icons are referenced by kebab-case names (e.g., `paint-brush`, `arrow-path`). The mapping from these names to actual Phosphor icon components is defined in `iconLibrary.ts`.

## Switching Icon Libraries

To switch to a different icon library:

1. Update the imports in `iconLibrary.ts`
2. Update the `phosphorIconMap` mapping to use the new library's icon names
3. Update the `getIcon` function to retrieve icons from the new library
4. No other code changes are needed!

## Available Icons

All icons used in the application are mapped in `iconLibrary.ts`. See that file for the complete list of available icon names.


