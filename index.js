// jshint esversion: 6

// Based on https://en.wikipedia.org/wiki/Schulze_method

// # Input: d[i,j], the number of voters who prefer candidate i to candidate j.
// # Output: p[i,j], the strength of the strongest path from candidate i to candidate j.


var ballots = require('./ballots.json');
var candidates = Array.from(ballots.reduce((t, v) => {
  v.forEach(vv => {
    vv = Array.from(vv);
    t = new Set(Array.from(t).concat(vv));
  });
  return t;
}, new Set()));

console.log(candidates);

function indexOf(ballot, candidate) {
  // ballot is an array
  // each element of the array might be a single string, or an array of strings
  // an array of strings represents indifference among the strings

  var idx = ballot.reduce((t, v, index) => {
    if(t !== null) {
      return t;
    }
    if(v === candidate) {
      return index;
    }
    if(Array.isArray(v) && v.indexOf(candidate) >= 0) {
      return index;
    }
    return null;
  }, null);

  if(idx === null) {
    return Infinity;
  }

  return idx;
}

var count = 0;
var d = [];
for(var i = 0; i < candidates.length; i++){
  d[i] = [];
  for(var j = 0; j < candidates.length; j++) {
    count = 0;
    for(var k = 0; k < ballots.length; k++) {
      if(indexOf(ballots[k], candidates[i]) < indexOf(ballots[k], candidates[j])) {
        count++;
      }
    }
    d[i][j] = count;
  }
}

// console.log(JSON.stringify(d, null, 2));
console.log('prefs');
d.forEach(v => console.log(v));

p = [];
for(var i = 0; i < candidates.length; i++) {
  p[i] = [];
  for(var j = 0; j < candidates.length; j++) {
    if(i !== j) {
      if (d[i][j] > d[j][i]) {
        p[i][j] = d[i][j];
      } else {
        p[i][j] = 0;
      }
    } else {
      p[i][j] = 0;
    }
  }
}

for(var i = 0; i < candidates.length; i++) {
  for(var j = 0; j < candidates.length; j++) {
    if(i !== j) {
      for(var k = 0; k < candidates.length; k++) {
        if(i !== k && j !== k) {
          p[j][k] = Math.max(p[j][k], Math.min(p[j][i], p[i][k]));
        }
      }
    }
  }
}

// console.log(JSON.stringify(p, null, 2));
console.log('powers');
p.forEach(v => console.log(v));

// sort the candidates
tied_pairs = [];
sorted_candidates = candidates.slice();
sorted_candidates.sort((a, b) => {
  var a_idx = candidates.indexOf(a);
  var b_idx = candidates.indexOf(b);
  if(p[a_idx][b_idx] > p[b_idx][a_idx]) {
    return -1;
  } else if(p[b_idx][a_idx] > p[a_idx][b_idx]) {
    return 1;
  }

  // this is a tie
  tied_pairs.push({
    candidates: [a, b],
    power: p[a_idx][b_idx]
  });

  return 0;
});

console.log('rank-order');
sorted_candidates.forEach(v => console.log(v));
console.log('ties');
tied_pairs.forEach(v => console.log(v));