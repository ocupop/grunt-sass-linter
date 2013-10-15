(function() {
  "use strict";
  var parse_line, warnings;

  module.exports = function(grunt) {
    grunt.registerMultiTask('sass_linter', 'Advanced style guide fascism for SASS', function() {
      var error_count, options;
      options = this.options({
        warn: {
          deep_selectors: true,
          multi_selectors: true,
          magic_numbers: true
        }
      });
      grunt.verbose.writeflags(options, 'sass-lint options');
      error_count = 0;
      this.filesSrc.forEach(function(path) {
        var doc;
        grunt.log.writeln(path);
        doc = {
          tab_size: 2
        };
        grunt.file.read(path).split('\n').map(parse_line).forEach(function(p, index) {
          var errors, key, warn;
          errors = ((function() {
            var _results;
            _results = [];
            for (key in warnings) {
              warn = warnings[key];
              if (options[key]) {
                _results.push(warn(p, doc));
              }
            }
            return _results;
          })()).filter(function(x) {
            return x != null;
          });
          error_count += errors.length;
          if (errors.length) {
            return grunt.log.errorlns("" + index + ": " + doc.lines[index] + "\n");
          }
        });
        if (error_count) {
          return grunt.log.errorlns("" + error_count + " errors found.");
        } else {
          return grunt.log.oklns("No errors found. Hooray!");
        }
      });
      return done();
    });
  };

  warnings = {
    deep_selectors: function(line, doc) {
      var depth;
      if (line.kind !== "selector") {
        return;
      }
      depth = line.indent / doc.tab_size + Math.max.apply(null, line.args.map(function(g) {
        return g.length;
      }));
      if (depth > 3) {
        grunt.log.errorlns("Warning: selector " + depth + " levels deep");
        return {
          deep_selectors: depth
        };
      }
    },
    multi_selectors: function(line, doc) {
      var selector_count;
      if (line.kind !== "selector") {
        return;
      }
      selector_count = line.args.length;
      if (selector_count > 1) {
        grunt.log.errorlns("Warning: " + selector_count + " selectors on single line");
        return {
          multi_selectors: selector_count
        };
      }
    },
    magic_numbers: function(line, doc) {
      var blacklist, errors, whitelist;
      if (line.kind !== "attribute") {
        return;
      }
      if (line.args[0][0] === '$') {
        return;
      }
      blacklist = /(px|%|#|rgb)/;
      whitelist = /^(1px|100%|50%|25%|20%)/;
      errors = line.args.map(function(arg) {
        if (blacklist.test(arg)) {
          return arg;
        }
      }).filter(function(arg) {
        return (arg != null) && !whitelist.test(arg);
      });
      if (errors.length) {
        grunt.log.errorlns("Warning: Magic Numbers " + (errors.join(', ')));
        return {
          magic_numbers: errors
        };
      }
    }
  };

  parse_line = function(line) {
    var kind, trim;
    if (line == null) {
      return null;
    }
    trim = line.trimLeft();
    kind = line.indexOf('@') > 0 ? "mixin" : line.indexOf(': ') > 0 ? "attribute" : "selector";
    return {
      indent: line.length - trim.length,
      kind: kind,
      args: (function() {
        if (kind === "attribute") {
          return trim.split(/\s|:\s/);
        } else if (kind === "selector") {
          return trim.split(/\s*,\s*/).filter(function(group) {
            return group != null;
          }).map(function(group) {
            return group.split(/\s+/);
          });
        } else {
          return null;
        }
      })()
    };
  };

}).call(this);
