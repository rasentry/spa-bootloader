export interface Asset {
    file: string;
    size: number;
}

export interface Assets {
    css: Asset[];
    js: Asset[];
}

declare global {
    interface Window {
        $bootloader: {
            assets: Assets;
        }
    }
}

export type ProgressCallback = (data: { totalSize: number; loaded: number }) => void;

export type Report = {
    succeeded: Asset[];
    failed: { asset: Asset, error: any }[];
};
