var moduleCounter = 1;

function makeClosure(seed) {
  var ordinary = seed + moduleCounter;
  return function(step) {
    return ordinary + step;
  };
}

export function run(errorValue) {
  var closure = makeClosure(2);
  if (errorValue) {
    throw errorValue;
  }
  return closure(3);
}

function main() {
  return run(0);
}
