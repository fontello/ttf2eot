/*
    Author: Viktor Semykin <thesame.ml@gmail.com>

    Written for fontello.com project.
*/

'use strict';


/**
 * Offsets in EOT file structure. Refer to EOTPrefix in OpenTypeUtilities.cpp
 */
var EOT_OFFSET = {
    LENGTH:         0
  , FONT_LENGTH:    4
  , VERSION:        8
  , CHARSET:        26
  , MAGIC:          34
  , FONT_PANOSE:    16
  , ITALIC:         27
  , WEIGHT:         28
  , UNICODE_RANGE:  36
  , CODEPAGE_RANGE: 52
  , CHECKSUM_ADJUSTMENT: 60
  };

/**
 * Offsets in different SFNT (TTF) structures. See OpenTypeUtilities.cpp
 */
var SFNT_OFFSET = {
    // sfntHeader:
    NUMTABLES:      4

    // TableDirectoryEntry
  , TABLE_TAG:      0
  , TABLE_OFFSET:   8
  , TABLE_LENGTH:   12

    // OS2Table
  , OS2_WEIGHT:         4
  , OS2_FONT_PANOSE:    32
  , OS2_UNICODE_RANGE:  42
  , OS2_FS_SELECTION:   62
  , OS2_CODEPAGE_RANGE: 78

    // headTable
  , HEAD_CHECKSUM_ADJUSTMENT:   8

    // nameTable
  , NAMETABLE_FORMAT:   0
  , NAMETABLE_COUNT:    2
  , NAMETABLE_STRING_OFFSET:    4

    // nameRecord
  , NAME_PLATFORM_ID:   0
  , NAME_ENCODING_ID:   2
  , NAME_LANGUAGE_ID:   4
  , NAME_NAME_ID:       6
  , NAME_LENGTH:        8
  , NAME_OFFSET:        10
  };

/**
 * Sizes of structures
 */
var SIZEOF = {
    SFNT_TABLE_ENTRY:   16
  , SFNT_HEADER:        12
  , SFNT_NAMETABLE:          6
  , SFNT_NAMETABLE_ENTRY:    12
  , EOT_PREFIX: 82
  };

/**
 * Magic numbers
 */
var MAGIC = {
    EOT_VERSION:    0x00020001
  , EOT_MAGIC:      0x504c
  , EOT_CHARSET:    1
  , LANGUAGE_ENGLISH:   0x0409
  };

/**
 * Utility function to convert buffer of utf16be chars to buffer of utf16le
 * chars prefixed with length and suffixed with zero
 */
function strbuf(str) {
  var b = new Buffer (str.length + 4);

  b.writeUInt16LE (str.length, 0);

  for (var i = 0; i < str.length; i += 2) {
    b.writeUInt16LE (str.readUInt16BE (i), i+2);
  }

  b.writeUInt16LE (0, b.length - 2);

  return b;
}

