# grunt-sass-linter
# https://github.com/ocupop/grunt-sass-linter

# Copyright (c) 2013 Justin Falcone
# Licensed under the MIT license.


"use strict"

module.exports = (grunt)->
  # fs = require 'fs'

  grunt.registerMultiTask 'sass_linter', 'Advanced style guide fascism for SASS', ()->

    # defaults
    options = @options {
      warn: {
        deep_selectors: true
        multi_selectors: true
        magic_numbers: true
      }
    }

    grunt.verbose.writeflags(options, 'sass-lint options')

    error_count = 0

    @filesSrc.forEach (path)->
      grunt.log.writeln path

      doc = {
        tab_size: 2
      }

      grunt.file.read(path).split('\n')
        .map(parse_line)
        .forEach (p, index)->
          errors = (warn(p, doc) for key, warn of warnings when (options[key]))
            .filter (x)-> x?
          error_count += errors.length

          grunt.log.errorlns("#{index}: #{doc.lines[index]}\n") if errors.length

      if error_count
        grunt.log.errorlns "#{error_count} errors found."
      else
        grunt.log.oklns "No errors found. Hooray!"

    done()

  return

warnings = {
  deep_selectors: (line, doc)->
    # checks for selectors more than 3 levels deep which may be too specific
    return unless line.kind is "selector"
    depth = line.indent / doc.tab_size + Math.max.apply null, line.args.map (g)-> g.length
    if depth > 3
      grunt.log.errorlns "Warning: selector #{depth} levels deep"
      return {deep_selectors: depth}

  multi_selectors: (line, doc)->
    # checks for multiple selectors on a line
    return unless line.kind is "selector"

    selector_count = line.args.length

    if selector_count > 1
      grunt.log.errorlns "Warning: #{selector_count} selectors on single line"
      return {multi_selectors: selector_count}


  magic_numbers: (line, doc)->
    # checks for suspicious "magic numbers", i.e. pixel/color/percent values
    # that are not attached to a variable
    return unless line.kind is "attribute"

    # ignore var definition lines
    return if line.args[0][0] is '$'

    # px, percent, or color values
    blacklist = /(px|%|#|rgb)/

    # exceptions
    whitelist = /^(1px|100%|50%|25%|20%)/

    errors = line.args
      .map((arg)-> arg if blacklist.test(arg))
      .filter((arg)-> arg? && !whitelist.test(arg))

    if errors.length
      grunt.log.errorlns "Warning: Magic Numbers #{errors.join(', ')}"
      return {magic_numbers: errors}

}

parse_line = (line)->
  return null unless line?

  # indent: # of preceding spaces
  # kind: mixin, attribute, selector
  # args: array of values or selectors
  trim = line.trimLeft()

  kind = if (line.indexOf('@') > 0)
    "mixin"
  else if (line.indexOf(': ') > 0)
    "attribute"
  else
    "selector"

  {
    indent: line.length - trim.length
    kind: kind
    args: do ()->
      if kind is "attribute"
        # split on spaces, colons
        trim.split(/\s|:\s/)
      else if kind is "selector"
        # split on commas
        trim.split(/\s*,\s*/)
          .filter( (group)-> group? ) # remove empty items
          .map (group)->
            group.split(/\s+/)        # split on spaces
      else
        null
  }

# per block

# check param order - extends, includes, params
# figure out what "correct" order is

# check depth, warn if > 3



# overall (hard mode)

# look for duplicated sets of lines





