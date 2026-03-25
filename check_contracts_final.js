const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, 'components', 'Contracts.tsx'), 'utf8');

function checkBalance(text) {
    let div = 0;
    let paren = 0;
    let bracket = 0;
    let brace = 0;

    const lines = text.split('\n');
    lines.forEach((line, i) => {
        // Simple heuristic for div tags
        const openDivs = (line.match(/<div/g) || []).length;
        const closeDivs = (line.match(/<\/div/g) || []).length;
        div += openDivs;
        div -= closeDivs;

        for (let char of line) {
            if (char === '(') paren++;
            if (char === ')') paren--;
            if (char === '[') bracket++;
            if (char === ']') bracket--;
            if (char === '{') brace++;
            if (char === '}') brace--;
        }
    });

    console.log(`Div balance: ${div}`);
    console.log(`Paren balance: ${paren}`);
    console.log(`Bracket balance: ${bracket}`);
    console.log(`Brace balance: ${brace}`);
    
    if (div !== 0 || paren !== 0 || bracket !== 0 || brace !== 0) {
        console.log("UNBALANCED DETECTED!");
    } else {
        console.log("BALANCED!");
    }
}

checkBalance(content);
