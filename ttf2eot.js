#!/usr/bin/env node
/*
    Author: Viktor Semykin <thesame.ml@gmail.com>

    Written for fontello.com project.
*/

'use strict';

var fs = require('fs');
var ArgumentParser = require('argparse').ArgumentParser;

var ttf2eot = require('./index.js');


var parser = new ArgumentParser ({
  version: require('./package.json').version,
  addHelp: true,
  description: 'TTF to EOT font converter'
});

parser.addArgument (
  [ 'infile' ],
  {
    nargs: '?',
    help: 'Input file (stdin if not defined)'
  }
);

parser.addArgument (
  [ 'outfile' ],
  {
    nargs: '?',
    help: 'Output file (stdout if not defined)'
  }
);

var args = parser.parseArgs();

var ttf, size;

try {
  if (args.infile) {
    ttf = fs.readFileSync(args.infile);
  } else {
    size = fs.fstatSync(process.stdin.fd).size;
    ttf = new Buffer(size);
    fs.readSync(process.stdin.fd, ttf, 0, size, 0);
  }
} catch(e) {
  console.error("Can't open input file (%s)", args.infile || 'stdin');
  process.exit(1);
}

var eot = ttf2eot(ttf);

if (args.outfile) {
  fs.writeFileSync(args.outfile, eot);
} else {
  process.stdout.write(eot);
}

