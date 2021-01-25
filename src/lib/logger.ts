export const makeLogger = (prefix: string) => (...args: any[]) => {
  console.log(`[${prefix}]`, ...args);
};
