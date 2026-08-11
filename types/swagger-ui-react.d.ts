declare module 'swagger-ui-react' {
  import * as React from 'react';

  interface SwaggerUIProps {
    spec?: Record<string, unknown>;
    url?: string;
    [key: string]: unknown;
  }

  const SwaggerUI: React.ComponentType<SwaggerUIProps>;

  export default SwaggerUI;
}