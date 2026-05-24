import { join, spawn } from "jayess:thread";

export function run(callback, args) {
  return spawn(callback, args);
}

export function runAll(jobs) {
  var handles = [];
  for (var index = 0; index < jobs.length; index = index + 1) {
    var job = jobs[index];
    handles.push(spawn(job.callback, job.args));
  }
  return handles;
}

export function joinAll(handles) {
  var results = [];
  for (var index = 0; index < handles.length; index = index + 1) {
    results.push(join(handles[index]));
  }
  return results;
}
