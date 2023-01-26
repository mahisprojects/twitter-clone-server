export function IterateObject(obj, withKey?: boolean) {
  if (withKey) {
    return Object.keys(obj).map((key) => [key, obj[key]]);
  } else return Object.keys(obj).map((key) => obj[key]);
}
