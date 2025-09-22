import * as React from 'react';

export function Form({ className, ...props }: React.ComponentProps<any>) {
  return <div className={className}>{props.children}</div>;
}
