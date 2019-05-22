// jshint esversion: 6
var Papa = require('papaparse');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var _ = require('lodash');
var filename = argv.csv;

var csv = Papa.parse(fs.readFileSync(filename, 'utf8'), {
  header: true,
  skipEmptyLines: true
});

var keys = Object.keys(csv.data[0]);
var formattedBallots = csv.data.map(v => {
  return keys.map(k => [k, +v[k]]);
});

formattedBallots = formattedBallots.map(v => {
  const grouped = _.groupBy(v, (vv) => vv[1]);
  const groupKeys = Object.keys(grouped).map(v => +v).sort();
  return groupKeys.map(vv => {
    return grouped[`${vv}`].map(vvv => vvv[0]);
  });
});

fs.writeFileSync('./ballots.json', JSON.stringify(formattedBallots, null, 2), {encoding: 'utf8'});
