import './bootloader.css';
import {Asset, Assets, ProgressCallback, Report} from "./types";

class Bootloader {
    private readonly assets: Assets;
    private readonly totalSize: number;
    private readonly progressMap: { [key: string]: number } = {};

    constructor(assets: Assets) {
        this.assets = assets;
        this.totalSize = Bootloader.getTotalSize(assets);
    }

    private static getTotalSize(assets: Assets): number {
        const cssAssets = assets.css || [];
        const jsAssets = assets.js || [];

        const sum = (acc: number, asset: Asset) => acc + (asset.size || 0);
        return cssAssets.reduce(sum, 0) + jsAssets.reduce(sum, 0);
    }

    private updateProgress(src: string, size: number): boolean {
        if (size >= 0) {
            const currentValue = this.progressMap[src] || 0;
            if (size > currentValue) {
                this.progressMap[src] = size;
                return true;
            }
        }
        return false;
    }

    private getProgress(): number {
        return Object.keys(this.progressMap)
            .reduce((acc, src) => acc + this.progressMap[src], 0);
    }

    private static createScriptTag(src: string, id: string): HTMLScriptElement {
        const tag = document.createElement("script");
        tag.id = id;
        tag.type = "text/javascript";
        tag.src = src;
        return tag;
    }

    private static createCssTag(href: string, id: string): HTMLLinkElement {
        const tag = document.createElement("link");
        tag.id = id;
        tag.rel = "stylesheet";
        tag.href = href;
        return tag;
    }

    private loadAsset(asset: Asset, js: boolean): Promise<Asset> {
        return new Promise((resolve, reject) => {
            const assetId = `asset_${asset.file}`;
            //remove asset if it exists
            const oldAsset = document.getElementById(assetId);
            oldAsset && document.head?.removeChild(oldAsset);
            //create new asset
            const tag = js ? Bootloader.createScriptTag(asset.file, assetId) : Bootloader.createCssTag(asset.file, assetId);
            tag.onload = () => {
                //remove listeners
                tag.onload = tag.onerror = null;
                //resolve promise
                resolve(asset);
            };
            tag.onerror = (error) => {
                //remove listeners
                tag.onload = tag.onerror = null;
                //reject promise
                reject(error);
            };
            document.head?.appendChild(tag);
        });
    }

    private loadAssets(assets: Asset[], js: boolean, cb: ProgressCallback): Promise<Report> {
        const report: Report = {
            succeeded: [],
            failed: []
        }
        const tasks = assets.map(asset => this.loadAsset(asset, js)
            .then(done => {
                report.succeeded.push(done);
                this.updateProgress(done.file, done.size) &&
                cb({
                    totalSize: this.totalSize,
                    loaded: this.getProgress()
                });
            })
            .catch(error => {
                report.failed.push({asset, error});
            }));
        return Promise.all(tasks).then(() => report);
    }

    private mergeReport(lr1: Report, lr2: Report): void {
        lr2.succeeded.forEach(i => lr1.succeeded.push(i));
        lr2.failed.forEach(i => lr1.failed.push(i));
    }

    public load(cb: ProgressCallback): Promise<Report> {
        const cssAssets = this.assets.css || [];
        const jsAssets = this.assets.js || [];

        const fullReport: Report = {
            succeeded: [],
            failed: []
        };

        return this.loadAssets(cssAssets, false, cb)
            .then(report => {
                this.mergeReport(fullReport, report);
                return this.loadAssets(jsAssets, true, cb);
            })
            .then(report => {
                this.mergeReport(fullReport, report);
                return fullReport;
            });
    }
}

export function bootstrap() {
    const assets = window?.$bootloader?.assets || {};
    new Bootloader(assets)
        .load(e => {
            const progress = e.loaded / e.totalSize;
            const progressBar = document.getElementById("progressbar");
            progressBar?.setAttribute("value", progress.toString());
            console.log(e.loaded, e.loaded / e.totalSize);//TODO remove
        }).then(report => {
        console.log("done", report);//TODO remove
    });
}

document.addEventListener("DOMContentLoaded", bootstrap);
