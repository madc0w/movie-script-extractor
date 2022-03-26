const movieNames = [
	'25th Hour',
	'Bourne Supremacy, The',
	'Catwoman',
	'Collateral',
	'El Mariachi',
	'Get Shorty',
	'Incredibles, The',
	'Rushmore',
	'Star Wars Revenge of the Sith',
	'Village, The',
];

const pageLoadTimeoutSecs = 16;

// const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = __dirname + '/out';

const failFile = path.resolve(outDir, 'failures.txt');
const failFileStream = fs.createWriteStream(failFile);

let browser;
(async () => {
	// see https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-class-browserfetcher
	// can't find any mysterious "revsion number" that actually exists. oh well.

	// const browserFetcher = puppeteer.createBrowserFetcher();
	// console.log('browserFetcher', browserFetcher);
	// const revisionInfo = await browserFetcher.download(991159);
	// console.log('revisionInfo', revisionInfo);
	browser = await puppeteer.launch({
		args: ['--no-sandbox'],
		// executablePath: revisionInfo.executablePath,
	});

	if (movieNames) {
		for (const movieName of movieNames) {
			await getScript(movieName + '.html');
		}
	} else {
		try {
			const page = await browser.newPage();
			await page.goto('https://imsdb.com/all-scripts.html', {
				waitUntil: 'load',
				timeout: pageLoadTimeoutSecs * 1000,
			});
			await page.waitForNetworkIdle({
				timeout: 30 * 1000,
				idleTime: 2 * 1000,
			});
			const hrefs = await page.$$eval('p a', el => el.map(e => e.getAttribute('href')));
			for (const href of hrefs) {
				const movieName = href
					.substring('/Movie Scripts/'.length) //
					.replaceAll(':', '')
					.replaceAll('?', '')
					.replace(' Script.html', '.html');
				getScript(movieName);
				// console.log('***************************');
			}
			failFileStream.close();
			page.close();
		} catch (err) {
			console.error(err);
		}
	}
	console.log('done.');
	process.exit();
})();

async function getScript(movieName) {
	const scriptLink = `https://imsdb.com/scripts/${movieName.replaceAll(' ', '-')}`;
	console.log(`getting ${scriptLink} ...`);
	try {
		const page = await browser.newPage();
		await page.goto(scriptLink, {
			waitUntil: 'load',
			timeout: pageLoadTimeoutSecs * 1000,
		});
		let scriptText;
		try {
			scriptText = await page.$eval('pre', el => el.innerText);
			// console.log(scriptText);
		} catch (err) {
			// look for <td class="scrtext"> instead
			scriptText = await page.$eval('td.scrtext', el => el.innerText);
		}
		const outfile = path.resolve(outDir + '/scripts', movieName.replace('.html', '.txt'));
		const fileStream = fs.createWriteStream(outfile);
		fileStream.write(scriptText);
		fileStream.close();
		page.close();
	} catch (err) {
		console.error('failed to get script', err);
		failFileStream.write(scriptLink + '\n');
		failFileStream.write(err + '\n');
		failFileStream.write('\n');
	}
}

// const express = require('express');
// const server = express();

// server.listen(process.env.PORT, () => {
// 	console.log(`server listening on port ${process.env.PORT}`);
// });

// server.get('/', async function (req, res) {
// 	res.send('OK');
// });
