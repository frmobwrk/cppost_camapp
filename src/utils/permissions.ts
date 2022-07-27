import React from "react";
import { Alert, Platform } from "react-native";
import { check, openSettings, PERMISSIONS, request, RESULTS } from "react-native-permissions";

const galleryPermission =
    Platform.OS == "android" ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE : PERMISSIONS.IOS.PHOTO_LIBRARY;

const isGranted = (granted: string) => {
    return granted === RESULTS.GRANTED || granted === RESULTS.LIMITED;
};

export const onHandleGalleryPermission = async (cb: React.Dispatch<React.SetStateAction<boolean>>) => {
    const status = await check(galleryPermission);
    if (status === RESULTS.DENIED) {
        const granted = await request(galleryPermission);
        cb(isGranted(granted));
        return;
    } else if (status == RESULTS.BLOCKED) {
        Alert.alert(
            "Please allow photo permissions",
            undefined,
            [
                {
                    text: "Back",
                    onPress: () => { },
                    style: "cancel",
                },
                { text: "Settings", onPress: () => openSettings().catch(() => { }) },
            ],
            { cancelable: false }
        );
    }
    cb(isGranted(status));
};
