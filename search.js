const fs = require('fs');
// const path = require('path');

const outDir = __dirname + '/out/';
const inDir = __dirname + '/out/scripts/';
// const inDir = __dirname + '/out/test/';

// const testFile = 'A Few Good Men.txt';

process.stdin.on('data', async input => {
	input = input.toString();
	let words = input.split(/\s+/);
	words.pop();
	words.push('000000000000');

	do {
		let foundWords = [];
		let foundInFile, foundIndex, foundInScript;
		for (const file of await fs.readdirSync(inDir)) {
			// if (file != testFile) {
			// 	continue;
			// }
			const script = fs.readFileSync(inDir + file).toString();
			// console.log(script);
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
				if ((index < 0 || i == words.length - 1) && prevIndex >= 0) {
					if (index == -1) {
						cumulatedWords.pop();
					}
					if (cumulatedWords.length > foundWords.length) {
						foundWords = JSON.parse(JSON.stringify(cumulatedWords));
						// if (foundWords.length == 3) {
						// 	console.log(foundWords);
						// }
						foundInFile = file;
						foundIndex = prevIndex;
						foundInScript = script;
					}
					break;
				}
				prevIndex = index;
				i++;
			}
			// console.log(script);
		}

		if (foundInScript) {
			console.log(
				`found "${foundWords.join(' ')}" in ${foundInFile} at index ${foundIndex}/${foundInScript.length} (${((100 * foundIndex) / foundInScript.length).toFixed(1)}%)`
			);
		} else {
			console.log('nothing else found!');
		}
		words = words.splice(foundWords.length);
		// console.log(words);
	} while (words.length > 1);

	// console.log('done.');
	// process.exit();
});
