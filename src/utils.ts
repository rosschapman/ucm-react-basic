export let get = <Object extends {}, Key extends keyof Object>(
  object: Object,
  path: string
): Object[Key] =>
  path.split(".").reduce((prev, curr) => {
    return prev[curr];
  }, object);

export let set = <Object extends {}>(
  object: Object,
  path: string,
  data: any
): Object => {
  let parts = path.split(".");
  let iter = object;

  parts.forEach((part, i) => {
    if (i + 1 === parts.length) {
      iter[part] = data;
    } else {
      iter = iter[part];
    }
  });

  return object;
};
