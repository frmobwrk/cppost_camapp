/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import React, { useEffect, useState } from 'react';
import {
  LogBox,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import Loading from './src/components/Loading';
import NavigationBar from './src/components/navigationbar';
import ImagePicker from './src/components/picker/ImagePicker';
import { STATUS_BAR_HEIGHT } from './src/constants/dimensions';
import { useCreatorActions } from './src/hooks/useCreatorActions';
import { ProcessedImage } from './src/types';
import { onHandleGalleryPermission } from './src/utils/permissions';
import { wait } from './src/utils/utils';

LogBox.ignoreLogs(['LogBox.js:154 Easing was renamed to EasingNode in Reanimated 2. Please use EasingNode instead']);
LogBox.ignoreAllLogs();

const App = () => {
  const [isGalleryVisible, setIsGalleryVisible] = useState<boolean>(false);
  const [willGoToNextStep, setWillGoToNextStep] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { uploadPost } = useCreatorActions();

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    if (processedImages.length > 0) {
      onStartUpload(processedImages, description);
    }
  }, [processedImages]);

  const checkPermission = async () => {
    await onHandleGalleryPermission(setIsGalleryVisible)
  }

  const onPressPublish = () => {
    setWillGoToNextStep(true);
  }

  const onStartUpload = async (postImages: ProcessedImage[], details: string) => {
    setLoading(true);
    await wait(2000);
    await uploadPost(postImages, details);
    setLoading(false);
    setWillGoToNextStep(false);
  }
  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={styles.container}>
        {
          loading && <Loading />
        }
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <NavigationBar rightTitle='Publish' rightCallback={onPressPublish} />
        {
          isGalleryVisible && (
            <ImagePicker
              willGoToNextStep={willGoToNextStep}
              onProcessImages={setProcessedImages}
              description={description}
              onChangeDescription={setDescription}
              videoCompressConfig={{
                endTime: 60,
                quality: "high",
              }}
            />
          )
        }
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: STATUS_BAR_HEIGHT,
    backgroundColor: 'white'
  }
});

export default App;
