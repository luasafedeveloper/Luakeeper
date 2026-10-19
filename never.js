/**
 * LuaKeeper v30 Enterprise Compiler - Part 1: Lexer & Tokenizer
 * 원본 Lua/Luau 코드를 읽어 들여 구문 분석을 위한 토큰 스트림으로 변환합니다.
 */

class LuaLexer {
    constructor(source) {
        this.source = source;
        this.position = 0;
        this.length = source.length;
        this.line = 1;
        this.column = 1;
    }

    isAlpha(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
    }

    isDigit(char) {
        return char >= '0' && char <= '9';
    }

    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    peek() {
        if (this.position >= this.length) return '\0';
        return this.source[this.position];
    }

    advance() {
        const char = this.source[this.position];
        this.position++;
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        return char;
    }

    tokenize() {
        const tokens = [];
        const keywords = new Set([
            'local', 'function', 'end', 'if', 'then', 'else', 'elseif',
            'while', 'do', 'for', 'in', 'return', 'true', 'false', 'nil',
            'and', 'or', 'not', 'repeat', 'until', 'break'
        ]);

        while (this.position < this.length) {
            const char = this.peek();

            // 공백 문자 무시
            if (/\s/.test(char)) {
                this.advance();
                continue;
            }

            // 주석 처리 (-- 또는 멀티라인 --[[ ]])
            if (char === '-' && this.source[this.position + 1] === '-') {
                this.advance();
                this.advance();
                if (this.peek() === '[' && this.source[this.position + 1] === '[') {
                    this.advance();
                    this.advance();
                    while (this.position < this.length) {
                        if (this.peek() === ']' && this.source[this.position + 1] === ']') {
                            this.advance();
                            this.advance();
                            break;
                        }
                        this.advance();
                    }
                } else {
                    while (this.position < this.length && this.peek() !== '\n') {
                        this.advance();
                    }
                }
                continue;
            }

            // 식별자 및 키워드 추출
            if (this.isAlpha(char)) {
                let value = '';
                while (this.position < this.length && this.isAlphaNumeric(this.peek())) {
                    value += this.advance();
                }
                const type = keywords.has(value) ? 'KEYWORD' : 'IDENTIFIER';
                tokens.push({ type, value, line: this.line, column: this.column });
                continue;
            }

            // 숫자 리터럴 추출
            if (this.isDigit(char)) {
                let value = '';
                while (this.position < this.length && (this.isDigit(this.peek()) || this.peek() === '.')) {
                    value += this.advance();
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(value), line: this.line, column: this.column });
                continue;
            }

            // 문자열 리터럴 (' 또는 ")
            if (char === '"' || char === "'") {
                const quote = this.advance();
                let value = '';
                while (this.position < this.length && this.peek() !== quote) {
                    value += this.advance();
                }
                this.advance(); // 닫는 따옴표 건너뛰기
                tokens.push({ type: 'STRING', value, line: this.line, column: this.column });
                continue;
            }

            // 연산자 및 문법 기호 처리
            if ('+-*/%=<>~#.,(){}[]:;'.includes(char)) {
                const startChar = this.advance();
                let value = startChar;
                const nextChar = this.peek();
                if ((startChar === '=' && nextChar === '=') ||
                    (startChar === '~' && nextChar === '=') ||
                    (startChar === '<' && nextChar === '=') ||
                    (startChar === '>' && nextChar === '=') ||
                    (startChar === '.' && nextChar === '.')) {
                    value += this.advance();
                }
                tokens.push({ type: 'OPERATOR', value, line: this.line, column: this.column });
                continue;
            }

            this.advance();
        }

        tokens.push({ type: 'EOF', value: null, line: this.line, column: this.column });
        return tokens;
    }
}

module.exports = LuaLexer;
