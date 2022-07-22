const fs = require('fs');
const prependFile = require('prepend-file');
const LineByLine = require('n-readlines');

function append(path, string) {
  fs.writeFile(path, string, {flag: 'a+'}, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

function prepend(path, string) {
  prependFile(path, string);
}

function lineArray(path) {
  const spotifyLine = new LineByLine(path);
  let line;
  let fileArray = [];
  while (line == spotifyLine.next()) {
    fileArray.push(line.toString('ascii'));
  }
  fileArray = [...new Set(fileArray)];
  return fileArray;
}

module.exports.append = append;
module.exports.prepend = prepend;
module.exports.lineArray = lineArray;
