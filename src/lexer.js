class Lexer {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
        this.tokens = [];
        this.tokenSpec = [
            ['TEST', /test/],
            ['OPEN', /open/],
            ['CLICK', /click/],
            ['INPUT', /input/],
            ['ASSERT', /assert/],
            ['STRING', /"[^"]*"/],
            ['IDENTIFIER', /[a-zA-Z0-9_-]+/],
            ['CONTAINS', /contains/],
            ['LBRACE', /\{/],
            ['RBRACE', /\}/],
            ['WHITESPACE', /\s+/],
        ];
    }

    tokenize() {
        let input = this.sourceCode;
        while (input.length > 0) {
            let matched = false;
            for (let [type, regex] of this.tokenSpec) {
                const match = regex.exec(input);
                if (match && match.index === 0) {
                    if (type !== 'WHITESPACE') {
                        this.tokens.push({ type, value: match[0] });
                    }
                    input = input.slice(match[0].length);
                    matched = true;
                    break;
                }
            }
            if (!matched) throw new Error(`Unexpected token: ${input[0]}`);
        }
        console.log('this.tokens', this.tokens);
        return this.tokens;
    }
}

export default Lexer;