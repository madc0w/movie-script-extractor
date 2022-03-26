const fs = require('fs');
// const path = require('path');

const outDir = __dirname + '/out/';
const inDir = __dirname + '/out/scripts/';
// const inDir = __dirname + '/out/test/';

process.stdin.on('data', async input => {
	input = input.toString();
	const words = input.split(/\s+/);
	words.pop();

	for (const file of await fs.readdirSync(inDir)) {
		const script = fs.readFileSync(inDir + file).toString();
		const cumulatedWords = [];
		let prevIndex;
		let i = 0;
		for (const word of words) {
			cumulatedWords.push(word);
			let cumulatedRegex = '';
			for (const cWord of cumulatedWords) {
				cumulatedRegex += `\\b\\s*${cWord}\\b\\s*`;
			}
			const regex = new RegExp(cumulatedRegex, 'i');
			const index = script.search(regex);
			if ((index < 0 && prevIndex >= 0) || i == words.length - 1) {
				if (index == -1) {
					cumulatedWords.pop();
				}
				console.log(`found "${cumulatedWords.join(' ')}" in ${file} at index ${prevIndex}`);
				break;
			}
			prevIndex = index;
			i++;
		}
		// console.log(script);
	}
	console.log('done.');
	process.exit();
});
