import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  TextInput,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import ImageCropper from "react-native-simple-image-cropper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../../constants/dimensions";
import CameraRoll from "@react-native-community/cameraroll";
import { HandleCrop, PhotoFileInfo } from "./Cropper";
import { colors } from "../../styles/styles";
import AlbumSelectorBottomSheet from "../bottomsheetModal/AlbumSelectorBottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { CropperParams, PhotoSpecs, ProcessedImage } from "../../types";
import FastImage from 'react-native-fast-image';

interface Props {
  selectedGroupIndex?: number;
  groups?: string[];
  willGoToNextStep: boolean;
  videoCompressConfig: {
    endTime?: number;
    quality?: "low" | "medium" | "high";
  };
  description: string;
  onChangeDescription: (val: string) => void;
  onProcessImages: (processedImages: ProcessedImage[]) => void;
}

const ImagePicker: FunctionComponent<Props> = ({
  willGoToNextStep,
  onProcessImages,
  videoCompressConfig,
  description,
  onChangeDescription
}) => {
  const [multiple, setMultiple] = useState<boolean>(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [selectedPhotoSpecs, setSelectedPhotosSpecs] = useState<PhotoSpecs[]>([]);
  const [photosEdges, setPhotosEdges] = useState<CameraRoll.PhotoIdentifier[]>([]);
  const [albums, setAlbums] = useState<CameraRoll.Album[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [lastTransform, setLastTransform] = useState<CropperParams>();
  const [selectedAlbum, setSelectedAlbum] = useState<CameraRoll.Album>();

  const albumSelectorSheetRef = useRef<BottomSheetModal>(null);
  const flickerAnim = useRef(new Animated.Value(1)).current;
  const hasNextPage = useRef<boolean>(true);
  const albumParams = useRef<CameraRoll.GetAlbumsParams>({
    assetType: "All"
  })
  const params = useRef<CameraRoll.GetPhotosParams>({
    first: 8,
    include: ["filename", "fileSize", "imageSize", "playableDuration"],
    assetType: "All",
    groupTypes: "All",
  });

  useEffect(() => {
    getAlbums();
    getPhotos();
  }, []);

  useEffect(() => {
    if (willGoToNextStep) {
      processImages();
    }
  }, [willGoToNextStep]);

  useEffect(() => {
    if (!lastTransform || selectedIndex > photosEdges?.length - 1) return;
    const param =
      lastTransform.scale < 1
        ? { positionX: 0, positionY: 0, scale: 1 }
        : { positionX: lastTransform.positionX, positionY: lastTransform.positionY, scale: lastTransform.scale };
    const defaultImage = photosEdges[selectedIndex].node.image;
    const temp = [...selectedPhotoSpecs];
    const crparamIndex = temp.findIndex((t) => t.filename == defaultImage.filename);
    if (crparamIndex === -1) {
      temp.push({ fullSize: false, filename: defaultImage.filename!, cropperParams: param });
      setSelectedPhotosSpecs(temp);
      return;
    }
    temp[crparamIndex] = { ...temp[crparamIndex], cropperParams: param };
    setSelectedPhotosSpecs(temp);
  }, [lastTransform]);

  useEffect(() => {
    if (selectedIndex > -1 && selectedIndex < photosEdges?.length - 1) {
      if (multiple) {
        handleFlicker();
      }
    }
  }, [selectedIndex]);

  const getAlbums = useCallback(() => {
    CameraRoll.getAlbums(albumParams.current).then((result) => {
      setAlbums([{ title: 'All', count: -1 }, ...result]);
      setSelectedAlbum({ title: 'All', count: -1 });
    });
  }, [albums]);

  const getPhotos = useCallback(() => {
    CameraRoll.getPhotos(params.current).then((result) => {
      const newPhotos = params.current.after ? photosEdges.concat(result.edges) : result.edges;
      setPhotosEdges(newPhotos);
      if (newPhotos.length > 0 && !params.current.after) {
        setSelectedIndex(0);
      }
      params.current.after = result.page_info.end_cursor;
      hasNextPage.current = result.page_info.has_next_page;
    });
  }, [photosEdges]);

  const loadMorePhotos = () => {
    if (!hasNextPage.current) return;
    getPhotos();
  };

  const handleFlicker = () => {
    Animated.timing(flickerAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    Animated.timing(flickerAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const onCropperParams = (params: CropperParams) => {
    setTimeout(() => {
      setLastTransform(params);
    }, 500);
  };

  const _onSelectImage = (index: number) => {
    if (!multiple) setSelectedIndex(index);
    else {
      const position = selectedPhotos.indexOf(index);
      if (position > -1) {
        const temp = [...selectedPhotos];
        temp.splice(position, 1);
        setSelectedPhotos(temp);
      } else {
        const temp = [...selectedPhotos];
        temp.push(index);
        setSelectedPhotos(temp);
      }
      setSelectedIndex(index);
    }
  };

  const onToggleMultiple = () => {
    if (selectedPhotos.indexOf(selectedIndex) === -1 && !multiple) {
      const temp = [...selectedPhotos];
      temp.push(selectedIndex);
      setSelectedPhotos(temp);
    }
    setMultiple(!multiple);
  };

  async function processImages() {
    if (multiple && selectedPhotos.length < 1) {
      onProcessImages([]);
      return Alert.alert("Please pick at least one picture");
    }
    const param = {
      selected: multiple ? [...selectedPhotos] : [selectedIndex],
      photos: photosEdges,
      cropperParams: selectedPhotoSpecs,
      cropSize: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
      HEADER_MAX_HEIGHT: SCREEN_WIDTH,
      videoCompressConfig,
    };

    if (param.selected.includes(-1)) {
      onProcessImages([]);
      return;
    }
    const res = await HandleCrop(param);
    res.sort((a, b) => a.sortIndex! - b.sortIndex!);
    onProcessImages([...res]);
  }

  const onPressAlbumSelector = () => {
    albumSelectorSheetRef.current?.present();
  }

  const onChangeAlbumSelector = (item: CameraRoll.Album) => {
    setSelectedAlbum(item);
    albumSelectorSheetRef.current?.dismiss();
    params.current.after = undefined;
    params.current.groupName = item.title === 'All' ? undefined : item.title;
    params.current.groupTypes = item.title === 'All' ? 'All' : 'Album';
    setPhotosEdges([]);
    getPhotos();
  }

  const renderItem = (item: CameraRoll.PhotoIdentifier, index: number) => {
    return (
      <TouchableOpacity
        onPress={_onSelectImage.bind(null, index)}
        activeOpacity={0.8}
        style={{
          padding: 1,
          width: SCREEN_WIDTH / 4,
          height: SCREEN_WIDTH / 4,
        }}
      >
        {multiple && (
          <View
            style={{
              position: "absolute",
              right: 7.5,
              top: 7.5,
              height: 24,
              width: 24,
              borderRadius: 24,
              borderColor: "#fff",
              borderWidth: 1,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1,
              backgroundColor: selectedPhotos.indexOf(index) > -1 ? "#318bfb" : "rgba(0,0,0,0.3)",
            }}
          >
            {selectedPhotos.indexOf(index) > -1 && (
              <Text
                style={{
                  color: "#fff",
                }}
              >
                {selectedPhotos.indexOf(index) + 1}
              </Text>
            )}
          </View>
        )}
        <FastImage
          style={{
            opacity: index === selectedIndex && !multiple ? 0.8 : 1,
            width: "100%",
            height: "100%",
          }}
          source={{
            uri: item?.node?.image?.uri, 
          }}
        />
      </TouchableOpacity>
    );
  };

  const renderSelectedAsset = () => {
    return (
      <Animated.View
        style={{
          height: SCREEN_WIDTH,
          width: SCREEN_WIDTH,
          opacity: flickerAnim,
          justifyContent: "center",
        }}
      >
        {renderAsset()}
      </Animated.View>
    );
  };

  const renderAsset = () => {
    if (selectedIndex < 0 || selectedIndex > photosEdges?.length - 1) {
      return null;
    }
    const selectedAsset = photosEdges[selectedIndex].node.image ?? "";
    return renderSelectedImage(selectedAsset);
  };

  const renderInput = () => {
    return (
      <>
        <View style={styles.inputContainer}>
          <TextInput
            autoFocus={false}
            style={styles.inputTxt}
            placeholder="Text Here"
            placeholderTextColor="gray" 
            onChangeText={onChangeDescription}
            value={description}
          />
        </View>
        <View style={styles.selectorContainer}>
          <TouchableOpacity onPress={onPressAlbumSelector}>
            <View style={styles.albumSelectorContainer}>
              <Text style={styles.albumSelectorTxt}>{selectedAlbum?.title}</Text>
              <Icon name="chevron-down" size={20} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleMultiple}
            style={{
              ...styles.btnPostTool,
              backgroundColor: multiple ? "#318bfb" : "rgba(0,0,0,0.5)",
            }}
          >
            <Icon name="layers-outline" size={20} color="#fff" />
          </TouchableOpacity>

        </View>
      </>
    )
  }

  const renderSelectedImage = (asset: PhotoFileInfo) => {
    return (
      // <ImageCropper
      //   imageUri={asset.uri}
      //   cropAreaWidth={SCREEN_WIDTH}
      //   cropAreaHeight={SCREEN_WIDTH}
      //   containerColor="#fff"
      //   areaColor="#fff"
      //   setCropperParams={onCropperParams}
      // />
      <FastImage 
        source={{
          uri: asset.uri,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    );
  };

  const renderHeader = () => {
    return (
      <>
        {renderSelectedAsset()}
        {renderInput()}
      </>
    )
  }

  return (
    <>
      <KeyboardAwareFlatList
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={SCREEN_HEIGHT / 5}
        data={photosEdges}
        onEndReached={loadMorePhotos}
        renderItem={({ item, index }) => renderItem(item, index)}
        numColumns={4}
        keyExtractor={(item, key) => `${key}`}
        ListHeaderComponent={renderHeader()}
        extraHeight={100}
      />
      <AlbumSelectorBottomSheet
        bottomSheetRef={albumSelectorSheetRef}
        data={albums}
        onSelectItem={onChangeAlbumSelector}
      />
    </>
  );
};

const styles = StyleSheet.create({
  postToolWrapper: {
    zIndex: 10,
    position: "absolute",
    bottom: 30,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 15,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  btnPostTool: {
    height: 30,
    width: 30,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 7,
    borderBottomColor: colors.lightGrey,
    borderBottomWidth: 0.25,
  },
  selectorContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    justifyContent: 'space-between',
    padding: 7,
    alignItems: 'center'
  },
  inputTxt: {
    height: '100%',
    fontSize: 16,
    color: 'black',
  },
  albumSelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 2,
  },
  albumSelectorTxt: {
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ImagePicker;