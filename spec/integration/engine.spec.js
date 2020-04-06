'use strict';

const
    { compileFile } = require('../../src/engine.js'),
    { readFileSync } = require('fs');

const
    TEMPLATE_FILENAME = 'spec/fixtures/template.md',
    RESULT_FILENAME = 'spec/fixtures/result.md';

describe('Engine [integration]', () => {

    describe('compileFile()', () => {
        it('should give the expected markdown', () => {
            const expectedMarkdown = readFileSync(RESULT_FILENAME, 'utf8');
            const data = {
                name: 'Bob',
                items: ['scissors', 'paper', 'rock'],
                freeShipping: true
            };
            const markdown = compileFile(TEMPLATE_FILENAME, { debug: true })(data);
            // console.log('markdown');
            console.log(markdown);
            // console.log('expectedMarkdown');
            // console.log(expectedMarkdown);
            // expect(markdown).toEqual(expectedMarkdown);
        });
    });

});
