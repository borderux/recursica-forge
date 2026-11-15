/// <reference types="vite/client" />

declare module 'ntcjs' {
  /** Name That Color: returns [closest hex, name, exact match]. */
  const ntc: { name(hex: string): [string, string, boolean] }
  export default ntc
}

