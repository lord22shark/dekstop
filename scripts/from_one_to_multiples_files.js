/**
 * Converts Dekstop 1.0 *.np single file to multiples Dekstop 2.0 dkt files
 */

const path = require('path');
const fs = require('fs');

const tagPattern = /\/\@\s{1}\[([A-Z0-9a-z\-\_ ]+)\]([^]*?)\[\@\\/gm;

fs.readFile('source.np', {encoding: 'utf8', flag: 'r'}, (error, source) => {

	if (error) {

		console.log(error);

	} else {

		while ((tagMatch = tagPattern.exec(source)) != null) {

			let title = tagMatch[1];
			
			let content = tagMatch[2];

			try{
			
				fs.writeFileSync(`${title}.dkt`, `/@ [${title}]\n${content}\n[@\\`);

				console.log(`[SUCCESS] ${title}`);	
			
			} catch (e) {
			
				console.log(`[FAIL] ${title}: ${e.toString()}`);
			
			}

		}		

	}

});
