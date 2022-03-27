const fs = require('fs');
const path = require('path');

const outDir = __dirname + '/out/';
const inDir = __dirname + '/out/scripts/';
// const inDir = __dirname + '/out/test/';

console.log('Enter some text to search for:');

process.stdin.on('data', async input => {
	input = input.toString();
	let excludeFiles = [];
	let prevNumExcludeFiles;
	let i = 0;
	do {
		console.log(`Pass ${++i}:`);
		prevNumExcludeFiles = excludeFiles.length;
		excludeFiles = excludeFiles.concat(await search(input, excludeFiles));
		console.log();
	} while (excludeFiles.length > prevNumExcludeFiles);
	console.log('Enter some text to search for:');
});

async function search(input, excludeFiles) {
	const foundInFiles = [];
	let words = input.split(/\s+/);
	words.pop();
	words.push('000000000000');

	do {
		let foundWords = [];
		let foundInFile, foundIndex, foundInScript;
		for (const file of await fs.readdirSync(inDir)) {
			if (excludeFiles && excludeFiles.includes(file)) {
				continue;
			}
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
						foundWords = cumulatedWords;
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
			const percent = ((100 * foundIndex) / foundInScript.length).toFixed(1);
			console.log(`Found "${foundWords.join(' ')}" in ${foundInFile} at index ${foundIndex}/${foundInScript.length} (${percent}%)`);
			const outFile = path.resolve(outDir + 'search-results', `${input.trim()}.txt`);
			fs.appendFileSync(outFile, foundWords.join(' ') + '\n');
			fs.appendFileSync(outFile, foundInFile + '\n');
			fs.appendFileSync(outFile, percent + '%\n');
			fs.appendFileSync(outFile, '\n');
			foundInFiles.push(foundInFile);
		} else {
			console.log('Nothing else found!');
			break;
		}
		words = words.splice(foundWords.length);
		// console.log(words);
	} while (words.length > 1);

	return foundInFiles;
}
