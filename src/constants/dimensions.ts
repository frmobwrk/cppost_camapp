import { Dimensions, Platform } from "react-native";
import { getStatusBarHeight } from "react-native-status-bar-height";

export const STATUS_BAR_HEIGHT: number = getStatusBarHeight();
export const SCREEN_HEIGHT: number = Math.round(Dimensions.get("window").height);
export const SCREEN_WIDTH: number = Math.round(Dimensions.get("window").width);
export const CAMERA_RATIO: number = 16 / 9;
export const cameraBottomOptionsHeight: number = 60;
export const isSmallScreen: boolean =
  (Platform.OS === "android" ? 0 : STATUS_BAR_HEIGHT) + SCREEN_WIDTH * CAMERA_RATIO + cameraBottomOptionsHeight >
  SCREEN_HEIGHT;