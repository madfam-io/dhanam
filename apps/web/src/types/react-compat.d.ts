// React 19 compatibility fix for Radix UI and other libraries
// This addresses React 19 type incompatibilities with older component libraries

import 'react';

declare module 'react' {
  // Fix for React 19 JSXElementType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ElementType<P = any> =
    | {
        [K in keyof JSX.IntrinsicElements]: P extends JSX.IntrinsicElements[K] ? K : never;
      }[keyof JSX.IntrinsicElements]
    | ComponentType<P>;

  // Fix bigint in ReactNode
  namespace JSX {
    interface IntrinsicAttributes {
      key?: Key | null | undefined;
    }
  }
}
