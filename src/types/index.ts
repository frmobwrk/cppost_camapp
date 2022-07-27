export type ProcessedImage = {
    uri: string;
    width: number;
    height: number;
    extension: string;
    fullSize: boolean;
    type: "video" | "photo";
    thumbnail?: string;
    sortIndex?: number;
};

export interface PhotoSpecs {
    fullSize: boolean;
    filename: string;
    cropperParams: CropperParams;
};

export interface CropperParams {
    positionX: number;
    positionY: number;
    scale: number;
};

export type PostImage = {
    uri: string;
    width: number;
    height: number;
    extension: string;
    fullSize: boolean;
    type: "video" | "photo";
    thumbnail?: string;
};