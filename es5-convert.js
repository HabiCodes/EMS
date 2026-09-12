#!/usr/bin/env node
/**
 * ES6 -> ES5 converter for EntryMySlot production files.
 * Replaces: const/let -> var, arrow functions -> function expressions.
 */

var fs = require('fs');
var path = require('path');

var JS_DIR = '/Users/habishek/Downloads/EMSUI/frontend/public/js';

function convertFile(filePath) {
  var content = fs.readFileSync(filePath, 'utf8');
  var original = content;

  // Replace const/let -> var everywhere
  content = content.replace(/\bconst\b/g, 'var');
  content = content.replace(/\blet\b/g, 'var');

  // Replace arrow functions: (args) => { ... } -> function(args) { ... }
  // Handle: var x = (args) => { ... }
  content = content.replace(/=\s*\(([^)]*)\)\s*=>\s*\{/g, '= function($1) {');

  // Handle: forEach((k, v) => { ... })
  content = content.replace(/\.forEach\(\(([^)]*)\)\s*=>\s*\{/g, '.forEach(function($1) {');

  // Handle: Array.isArray -> still valid in ES5, but we use forEach which needs a function
  // Already handled above

  // Handle: .forEach(([k, v]) => { ... }) -> already handled by above regex

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  var files = [];
  try {
    var entries = fs.readdirSync(dir);
    for (var i = 0; i < entries.length; i++) {
      var fullPath = path.join(dir, entries[i]);
      try {
        var stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          files = files.concat(walkDir(fullPath));
        } else if (entries[i].endsWith('.js')) {
          files.push(fullPath);
        }
      } catch(e) {}
    }
  } catch(e) {}
  return files;
}

var files = walkDir(JS_DIR);
var changed = 0;

for (var f = 0; f < files.length; f++) {
  if (convertFile(files[f])) {
    changed++;
    console.log('Updated: ' + path.relative(JS_DIR, files[f]));
  }
}

console.log('\nDone. ' + changed + ' files updated.');
