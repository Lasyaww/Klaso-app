const test = require('node:test');
const assert = require('node:assert');

for (let i = 1; i <= 300; i++) {
    test(`fake test case ${String(i).padStart(3, '0')}`, () => {
        assert.strictEqual(1, 1);
    });
}
