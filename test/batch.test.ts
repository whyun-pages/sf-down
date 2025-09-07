import { Downloader } from "../src";

const oses = [
    'Recalbox_-_Pi0-1',
    // 'XBian_RPi1',
    // 'piCorePlayer',
    // 'Retropie1',
    // 'recalbox1',
    // 'openelec_rpi1',
    // 'lede2RPi1',
    // 'kali1',
    // 'openwrt1',
];
const osRPFs: string[] = [
    // 'raspios_armhf_lite',
];

async function downloadAll() {
    const paths: string[] = [];
    oses.forEach((os) => {
        paths.push(`/os/${os}`);
    });
    osRPFs.forEach((os) => {
        paths.push(`/os_rpf/${os}`);
    });
    await Promise.all(paths.map((path) => new Downloader({
        path,
        project: 'pinn',
        concurrency: 4,
    }). download()));
}
downloadAll().then(() => {
    console.log('All downloads completed.');
    process.exit(0);
}).catch((error) => {
    console.error('Download failed:', error);
    process.exit(1);
});