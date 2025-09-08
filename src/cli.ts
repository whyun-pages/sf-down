import { Command } from "commander";
import { Downloader } from "./downloader.js";
import * as pkg from '../package.json';
const program = new Command();
interface CliOptions {
    project: string;
    dir: string;
    concurrency: number;
    timeout: number;
}
program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version)
    .option('-p, --project <project>', 'SourceForge project name', 'pinn')
    .option('-d, --dir <dir>', 'Directory to save downloaded files', './files')
    .option('-c, --concurrency <number>', 'Number of concurrent downloads', (value) => parseInt(value, 10), 4)
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', (value) => parseInt(value, 10), 10000)
    .argument('<paths...>', 'Paths to download, e.g., /os/Recalbox_-_Pi0-1')
    .action(async (paths: string[], options: CliOptions) => {
        const downloader = new Downloader({
            paths,
            project: options.project,
            saveDir: options.dir,
            concurrency: options.concurrency,
            reqTimeoutMs: options.timeout,
        });
        try {
            await downloader.download();
            console.log('All downloads completed.');
        } catch (error) {
            console.error('Download failed:', error);
            process.exit(1);
        }
        process.exit(0);
    });
program.parse(process.argv);
// If no arguments are provided, display help
if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
}
