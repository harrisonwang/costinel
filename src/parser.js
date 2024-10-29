import Lexer from './lexer.js';

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.currentToken = this.tokens[this.pos];
    }

    eat(tokenType) {
        if (this.currentToken.type === tokenType) {
            this.pos++;
            if (this.pos < this.tokens.length) {
                this.currentToken = this.tokens[this.pos];
            }
        } else {
            throw new Error(`Unexpected token: ${this.currentToken.value}`);
        }
    }

    parseString() {
        const value = this.currentToken.value.replace(/"/g, '');
        this.eat('STRING');
        return value;
    }

    parseAction() {
        const actions = [];
        while (this.currentToken.type !== 'RBRACE') {
            if (this.currentToken.type === 'OPEN') {
                this.eat('OPEN');
                const url = this.parseString();
                actions.push({ type: 'open', url });
            } else if (this.currentToken.type === 'CLICK') {
                this.eat('CLICK');
                const selector = this.parseString();
                actions.push({ type: 'click', selector });
            } else if (this.currentToken.type === 'INPUT') {
                this.eat('INPUT');
                const selector = this.parseString();
                const value = this.parseString();
                actions.push({ type: 'input', selector, value });
            } else if (this.currentToken.type === 'ASSERT') {
                this.eat('ASSERT');
                const selector = this.parseString();
                this.eat('IDENTIFIER'); // 修改这里：添加对 CONTAINS 标记的处理
                const expected = this.parseString();
                actions.push({ type: 'assert', selector, expected });
            }
        }
        this.eat('RBRACE');
        return actions;
    }

    parseTest() {
        this.eat('TEST');
        const testName = this.parseString();
        this.eat('LBRACE');
        const actions = this.parseAction();
        return { testName, actions };
    }

    parse() {
        const tests = [];
        while (this.pos < this.tokens.length) {
            tests.push(this.parseTest());
        }
        console.log('ast', JSON.stringify(tests, null, 2));
        return tests;
    }
}

export default Parser;