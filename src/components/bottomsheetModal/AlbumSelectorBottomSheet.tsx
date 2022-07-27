import React, { FunctionComponent, Ref, RefObject } from "react";
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { ListRenderItem, StyleSheet, Text, TouchableOpacity } from "react-native";
import CameraRoll from "@react-native-community/cameraroll";

interface Props {
    bottomSheetRef: RefObject<BottomSheetModalMethods>;
    data: CameraRoll.Album[];
    onSelectItem: (item: CameraRoll.Album) => void;
}

const AlbumSelectorBottomSheet: FunctionComponent<Props> = ({ bottomSheetRef, data, onSelectItem }) => {

    const renderItem: ListRenderItem<CameraRoll.Album> = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => onSelectItem(item)}>
            <Text style={styles.itemTxt}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <BottomSheetModal ref={bottomSheetRef} snapPoints={["95%"]} backdropComponent={BottomSheetBackdrop}>
            <BottomSheetFlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={item => item.title}
            />
        </BottomSheetModal>
    )
}

const styles = StyleSheet.create({
    item: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    itemTxt: {
        fontSize: 16,
        fontWeight: '600'
    }
})

export default React.memo(AlbumSelectorBottomSheet);