function ttf2eot(buf) {
  var out = new Buffer (SIZEOF.EOT_PREFIX)
    , i, j;

  out.fill(0);
  out.writeUInt32LE(buf.length, EOT_OFFSET.FONT_LENGTH);
  out.writeUInt32LE(MAGIC.EOT_VERSION, EOT_OFFSET.VERSION);
  out.writeUInt8(MAGIC.EOT_CHARSET, EOT_OFFSET.CHARSET);
  out.writeUInt16LE(MAGIC.EOT_MAGIC, EOT_OFFSET.MAGIC);

  var familyName = ''
    , subfamilyName = ''
    , fullName = ''
    , versionString = ''
    ;

  var haveOS2 = false
    , haveName = false
    , haveHead = false
    ;

  var numTables = buf.readUInt16BE (SFNT_OFFSET.NUMTABLES);

  for (i = 0; i < numTables; ++i)
  {
    var data = buf.slice (SIZEOF.SFNT_HEADER + i*SIZEOF.SFNT_TABLE_ENTRY);
    var tableEntry = {
      tag: data.toString ('ascii', SFNT_OFFSET.TABLE_TAG, SFNT_OFFSET.TABLE_TAG + 4),
      offset: data.readUInt32BE (SFNT_OFFSET.TABLE_OFFSET),
      length: data.readUInt32BE (SFNT_OFFSET.TABLE_LENGTH)
    };

    var table = buf.slice (tableEntry.offset, tableEntry.offset + tableEntry.length);

    if (tableEntry.tag === 'OS/2') {
      haveOS2 = true;

      for (j = 0; j < 10; ++j) {
        out.writeUInt8 (table.readUInt8 (SFNT_OFFSET.OS2_FONT_PANOSE + j), EOT_OFFSET.FONT_PANOSE + j);
      }

      /*jshint bitwise:false */
      out.writeUInt8 (table.readUInt16BE (SFNT_OFFSET.OS2_FS_SELECTION) & 0x01, EOT_OFFSET.ITALIC);
      out.writeUInt32LE (table.readUInt16BE (SFNT_OFFSET.OS2_WEIGHT), EOT_OFFSET.WEIGHT);

      for (j = 0; j < 4; ++j) {
        out.writeUInt32LE (table.readUInt32BE (SFNT_OFFSET.OS2_UNICODE_RANGE + j*4), EOT_OFFSET.UNICODE_RANGE + j*4);
      }

      for (j = 0; j < 2; ++j) {
        out.writeUInt32LE (table.readUInt32BE (SFNT_OFFSET.OS2_CODEPAGE_RANGE + j*4), EOT_OFFSET.CODEPAGE_RANGE + j*4);
      }

    } else if (tableEntry.tag === 'head') {

      haveHead = true;
      out.writeUInt32LE (table.readUInt32BE (SFNT_OFFSET.HEAD_CHECKSUM_ADJUSTMENT), EOT_OFFSET.CHECKSUM_ADJUSTMENT);

    } else if (tableEntry.tag === 'name') {

      haveName = true;

      var nameTable = {
          format: table.readUInt16BE (SFNT_OFFSET.NAMETABLE_FORMAT)
        , count: table.readUInt16BE (SFNT_OFFSET.NAMETABLE_COUNT)
        , stringOffset: table.readUInt16BE (SFNT_OFFSET.NAMETABLE_STRING_OFFSET)
        };

      for (j = 0; j < nameTable.count; ++j) {
        var nameRecord = table.slice (SIZEOF.SFNT_NAMETABLE + j*SIZEOF.SFNT_NAMETABLE_ENTRY);
        var name = {
            platformID: nameRecord.readUInt16BE (SFNT_OFFSET.NAME_PLATFORM_ID)
          , encodingID: nameRecord.readUInt16BE (SFNT_OFFSET.NAME_ENCODING_ID)
          , languageID: nameRecord.readUInt16BE (SFNT_OFFSET.NAME_LANGUAGE_ID)
          , nameID: nameRecord.readUInt16BE (SFNT_OFFSET.NAME_NAME_ID)
          , length: nameRecord.readUInt16BE (SFNT_OFFSET.NAME_LENGTH)
          , offset: nameRecord.readUInt16BE (SFNT_OFFSET.NAME_OFFSET)
          };

        if (name.platformID === 3 && name.encodingID === 1 && name.languageID === MAGIC.LANGUAGE_ENGLISH) {
          var s = strbuf (table.slice (nameTable.stringOffset + name.offset, nameTable.stringOffset + name.offset + name.length));

          switch (name.nameID) {
          case 1:
            familyName = s;
            break;
          case 2:
            subfamilyName = s;
            break;
          case 4:
            fullName = s;
            break;
          case 5:
            versionString = s;
            break;
          }
        }
      }
    }
    if (haveOS2 && haveName && haveHead) { break; }
  }

  if (!(haveOS2 && haveName && haveHead)) {
    throw new Error ('Required section not found');
  }

  out = Buffer.concat ([
    out,
    familyName,
    subfamilyName,
    versionString,
    fullName,
    new Buffer([0, 0]) // padding
  ]);

  out.writeUInt32LE(out.length + buf.length, EOT_OFFSET.LENGTH); // Calculate overall length

  return Buffer.concat ([
    out,
    buf
  ]);
}

module.exports = ttf2eot;
