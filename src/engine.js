'use strict';

const
    { forEach, map, repeat } = require('lodash');

const
    IGNORE = '!',
    NOOP = '`-`',
    TAB = '    ',
    OUTPUT = '___';

function replaceOrEscapeInlineCode (s) {
    return s
        .replace(/\$/g, '\\$')
        .replace(/`([^!].*?)`/g, '${$1}')
        .replace(/`!(.*?)`/g, '`$1`')
        .replace(/`/g, '\\`');
}

function isCode (line) {
    return line.startsWith(TAB) && !line.trim().startsWith(IGNORE);
}

function isIgnoredCode (line) {
    return line.startsWith(TAB) && line.trim().startsWith(IGNORE);
}

function isNoop (line) {
    return line === NOOP;
}

function getTabs (line) {
    let count = 0;
    while (line[count] === ' ') {
        count++;
    }
    if (line.substring(count) === '}') {
        count -= TAB.length;
    }
    return repeat(' ', count);
}

class Engine {

    constructor (options) {
        this.options = options || {};
        this.lines = [];
        this.buffer = [];
        this.afterCode = false;
        this.afterNoop = false;
        this.tabs = '';
        if (this.options.with) {
            this.lines.push('with (locals) {');
        }
        this.lines.push(`${TAB}let ${OUTPUT} = [];`);
    }

    compile (template) {
        forEach(template.split('\n'), (line) => {
            if (isCode(line)) {
                this.flushBuffer();
                this.lines.push(line);
                this.afterCode = true;
                this.tabs = getTabs(line);
            } else if (isNoop(line)) {
                this.buffer.pop();
                this.afterNoop = true;
            } else {
                if (line === '') {
                    if (this.afterCode || this.afterNoop) {
                        this.afterCode = false;
                        this.afterNoop = false;
                        return;
                    }
                }
                if (isIgnoredCode(line)) {
                    line = line.replace('!', '');
                }
                this.buffer.push(line);
            }
        });
        this.flushBuffer();
        this.lines.push(`${TAB}return ${OUTPUT}.join('\\n');`);
        if (this.options.with) {
            this.lines.push('}');
        }
        const code = this.lines.join('\n');
        if (this.options.debug) {
            console.log(code);
        }
        return new Function('locals', code);
    }

    flushBuffer () {
        if (this.buffer.length !== 0) {
            this.buffer = map(this.buffer, replaceOrEscapeInlineCode);
            this.lines.push(`${this.tabs}${TAB}${OUTPUT}.push(\`${this.buffer.join('\n')}\`)`);
            this.buffer = [];
        }
    }

}

module.exports.compile = function (template, options) {
    return new Engine(options).compile(template);
};
