export async function doAsync<T>(
  fn: () => Promise<T>
): Promise<[T | null, Error | null]> {
  let result = null;
  let error = null;

  try {
    const promise = fn();
    result = await promise;
  } catch (e) {
    error = e;
  }

  return [result, error];
}

const snakeToCamel = (str: string) =>
  str.replace(/([_][a-zA-Z])/g, (part: string) =>
    part.toUpperCase().replace("_", "")
  );

export const convertKeysToCamelCase = (obj: { [key: string]: any }) => {
  return Object.keys(obj).reduce(
    (acc: { [key: string]: any }, curr: string) => {
      return {
        ...acc,
        [snakeToCamel(curr)]: obj[curr],
      };
    },
    {}
  );
};

const HOSTNAME_EXP = /^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i;

export function getHostname(str: string): string | null {
  const matches = str.match(HOSTNAME_EXP);
  return matches && matches[0] && matches[1] ? matches[1] : null;
}
