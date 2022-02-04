#!/usr/bin/env node
/*
    Author: Viktor Semykin <thesame.ml@gmail.com>

    Written for fontello.com project.
*/

'use strict'

var fs = require('fs')
var ArgumentParser = require('argparse').ArgumentParser

var ttf2eot = require('./index.js')

var parser = new ArgumentParser({
  add_help: true,
  description: 'TTF to EOT font converter'
})

parser.add_argument(
  'infile',
  {
    nargs: '?',
    help: 'Input file (stdin if not defined)'
  }
)

parser.add_argument(
  'outfile',
  {
    nargs: '?',
    help: 'Output file (stdout if not defined)'
  }
)

parser.add_argument(
  '-v', '--version',
  {
    action: 'version',
    version: require('./package.json').version,
    help: "show program's version number and exit"
  }
)

/* eslint-disable no-console */

var args = parser.parse_args()

var input

try {
  if (args.infile) {
    input = fs.readFileSync(args.infile)
  } else {
    input = fs.readFileSync(process.stdin.fd)
  }
} catch (e) {
  console.error("Can't open input file (%s)", args.infile || 'stdin')
  process.exit(1)
}

var eot = ttf2eot(input)

if (args.outfile) {
  fs.writeFileSync(args.outfile, eot)
} else {
  process.stdout.write(eot)
}
