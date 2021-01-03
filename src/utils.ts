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
