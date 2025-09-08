import * as https from 'https';
import { DOMParser } from '@xmldom/xmldom';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { IncomingMessage } from "http";
import { ReadableStream } from 'stream/web';
export interface DownloadOptions {
    paths: string[];
    project: string;
    saveDir?: string;
    concurrency?: number;
    // connectTimeoutMs?: number;
    reqTimeoutMs?: number;
}
interface FileItem {
    title: string;
    link: string;
    refer?: string;
}
export const DEFAULT_CONCURRENCY = 8;
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
export const DEFAULT_SAVE_DIR = './files';
export const BASE_URL = 'https://sourceforge.net'
export const DOWNLOAD_BASE_URL = 'https://master.dl.sourceforge.net';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0';
export class Downloader {
    public readonly paths: string[];
    public readonly project: string
    public readonly saveDir: string;
    public readonly rssUrls: string[];
    private readonly agent: https.Agent;
    public readonly reqTimeoutMs: number;
    public constructor(options: DownloadOptions) {
        if (!options.paths || options.paths.length === 0) {
            throw new TypeError('No paths provided for download.');
        }
        this.paths = options.paths;
        this.project = options.project;
        this.saveDir = options.saveDir || DEFAULT_SAVE_DIR;
        this.agent = new https.Agent({
            keepAlive: true,
            maxSockets: options.concurrency || DEFAULT_CONCURRENCY,
            // timeout: options.connectTimeoutMs || DEFAULT_CONNECT_TIMEOUT_MS,
        });
        this.reqTimeoutMs = options.reqTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
        this.rssUrls = options.paths.map(path => {
            return `${BASE_URL}/project/${options.project}/rss?path=${(path)}`;
        });
    }
    private async fetchRss(url: string, files: FileItem[]) {
        const responseXml = await fetch(url);
        if (!responseXml.ok) {
            throw new Error(`Failed to fetch RSS feed: ${responseXml.status} ${responseXml.statusText}`);
        }
        const xml = await responseXml.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "application/xml");
        const items = xmlDoc.getElementsByTagName("item");
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i] as Element;
            const titleElement = item.getElementsByTagName("title")[0] as Element;
            const linkElement = item.getElementsByTagName("link")[0] as Element;
            const filePath = titleElement.textContent || '';
            files.push({
                title: filePath,
                link: `${DOWNLOAD_BASE_URL}/project/${this.project}${filePath}?viasf=1`,
                refer: linkElement.textContent || '',
            });
        }
    }
    private async getFileList() {
        const files: FileItem[] = [];
        await Promise.all(this.rssUrls.map(url => this.fetchRss(url, files)));
        
        return files;
    }
    private async httpsGet(file: FileItem): Promise<IncomingMessage> {
        const getPromise = new Promise<IncomingMessage>((resolve, reject) => {
            const req = https.get(file.link, {
                agent: this.agent,
                headers: {
                    "User-Agent": USER_AGENT,
                    "Referer": file.refer || BASE_URL,
                    'DNT': '1',
                    'Upgrade-Insecure-Requests': '1',
                    'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                },
            }, (res: IncomingMessage) => {
                if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                    reject(new Error(`Failed to download file ${file.link}: ${res.statusCode} ${res.statusMessage}`));
                    return;
                }
                resolve(res)
            }).on('error', (err: unknown) => {
                reject(err);
            });
            req.setTimeout(this.reqTimeoutMs, () => {
                req.destroy();
                reject(new Error(`Request timed out after ${this.reqTimeoutMs} ms`));
            });
        });
        return getPromise;
    }
    private async downloadLegacy(file: FileItem) {
        const response = await this.httpsGet(file);
        const saveDir = path.join(this.saveDir, path.dirname(file.title));
        await fs.mkdir(saveDir, { recursive: true });
        const filename = path.basename(file.title);
        const filePath = path.join(saveDir, filename);
        const fileHandle = await fs.open(filePath, 'w');
        const writer = fileHandle.createWriteStream();
        console.log(`Downloading ${file.title}...`);
        await pipeline(response, writer);
        await fileHandle.close();
        console.log(`Downloaded ${file.title} to ${filePath}`);
    }
    private async downloadFile(file: FileItem) {
        const response = await fetch(file.link, {
            // dispatcher: this.pool,
            method: 'GET',
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": file.refer || BASE_URL,
                'DNT': '1',
                'Upgrade-Insecure-Requests': '1',
                'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
            },
        });
        if (!response.ok) {
            console.error(`Failed to download file ${file.link}: ${response.status} ${response.statusText}`);
            return;
        }

        const saveDir = path.join(this.saveDir, path.dirname(file.title));
        await fs.mkdir(saveDir, { recursive: true });
        const filename = path.basename(file.title);
        const filePath = path.join(saveDir, filename);
        const fileHandle = await fs.open(filePath, 'w');
        const writer = fileHandle.createWriteStream();
        console.log(`Downloading ${file.title}...`);
        const nodeReadable = Readable.fromWeb(response.body as ReadableStream<Buffer>);
        await pipeline(nodeReadable, writer);
        await fileHandle.close();
        console.log(`Downloaded ${file.title} to ${filePath}`);
    }
    public async download() {
        const files = await this.getFileList();
        console.log(`Found ${files.length} files to download.`);
        const downloadPromises = files.map(file => this.downloadLegacy(file));
        await Promise.all(downloadPromises);
    }

}