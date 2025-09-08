import { DownloadOptions, Downloader } from "../src";

async function download(options: DownloadOptions): Promise<void> {
    const downloader = new Downloader(options);
    await downloader.download();
}

download({
    paths: ['/wallpapers'],
    project: 'pinn',
    concurrency: 4,
}).catch((error) => {
    console.error('Download failed:', error);
    process.exit(1);
});