
// const concat = (x, y) => x.concat(y);

// const flatMap = (f, xs) => xs.map(f).reduce(concat, []);

// Array.prototype.flatMap = f => {
//   return flatMap(f, this);
// }

function flatMap(arr, mapFunc) {
  const result = [];
  for (const [index, elem] of arr.entries()) {
      const x = mapFunc(elem, index, arr);
      // We allow mapFunc() to return non-Arrays
      if (Array.isArray(x)) {
          result.push(...x);
      } else {
          result.push(x);
      }
  }
  return result;
}

export { flatMap };
