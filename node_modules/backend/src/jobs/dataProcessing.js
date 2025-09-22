/* stylelint-disable */
/* src/jobs/dataProcessing.js */

const fs = require('fs');
const path = require('path');

/**
 * Strips HTML tags and normalizes whitespace.
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
    if (typeof text !== 'string') return '';
    const noHtml = text.replace(/<[^>]*>/g, ' ');
    return noHtml.replace(/\s+/g, ' ').trim();
}

/**
 * Very simple keyword extraction by term frequency, ignoring stopwords.
 * @param {string} text
 * @param {number} [limit=10]
 * @returns {Array<{word: string, count: number}>}
 */
function extractKeywords(text, limit = 10) {
    const content = cleanText(text).toLowerCase();
    if (!content) return [];
    const stopwords = new Set([
        'the', 'is', 'in', 'and', 'or', 'to', 'a', 'of', 'for', 'on', 'with', 'at', 'by', 'an', 'be', 'as', 'are', 'it', 'that', 'this', 'from', 'was', 'were', 'we', 'you', 'your', 'our'
    ]);
    const counts = new Map();
    for (const token of content.split(/[^a-z0-9]+/g)) {
        if (!token || stopwords.has(token) || token.length < 3) continue;
        counts.set(token, (counts.get(token) || 0) + 1);
    }
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word, count]) => ({ word, count }));
}

/**
 * Generates a URL-friendly slug from a title or text.
 * @param {string} text
 * @returns {string}
 */
function generateSlug(text) {
    return cleanText(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Returns the first N sentences as a naive summary.
 * @param {string} text
 * @param {number} [numSentences=2]
 * @returns {string}
 */
function summarize(text, numSentences = 2) {
    const content = cleanText(text);
    if (!content) return '';
    const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
    return sentences.slice(0, numSentences).join(' ');
}

/**
 * Light language guess based on ASCII ratio; returns 'en' or 'unknown'.
 * @param {string} text
 * @returns {string}
 */
function guessLanguage(text) {
    const content = typeof text === 'string' ? text : '';
    if (!content) return 'unknown';
    const ascii = (content.match(/[\x00-\x7F]/g) || []).length;
    const ratio = ascii / content.length;
    return ratio > 0.9 ? 'en' : 'unknown';
}

/**
 * Process a single content item.
 * @param {{ id?: string|number, title?: string, body?: string, content?: string, [key:string]: any }} item
 * @param {{ summarySentences?: number, keywordLimit?: number }} [options]
 * @returns {object}
 */
function processItem(item, options = {}) {
    const { summarySentences = 2, keywordLimit = 10 } = options;
    const title = item.title || '';
    const body = item.body || item.content || '';
    const cleaned = cleanText(body);
    const summary = summarize(cleaned, summarySentences);
    const keywords = extractKeywords(cleaned, keywordLimit);
    const slug = item.slug || generateSlug(title || cleaned.slice(0, 60));
    const language = item.language || guessLanguage(body || title);

    return {
        ...item,
        title: title || cleaned.slice(0, 80),
        slug,
        language,
        cleaned,
        summary,
        keywords,
        wordCount: cleaned ? cleaned.split(/\s+/).length : 0,
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Process an array of items or a single item.
 * @param {object|object[]} data
 * @param {{ summarySentences?: number, keywordLimit?: number }} [options]
 * @returns {Promise<object|object[]>}
 */
async function processData(data, options = {}) {
    try {
        if (Array.isArray(data)) {
            return data.map((item) => processItem(item, options));
        }
        if (typeof data === 'object' && data) {
            return processItem(data, options);
        }
        throw new Error('Unsupported data format. Expected object or array of objects.');
    } catch (error) {
        console.error('Data processing error:', error.message);
        throw error;
    }
}

/**
 * Read .json or .md files from a directory and process them.
 * - .json files: expects an object or array of objects
 * - .md files: wraps raw content into an item { title, content }
 * @param {string} directory
 * @param {{ summarySentences?: number, keywordLimit?: number, mdTitleFrom?: 'filename'|'firstHeading' }} [options]
 * @returns {Promise<object[]>}
 */
async function processDirectory(directory, options = {}) {
    const results = [];
    try {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            const fullPath = path.join(directory, file);
            if (ext === '.json') {
                const raw = fs.readFileSync(fullPath, 'utf8');
                const json = JSON.parse(raw);
                const processed = await processData(json, options);
                if (Array.isArray(processed)) results.push(...processed);
                else results.push(processed);
            } else if (ext === '.md' || ext === '.markdown') {
                const raw = fs.readFileSync(fullPath, 'utf8');
                let title = '';
                if (options.mdTitleFrom === 'filename') {
                    title = path.basename(file, ext);
                } else {
                    const headingMatch = raw.match(/^#\s+(.+)$/m);
                    title = headingMatch ? headingMatch[1].trim() : path.basename(file, ext);
                }
                const item = { title, content: raw, sourceFile: file };
                results.push(processItem(item, options));
            } else {
                // ignore other file types
            }
        }
        return results;
    } catch (error) {
        console.error('Directory processing error:', error.message);
        throw error;
    }
}

module.exports = {
    cleanText,
    extractKeywords,
    generateSlug,
    summarize,
    guessLanguage,
    processItem,
    processData,
    processDirectory,
};


