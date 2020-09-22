// jshint esversion: 6
var Papa = require('papaparse');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var _ = require('lodash');
var filename = argv.csv;
var moment = require('moment');

const timestamp_field = 'Timestamp';
const voting_code_field = 'Voting Code';

let voting_codes = [];
try {
  voting_codes = Papa.parse(fs.readFileSync('codes.csv', 'utf8'), {
    header: false,
    skipEmptyLines: true
  });
  voting_codes = voting_codes.data.map(v => v[0]) || [];
} catch (e) {
  console.warn('Failed to parse voting codes...');
  voting_codes = [];
}

console.log(`Pool contains ${voting_codes.length} voting codes`);

var csv = Papa.parse(fs.readFileSync(filename, 'utf8'), {
  header: true,
  skipEmptyLines: true
});

var keys = Object.keys(csv.data[0]);
// process ballots by first looking for a timestamp field
if (keys.includes(timestamp_field)) {
  csv.data = csv.data.map(v => {
    v[timestamp_field] = moment(v[timestamp_field], 'YYYY-MM-DD HH:mm:ss');
    return v;
  });
  csv.data.sort((a, b) => {
    if (a[timestamp_field].isBefore(b[timestamp_field])) {
      return -1;
    }
    if (a[timestamp_field].isAfter(b[timestamp_field])) {
      return +1;
    }
    return 0;
  });
} else {
  console.warn('Ballots CSV does not contain a Timestamp field, using record order as is');
}

let numBallotsBefore = csv.data.length;
// remove any ballots that don't provide a valid code
csv.data = csv.data.filter(v => {
  return v && voting_codes.includes(v[voting_code_field]);
});

let numBallotsAfter = csv.data.length;
if (numBallotsAfter !== numBallotsBefore) {
  console.log(`Culling invalid codes:: Before (${numBallotsBefore}):: After (${numBallotsAfter})`);
}
numBallotsBefore = numBallotsAfter; // this is the new normal

// collapse duplicate codes
const hashMap = {}; // by code
csv.data.forEach(ballot => {
  hashMap[ballot[voting_code_field]] = ballot;
});
csv.data = Object.keys(hashMap).map(k => hashMap[k]);
numBallotsAfter = csv.data.length;
if (numBallotsAfter !== numBallotsBefore) {
  console.log(`Culling duplicate codes:: Before (${numBallotsBefore}):: After (${numBallotsAfter})`);
}

// remove codes and timestamps
csv.data = csv.data.map(v => {
  delete v[timestamp_field];
  delete v[voting_code_field];
  return v;
});
keys = Object.keys(csv.data[0]);

let maxValue = 0;
var formattedBallots = csv.data.map(v => {
  return keys.map(k => {
    let val = +v[k];
    if (!v[k].trim()) {
      val = '';
    }
    if (val && (maxValue < val)) {
      maxValue = val;
    }
    return [k, val];
  });
});

// console.log(formattedBallots);

// replace all the '' ballots with maxValue + 1
formattedBallots.forEach(ballot => {
  // each ballot is now an array of arrays of 2 values
  ballot.forEach(ranking => {
    if(ranking[1] === '') {
      ranking[1] = maxValue + 1;
    }
  });
});

// console.log(formattedBallots);

formattedBallots = formattedBallots.map(v => {
  const grouped = _.groupBy(v, (vv) => vv[1]);
  const groupKeys = Object.keys(grouped).map(v => +v).sort();
  return groupKeys.map(vv => {
    return grouped[`${vv}`].map(vvv => vvv[0]);
  });
});

// console.log(formattedBallots);

fs.writeFileSync('./ballots.json', JSON.stringify(formattedBallots, null, 2), {encoding: 'utf8'});
