import { SourceMapConsumer } from 'source-map';
import path from 'path';
import fs from 'fs';

// Cache consumers to avoid re-parsing big map files frequently
const consumerCache: Record<string, SourceMapConsumer> = {};

export async function symbolicateStackTrace(stackDetails: string, release: string): Promise<string> {
    if (!stackDetails || !release) return stackDetails;

    // Rudimentary stack parsing: looking for lines like "at functionName (filename:line:col)"
    // Example: at a.b (webpack://_N_E/./src/app/page.tsx:12:34)
    const lines = stackDetails.split('\n');
    const newLines = [];

    for (const line of lines) {
        // Match standard Chrome/Node trace:  at Function (http://localhost:3000/_next/static/chunks/app/page.js:14:23)
        // This regex is a simplified MVP version.
        const match = line.match(/\((.*?):(\d+):(\d+)\)/);

        if (match) {
            const [fullMatch, url, lineNo, colNo] = match;
            const filename = path.basename(url); // e.g. page.js

            // Look for map file: page.js.map
            // Basic assumption: map file is named {filename}.map
            const mapFileName = `${filename}.map`;
            const mapFilePath = path.join(process.cwd(), 'uploaded-sourcemaps', release, mapFileName);

            if (fs.existsSync(mapFilePath)) {
                try {
                    // Load consumer
                    const cacheKey = `${release}:${mapFileName}`;
                    if (!consumerCache[cacheKey]) {
                        const rawMap = fs.readFileSync(mapFilePath, 'utf8');
                        const jsonMap = JSON.parse(rawMap);
                        consumerCache[cacheKey] = await new SourceMapConsumer(jsonMap);
                    }

                    const consumer = consumerCache[cacheKey];
                    const originalPos = consumer.originalPositionFor({
                        line: parseInt(lineNo, 10),
                        column: parseInt(colNo, 10)
                    });

                    if (originalPos.source && originalPos.line) {
                        // Reconstruct line with original source info
                        // "    at originalFunc (webpack://source:10:5)"
                        newLines.push(line.replace(fullMatch, `(${originalPos.source}:${originalPos.line}:${originalPos.column})`));
                        continue;
                    }
                } catch (e) {
                    console.error('Symbolication failed for line:', line, e);
                }
            }
        }
        newLines.push(line);
    }

    return newLines.join('\n');
}
