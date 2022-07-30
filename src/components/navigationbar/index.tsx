import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { colors } from "../../styles/styles";

export interface NavigationBarProps {
    title?: string;
    leftCallback?: () => void;
    rightTitle?: string;
    rightCallback?: () => void;
}
const NavigationBar = ({
    leftCallback,
    title = "",
    rightTitle,
    rightCallback,
}: NavigationBarProps) => {

    const onLeftCallBack = () => {
        if (leftCallback) leftCallback();
    };

    const onRightCallBack = () => {
        if (rightCallback) rightCallback();
    };

    return (
        <View style={styles.container}>
            {
                leftCallback && (
                    <TouchableOpacity style={styles.backButton} onPress={onLeftCallBack}>
                        <Icon name="arrow-left" size={24} />
                    </TouchableOpacity>
                )
            }
            <View style={styles.titleContainer}>
                <Text style={styles.titleTxt}>{title}</Text>
            </View>
            {
                rightTitle && (
                    <TouchableOpacity style={styles.optionContainer} onPress={onRightCallBack}>
                        <Text style={styles.optionTxt}>{rightTitle}</Text>
                    </TouchableOpacity>
                )
            }
        </View>
    );
};

export default NavigationBar;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 44,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomColor: colors.lightGrey,
        borderBottomWidth: 0.25,
        paddingHorizontal: 7,
    },
    backButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center'
    },
    titleTxt: {
        fontSize: 16,
        fontWeight: '600',
    },
    optionTxt: {
        fontSize: 16,
        fontWeight: '600',
        color:"#000"
    },
    optionContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
    }
})