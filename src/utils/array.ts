/**
 * array functions
 * @mahi
 */

type ExtraProps = {
  date?: boolean;
  reverse?: boolean;
};

export function sortByKey(array, key, props?: ExtraProps) {
  return array.sort(function (a, b) {
    var x = props?.date ? new Date(a[key]).getTime() : a[key];
    var y = props?.date ? new Date(b[key]).getTime() : b[key];
    if (props?.reverse) return x > y ? -1 : x < y ? 1 : 0;
    return x < y ? -1 : x > y ? 1 : 0;
  });
}
