import { Platform } from "react-native";
import { FFmpegKit, ReturnCode, FFmpegKitConfig } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

// import RNVideoHelper from "react-native-video-helper";
import ImageEditor from "@react-native-community/image-editor";
import CameraRoll from "@react-native-community/cameraroll";
import { SCREEN_WIDTH } from "../../constants/dimensions";
import { PhotoSpecs, ProcessedImage } from "../../types";

interface Props {
  selected: number[];
  photos: CameraRoll.PhotoIdentifier[];
  cropperParams: PhotoSpecs[];
  cropSize: CropSize;
  HEADER_MAX_HEIGHT: number;
  videoCompressConfig: {
    endTime?: number;
    quality?: "low" | "medium" | "high";
  };
}

interface ImageCropSpec {
  cropperParams: { scale: number; positionX: number; positionY: number };
  image: PhotoFileInfo;
  cropSize: CropSize;
  cropAreaSize: CropSize;
}

interface CropSize {
  width: number;
  height: number;
}

export interface PhotoFileInfo {
  filename: string | null;
  uri: string;
  height: number;
  width: number;
  fileSize: number | null;
  isStored?: boolean;
  playableDuration: number | null;
}

export const VidoUri = (video: PhotoFileInfo) => {
  let videoUri = video.uri;
  if (Platform.OS === "ios" && !videoUri.includes("file:///")) {
    const appleId = video.uri.substring(5, 41);
    const fil = video?.filename?.split(".");
    if (fil) {
      const ext = fil[1];
      videoUri = `assets-library://asset/asset.${ext}?id=${appleId}&ext=${ext}`;
    }
  }
  return videoUri;
};


const getPercentFromNumber = (percent: number, numberFrom: number) => {
  return (numberFrom / 100) * percent;
};

const getPercentDiffNumberFromNumber = (number: number, numberFrom: number) => {
  return (number / numberFrom) * 100;
};

const setSize = (image: PhotoFileInfo) => {
  const imageWidth = image.width;
  const imageHeight = image.height;
  const cropWidth = SCREEN_WIDTH;
  const cropHeight = SCREEN_WIDTH;

  const areaWidth = cropWidth;
  const areaHeight = cropHeight;

  const srcSize = { width: imageWidth, height: imageHeight };
  const fittedSize = { width: 0, height: 0 };
  let scale = 1;

  if (imageWidth > imageHeight) {
    const ratio = SCREEN_WIDTH / imageHeight;
    fittedSize.width = imageWidth * ratio;
    fittedSize.height = SCREEN_WIDTH;
  } else if (imageWidth < imageHeight) {
    const ratio = SCREEN_WIDTH / imageWidth;
    fittedSize.width = SCREEN_WIDTH;
    fittedSize.height = imageHeight * ratio;
  } else if (imageWidth === imageHeight) {
    fittedSize.width = SCREEN_WIDTH;
    fittedSize.height = SCREEN_WIDTH;
  }

  if (areaWidth < areaHeight || areaWidth === areaHeight) {
    if (imageWidth < imageHeight) {
      if (fittedSize.height < areaHeight) {
        scale = Math.ceil((areaHeight / fittedSize.height) * 10) / 10;
      } else {
        scale = Math.ceil((areaWidth / fittedSize.width) * 10) / 10;
      }
    } else {
      scale = Math.ceil((areaHeight / fittedSize.height) * 10) / 10;
    }
  }
  scale = scale < 1 ? 1 : scale;

  return {
    scale,
    srcSize,
    fittedSize,
  };
};

