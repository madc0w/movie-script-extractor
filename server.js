const pageLoadTimeoutSecs = 16;

const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = __dirname + '/out';

(async () => {
	// see https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-class-browserfetcher
	// can't find any mysterious "revsion number" that actually exists. oh well.

	// const browserFetcher = puppeteer.createBrowserFetcher();
	// console.log('browserFetcher', browserFetcher);
	// const revisionInfo = await browserFetcher.download(991159);
	// console.log('revisionInfo', revisionInfo);
	const browser = await puppeteer.launch({
		args: ['--no-sandbox'],
		// executablePath: revisionInfo.executablePath,
	});

	const failFile = path.resolve(outDir, 'failures.txt');
	const failFileStream = fs.createWriteStream(failFile);

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
			// console.log('href', href);
			const movieName = href
				.substring('/Movie Scripts/'.length) //
				.replaceAll(':', '')
				.replace(' Script.html', '.html');
			const scriptLink = `https://imsdb.com/scripts/${movieName.replaceAll(' ', '-')}`;
			console.log(`getting ${scriptLink} ...`);

			try {
				const page2 = await browser.newPage();
				await page2.goto(scriptLink, {
					waitUntil: 'load',
					timeout: pageLoadTimeoutSecs * 1000,
				});
				const scriptText = await page2.$eval('pre', el => el.innerText);
				// console.log(scriptText);

				const outfile = path.resolve(outDir, movieName.replace('.html', '.txt'));
				const fileStream = fs.createWriteStream(outfile);
				fileStream.write(scriptText);
				fileStream.close();
				page2.close();
			} catch (err) {
				console.error('failed to get script', err);
				failFileStream.write(scriptLink + '\n');
				failFileStream.write(err + '\n');
				failFileStream.write('\n');
			}

			// console.log('***************************');
		}
		failFileStream.close();
		page.close();
	} catch (err) {
		console.error(err);
	}
})();

// const express = require('express');
// const server = express();

// server.listen(process.env.PORT, () => {
// 	console.log(`server listening on port ${process.env.PORT}`);
// });

// server.get('/', async function (req, res) {
// 	res.send('OK');
// });
