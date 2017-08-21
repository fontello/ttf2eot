ttf2eot
=======

ttf2eot converts TTF fonts to EOT format. That can be useful for different
webfont generation tools.

This is node.js port of [ttf2eot](http://code.google.com/p/ttf2eot/).


Usage
-----

Install:

``` bash
npm install -g ttf2eot
```

Usage example:

``` bash
ttf2eot fontello.ttf fontello.eot
```

Or:

``` bash
ttf2eot < fontello.ttf > fontello.eot
```


Possible problems
-----------------

Due to bug in IE, the font `FullName` __MUST__ begin with `FamilyName` in the `name` table of ttf file. For example,
if `FamilyName` is `fontello`, then `FullName` should be `fontello regular` and so on.

In this condition is not satisfyed, then font will not be shown in IE.

See http://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=iws-chapter08#3054f18b for info about TTF format and `name` table.

Authors
-------

* Viktor Semykin <thesame.ml@gmail.com>


License
-------

Copyright (c) 2013-2016 [Vitaly Puzrin](https://github.com/puzrin).
Released under the MIT license. See
[LICENSE](https://github.com/nodeca/ttf2eot/blob/master/LICENSE) for details.