export const ImageCropper = async (params: ImageCropSpec) => {
  var positionX = params.cropperParams.positionX,
    positionY = params.cropperParams.positionY,
    scale = params.cropperParams.scale,
    image = params.image,
    cropSize = params.cropSize,
    cropAreaSize = params.cropAreaSize;
  if (!positionX) positionX = 0;
  if (!positionY) positionY = 0;
  const exp = setSize(image);
  var srcSize = exp.srcSize,
    fittedSize = exp.fittedSize;
  var offset = {
    x: 0,
    y: 0,
  };
  var cropAreaW = cropAreaSize ? cropAreaSize.width : SCREEN_WIDTH;
  var cropAreaH = cropAreaSize ? cropAreaSize.height : SCREEN_WIDTH;
  var wScale = cropAreaW / scale;
  var hScale = cropAreaH / scale;
  var percentCropperAreaW = getPercentDiffNumberFromNumber(wScale, fittedSize.width);
  var percentRestW = 100 - percentCropperAreaW;
  var hiddenAreaW = getPercentFromNumber(percentRestW, fittedSize.width);
  var percentCropperAreaH = getPercentDiffNumberFromNumber(hScale, fittedSize.height);
  var percentRestH = 100 - percentCropperAreaH;
  var hiddenAreaH = getPercentFromNumber(percentRestH, fittedSize.height);
  var x = hiddenAreaW / 2 - positionX;
  var y = hiddenAreaH / 2 - positionY;
  offset.x = x <= 0 ? 0 : x;
  offset.y = y <= 0 ? 0 : y;
  var srcPercentCropperAreaW = getPercentDiffNumberFromNumber(offset.x, fittedSize.width);
  var srcPercentCropperAreaH = getPercentDiffNumberFromNumber(offset.y, fittedSize.height);
  var offsetW = getPercentFromNumber(srcPercentCropperAreaW, srcSize.width);
  var offsetH = getPercentFromNumber(srcPercentCropperAreaH, srcSize.height);
  var sizeW = getPercentFromNumber(percentCropperAreaW, srcSize.width);
  var sizeH = getPercentFromNumber(percentCropperAreaH, srcSize.height);
  offset.x = Math.floor(offsetW);
  offset.y = Math.floor(offsetH);
  var cropData = {
    offset: offset,
    size: {
      width: Math.round(sizeW),
      height: Math.round(sizeH),
    },
    displaySize: {
      width: Math.round(cropSize.width * 2.2),
      height: Math.round(cropSize.height * 2.2),
    },
  };

  return await ImageEditor.cropImage(image.uri, cropData);
};

export const HandleCrop = async (param: Props) => {
  const { selected, photos, cropperParams, cropSize, videoCompressConfig, HEADER_MAX_HEIGHT } = param;
  let { endTime, quality } = videoCompressConfig;

  const cropAreaSize = {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  };
  try {
    let result: ProcessedImage[] = [];
    await Promise.all(
      selected.map(async (t, idx) => {
        const image = photos[t].node.image;
        const videoUri = VidoUri(image);
        if (image.playableDuration) {
          try {
            let crop_levels = {
              low : 18,
              medium: 23,
              high: 28
            }
            let str_for_ffmpeg_command = "";
            if(quality){
              str_for_ffmpeg_command = '-crf ' + crop_levels[ quality ];
            }else{
              str_for_ffmpeg_command = '-crf ' +  crop_levels[ 'medium' ];
            }
            if( endTime )
            {
              let hhmmss = new Date(endTime * 1000).toISOString().slice(11, 19);

              str_for_ffmpeg_command += ' -to ' + hhmmss;

            }
            let rndm_name = parseInt(Math.random()*10000000);
            let newSource =  `${RNFS.ExternalDirectoryPath}/video.zscaled_new${rndm_name}.mp4`;
            let fullcommand = `-i ${videoUri}  -c:v libx264 -preset ultrafast  ${str_for_ffmpeg_command} -c:a copy  ${newSource}`;
            const session = await FFmpegKit.execute(fullcommand).then(
              (result) => {
                return result;
              },
            );
            const state = FFmpegKitConfig.sessionStateToString(await session.getState());
            const returnCode = await session.getReturnCode();
            const failStackTrace = await session.getFailStackTrace();
            console.log(`FFmpeg process exited with state ${state}`);

            if (ReturnCode.isSuccess(returnCode)) {
              console.log( "zscale completed successfully.");
              if (Platform.OS === "android" && !newSource.includes("file:///")) {
                newSource = `file://${newSource}`;
              }
              const extension = image?.filename?.split(".").pop()?.toLocaleLowerCase();
              result.push({
                type: "video",
                fullSize: false,
                uri: newSource,
                extension: extension as string,
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                sortIndex: idx,
              });
            } else {
              console.log( "zscale failed. Please check logs for the details.");
            }
            const extension = image?.filename?.split(".").pop()?.toLocaleLowerCase();
            result.push({
              type: "video",
              fullSize: false,
              uri: newSource,
              extension: extension as string,
              width: SCREEN_WIDTH,
              height: SCREEN_WIDTH,
              sortIndex: idx,
            });
          } catch (error) {
            console.log(error);
          }
        } else {
          const crpIndex = cropperParams.findIndex((t) => t.filename == image.filename);
          let crp = { scale: 1, positionX: 0, positionY: 0 };
          if (crpIndex !== -1) {
            crp = cropperParams[crpIndex].cropperParams;
          }
          const eresult = await ImageCropper({
            cropperParams: crp,
            image: image,
            cropSize,
            cropAreaSize,
          });
          const extension = image?.filename?.split(".").pop()?.toLocaleLowerCase();
          result.push({
            uri: eresult,
            type: "photo",
            fullSize: false,
            extension: extension as string,
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH,
            sortIndex: idx,
          });
        }
      })
    );
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
