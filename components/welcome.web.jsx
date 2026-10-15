import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ImageBackground,
    ActivityIndicator,
    StatusBar,
    useWindowDimensions,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import action from "../redux/action";
import welcomeImage from "../assets/wlcm.jpg";

const BASE_URL = "";

export default function Welcome({ navigation }) {
    const [screen, setScreen] = useState(null);
    const dispatch = useDispatch();
    const { width, height } = useWindowDimensions();

    useEffect(() => {
        let cancelled = false;

        const checkToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem("token");

                if (cancelled) return;

                if (!storedToken) {
                    setScreen("Login");
                    return;
                }

                const response = await fetch(
                    `${BASE_URL}/registration/getuserdata`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ token: storedToken }),
                    }
                );

                const data = await response.json();

                if (cancelled) return;

                if (response.status === 404) {
                    setScreen("registration");
                    return;
                }

                if (!response.ok) {
                    await AsyncStorage.removeItem("token");

                    if (!cancelled) {
                        setScreen("Login");
                    }

                    return;
                }

                dispatch(
                    action({
                        type: "storedata",
                        data,
                    })
                );

                setScreen("Home");
            } catch (error) {
                console.error("Error fetching user data:", error);

                if (!cancelled) {
                    setScreen("Login");
                }
            }
        };

        checkToken();

        return () => {
            cancelled = true;
        };
    }, [dispatch]);

    useEffect(() => {
        if (!screen) return;

        const timer = setTimeout(() => {
            navigation.reset({
                index: 0,
                routes: [{ name: screen }],
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, [screen, navigation]);

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <ImageBackground
                source={welcomeImage}
                style={[
                    styles.background,
                    {
                        width,
                        height,
                    },
                ]}
                resizeMode="contain"
            >
                <View style={styles.overlay}>
                    <Text style={styles.brand}>
                        DiwaliHaat
                    </Text>

                    <Text style={styles.tagline}>
                        Celebrate. Connect. Belong.
                    </Text>

                    <View style={styles.loading}>
                        <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                        />

                        <Text style={styles.loadingText}>
                            {screen
                                ? "Getting things ready..."
                                : "Welcome"}
                        </Text>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF8F0",
    },

    background: {
        justifyContent: "flex-end",
        alignItems: "center",
    },

    overlay: {
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 55,
        paddingTop: 30,
        backgroundColor: "rgba(0,0,0,0.25)",
    },

    brand: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: 1,
    },

    tagline: {
        color: "#FFF0E0",
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
        fontWeight: "600",
    },

    loading: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 24,
        gap: 10,
    },

    loadingText: {
        color: "#FFFFFF",
        fontSize: 13,
    },
});
