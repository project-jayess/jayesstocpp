import { next } from "jayess:iter";

function makeClosure() {
  if (true) {
    var prefix = "Jay";
    return function() {
      return prefix + "ess";
    };
  }
  return function() {
    return "";
  };
}

async function makeAsyncValue() {
  var value = "async";
  var read = async function() {
    return await value;
  };
  return await read();
}

function* makeGenerator() {
  var value = 4;
  yield value;
  value = value + 1;
  return value;
}

function makeClassValue() {
  var value = "class";
  class Box {
    field = value;

    read() {
      return this.field;
    }
  }
  return new Box();
}

export async function run() {
  var closure = makeClosure();
  var asyncValue = await makeAsyncValue();
  var generator = makeGenerator();
  var first = next(generator);
  var completed = next(generator);
  var box = makeClassValue();
  return [closure(), asyncValue, first, completed, box.read()];
}
