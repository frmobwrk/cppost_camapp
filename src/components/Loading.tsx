import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants/dimensions';
import { colors } from '../styles/styles';

type Props = {
    color?: string
}

const Loading: React.FC<Props> = ({ color }) => (
    <View style={styles.container}>
        <ActivityIndicator animating={true} color={color ?? colors.red} size="large" />
    </View>
);

const styles = StyleSheet.create({
    container: {
        zIndex: 999,
        position: "absolute",
        left: 0,
        top: 0,
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "rgba(0,0,0,0.3)",
    },
});

export default Loading;