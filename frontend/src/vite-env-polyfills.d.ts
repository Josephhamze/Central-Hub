/// <reference types="vite/client" />

declare module 'process/browser' {
  const process: {
    env: Record<string, string | undefined>;
    [key: string]: any;
  };
  export default process;
}
