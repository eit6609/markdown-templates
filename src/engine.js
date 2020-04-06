'use strict';

const
    { forEach, map, repeat } = require('lodash'),
    { readFileSync } = require('fs');

const
    IGNORE = '!',
    NOOP = '`-`',
    TAB = '    ';

const
    LOCALS = 'locals',
    OUTPUT = '__',
    APPEND = '__append',
    RESULT = '__result';

const
    ESCAPED_TICK_TOKEN = '\u001F',
    ESCAPED_TICK_RESTORER = new RegExp(ESCAPED_TICK_TOKEN, 'g');

function toTemplateLiteralLine (line) {
    line = line
        .replace(/\\`/g, ESCAPED_TICK_TOKEN);   // replace escaped ticks with tokens
    line = line
        .replace(/\\/g, '\\\\')                 // translate all backslashes: \ -> \\
        .replace(/\${/g, '\\${')                // escape all ${ not to start a placeholder: ${ --> \${
        .replace(/`([^`].*?)`/g, '${$1}')       // inline code becomes a placeholder: `expr` --> ${expr}
        .replace(/\${!(.*?)}/g, '`$1`')         // go back to code for non active code: ${!expr} --> `expr`
        .replace(/`/g, '\\`');                  // escape all remaining ticks: ` --> \`
    line = line
        .replace(ESCAPED_TICK_RESTORER, '\\`'); // replace tokens with escaped ticks
    return line;
}

function isCode (line) {
    return line.startsWith(TAB) && !line.trim().startsWith(IGNORE);
}

function isIgnoredCode (line) {
    return line.startsWith(TAB) && line.trim().startsWith(IGNORE);
}

function isFence (line) {
    return line.startsWith('```');
}

function isNoop (line) {
    return line === NOOP;
}

function isBlank (line) {
    return line === '';
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

// TODO an append() for staticLines like the serializer would be nice
// TODO if I join OUTPUT with '' and append \n explicitly, like in the serializer, the user can call __append() and
// choose if to add a \n or not
// TODO handle tabs better
// FIXME what happens inside a code fence?


// OPTIONS:
// - it is useful to be able to get rid of the `with` to solve ambiguity problems
// - in that case, one must be able to choose the name of the locals

class Engine {

    constructor (options = {}) {
        this.codeLines = [];
        this.staticLines = [];
        this.dropNextBlankLine = false;
        this.insideFence = false;
        this.tabs = '';
        this.with = options.with !== false;
        this.locals = options.locals || LOCALS;
        this.debug = options.debug;
        this.codeLines.push(`const ${OUTPUT} = [];`);
        this.codeLines.push(`function ${APPEND} (s) {
${TAB}${OUTPUT}.push(s);
}`);
        this.codeLines.push(`function ${RESULT} () {
${TAB}return ${OUTPUT}.join('\\n');
}`);
        if (options.with !== false) {
            this.codeLines.push(`with (${this.locals}) {`);
        }
    }

    compile (template) {
        // eslint-disable-next-line max-statements
        forEach(template.split('\n'), (line) => {
            if (isFence(line)) {
                this.insideFence = !this.insideFence;
            }
            if (this.insideFence) {
                this.staticLines.push(line);
            } else if (isCode(line)) {
                this.appendTemplateLiteral();
                this.codeLines.push(line);
                this.tabs = getTabs(line);
                this.dropNextBlankLine = true;
            } else if (isNoop(line)) {
                this.staticLines.pop();
                this.dropNextBlankLine = true;
            } else {
                if (isBlank(line)) {
                    if (this.dropNextBlankLine) {
                        this.dropNextBlankLine = false;
                    } else {
                        this.staticLines.push(line);
                    }
                } else {
                    if (isIgnoredCode(line)) {
                        line = line.replace('!', ''); // only the first occurrence gets replaced
                    }
                    this.staticLines.push(line);
                }
            }
        });
        this.appendTemplateLiteral();
        if (this.with) {
            this.codeLines.push('}');
        }
        this.codeLines.push(`return ${RESULT}();`);
        const code = this.codeLines.join('\n');
        if (this.debug) {
            console.log(code);
        }
        return new Function(this.locals, code);
    }

    appendTemplateLiteral () {
        if (this.staticLines.length !== 0) {
            const templateLiteralLines = map(this.staticLines, toTemplateLiteralLine);
            this.codeLines.push(`${this.tabs}${TAB}${APPEND}(\`${templateLiteralLines.join('\n')}\`);`);
            this.staticLines = [];
        }
    }

}

module.exports.compile = function (template, options) {
    return new Engine(options).compile(template);
};

module.exports.compileFile = function (fileName, options) {
    return module.exports.compile(readFileSync(fileName, 'utf8'), options);
};

// let line = 'abc ${ciao}, `!miao`, c:\\temp, `codice`, verita\\`';
// console.log(line);
// console.log(toTemplateLiteralLine(line));
// line = '```js';
// console.log(line);
// console.log(toTemplateLiteralLine(line));
// const codice = '001';
// console.log(`abc \${ciao}, \`miao\`, c:\\temp, ${codice}, verita\``);
