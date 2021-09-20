const fs = require('fs');
const prependFile = require('prepend-file');
const lineByLine = require('n-readlines');

function append(path, string) {
  fs.writeFile(path, string, { flag: 'a+' }, err => {
    if(err) {
      console.log(err);
      return;
    }
  });
}

function prepend(path, string) {
  prependFile(path, string);
}

function line_array(path) {
  const spotify_line = new lineByLine(path);
  let line;
  let file_array = [];
  while(line = spotify_line.next()) {
    file_array.push(line.toString('ascii'));
  }
  file_array = [...new Set(file_array)];
  return file_array;
}

module.exports.append = append;
module.exports.prepend = prepend;
module.exports.line_array = line_array;
