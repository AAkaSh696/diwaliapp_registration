
import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert as RNAlert
} from "react-native";

const Alert = {
    alert: (title, msg) =>
        Platform.OS === "web"
            ? window.alert(`${title}\n\n${msg || ""}`)
            : RNAlert.alert(title, msg)
};

// Backend for web, Android and iOS
const BASE_URL = "http://10.162.135.224:5001";

// OTP cooldown in seconds
const OTP_COOLDOWN = 13;

export default function Login({ navigation }) {
    const [loginType, setLoginType] = useState("user");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");

    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Synchronous refs prevent rapid duplicate requests
    const inFlightRef = useRef(false);
    const cooldownEndRef = useRef(0);
    const timerRef = useRef(null);

    const isAdmin = loginType === "admin";

    // ==========================================================
    // CHECK ADMIN TOKEN
    // ==========================================================

    useEffect(() => {
        const checkAdminToken = async () => {
            try {
                const adminToken =
                    await AsyncStorage.getItem("adminToken");

                console.log(
                    "ADMIN TOKEN:",
                    adminToken ? "FOUND" : "NOT FOUND"
                );

                if (adminToken) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "adminhome" }]
                    });
                }
            } catch (error) {
                console.error(
                    "ADMIN TOKEN CHECK ERROR:",
                    error
                );
            }
        };

        checkAdminToken();
    }, [navigation]);

    // ==========================================================
    // CLEAN UP TIMER
    // ==========================================================

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    // ==========================================================
    // START 13-SECOND COOLDOWN
    // ==========================================================

    const startCooldown = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        cooldownEndRef.current =
            Date.now() + OTP_COOLDOWN * 1000;

        // Immediately update the button state
        setCooldown(OTP_COOLDOWN);

        timerRef.current = setInterval(() => {
            const remaining = Math.max(
                0,
                Math.ceil(
                    (cooldownEndRef.current - Date.now()) / 1000
                )
            );

            setCooldown(remaining);

            if (remaining <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            }
        }, 250);
    };

    // ==========================================================
    // CHANGE LOGIN TYPE
    // ==========================================================

    const changeLoginType = (type) => {
        if (loading || otpLoading) return;

        setLoginType(type);
        setEmail("");
        setOtp("");
        setPassword("");
        setOtpSent(false);
    };

    // ==========================================================
    // SEND OTP
    // ==========================================================

    const sendOTP = async () => {
        // Block repeated requests even before React re-renders
        if (
            inFlightRef.current ||
            Date.now() < cooldownEndRef.current
        ) {
            return;
        }

        if (!email.trim()) {
            Alert.alert(
                "Email required",
                `Please enter your ${isAdmin ? "admin" : "user"} email.`
            );
            return;
        }

        // Lock before starting the network request
        inFlightRef.current = true;
        startCooldown();
        setOtpLoading(true);

        try {
            const response = await fetch(
                `${BASE_URL}/users/mailauth`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: email.trim()
                    })
                }
            );

            const data = await response.json();

            console.log(
                "OTP RESPONSE:",
                response.status,
                data
            );

            if (!response.ok) {
                Alert.alert(
                    "Error",
                    data.msg || "Unable to send OTP."
                );
                return;
            }

            setOtpSent(true);
            setOtp("");

            Alert.alert(
                "OTP Sent",
                `Please check your email for the ${
                    isAdmin ? "admin " : ""
                }OTP.`
            );
        } catch (error) {
            console.error("OTP ERROR:", error);

            Alert.alert(
                "Connection Error",
                "Unable to connect to the server."
            );
        } finally {
            inFlightRef.current = false;
            setOtpLoading(false);
        }
    };

    // ==========================================================
    // LOGIN
    // ==========================================================

    const handleLogin = async () => {
        if (loading) return;

        if (!otpSent) {
            Alert.alert(
                "OTP required",
                "Please enter your email and request an OTP first."
            );
            return;
        }

        if (!otp.trim()) {
            Alert.alert(
                "OTP required",
                "Please enter the OTP."
            );
            return;
        }

        if (!password) {
            Alert.alert(
                "Password required",
                "Please enter your password."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${BASE_URL}/users/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: email.trim(),
                        password: password,
                        otp: otp.trim(),
                        type: isAdmin ? "admin" : "user"
                    })
                }
            );

            const data = await response.json();

            console.log(
                "LOGIN RESPONSE:",
                response.status,
                data
            );

            if (!response.ok) {
                Alert.alert(
                    isAdmin
                        ? "Admin Login Failed"
                        : "Login failed",
                    data.msg || "Invalid login details."
                );
                return;
            }

            if (!data.token) {
                Alert.alert(
                    "Login failed",
                    isAdmin
                        ? "Admin token was not received."
                        : "Token was not received from server."
                );
                return;
            }

            // ==================================================
            // ADMIN LOGIN
            // ==================================================

            if (isAdmin) {
                await AsyncStorage.setItem(
                    "adminToken",
                    data.token
                );

                if (data.admin) {
                    await AsyncStorage.setItem(
                        "adminData",
                        JSON.stringify(data.admin)
                    );
                }

                navigation.reset({
                    index: 0,
                    routes: [{ name: "adminhome" }]
                });

                return;
            }

            // ==================================================
            // STUDENT LOGIN
            // ==================================================

            const token = data.token;

            await AsyncStorage.setItem("token", token);

            // Check student registration
            const registrationResponse = await fetch(
                `${BASE_URL}/registration/getuserdata`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        token: token
                    })
                }
            );

            const registrationData =
                await registrationResponse.json();

            if (registrationResponse.ok) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: "Home" }]
                });

                return;
            }

            if (registrationResponse.status === 404) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: "registration" }]
                });

                return;
            }

            Alert.alert(
                "Error",
                registrationData.msg ||
                    "Unable to check registration."
            );
        } catch (error) {
            console.error("LOGIN ERROR:", error);

            Alert.alert(
                "Connection Error",
                "Unable to connect to the server."
            );
        } finally {
            setLoading(false);
        }
    };

    // Button disabled state
    const otpButtonDisabled =
        otpLoading || loading || cooldown > 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* HEADER */}

                    <View style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logo}>
                                {isAdmin ? "🔐" : "🪔"}
                            </Text>
                        </View>

                        <Text style={styles.brand}>
                            DiwaliHaat
                        </Text>

                        <Text style={styles.tagline}>
                            Celebrate. Connect. Belong.
                        </Text>
                    </View>

                    {/* LOGIN CARD */}

                    <View style={styles.card}>
                        <Text style={styles.title}>
                            Welcome back
                        </Text>

                        <Text style={styles.subtitle}>
                            {isAdmin
                                ? "Login to the DiwaliHaat Admin Portal"
                                : "Login to your DiwaliHaat account"}
                        </Text>

                        {/* LOGIN TYPE */}

                        <View style={styles.loginTypeContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    loginType === "student" &&
                                        styles.activeTypeButton
                                ]}
                                onPress={() =>
                                    changeLoginType("student")
                                }
                                disabled={loading || otpLoading}
                            >
                                <Text
                                    style={[
                                        styles.typeButtonText,
                                        loginType === "student" &&
                                            styles.activeTypeButtonText
                                    ]}
                                >
                                    👨‍🎓 Student
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    loginType === "admin" &&
                                        styles.activeTypeButton
                                ]}
                                onPress={() =>
                                    changeLoginType("admin")
                                }
                                disabled={loading || otpLoading}
                            >
                                <Text
                                    style={[
                                        styles.typeButtonText,
                                        loginType === "admin" &&
                                            styles.activeTypeButtonText
                                    ]}
                                >
                                    🔐 Admin
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* EMAIL */}

                        <Text style={styles.label}>
                            {isAdmin
                                ? "Admin Email"
                                : "Email Address"}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder={
                                isAdmin
                                    ? "Enter admin email"
                                    : "Enter your email"
                            }
                            placeholderTextColor="#A7A7A7"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setOtpSent(false);
                                setOtp("");
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading && !otpLoading}
                        />

                        {/* OTP BUTTON */}

                        <TouchableOpacity
                            style={[
                                styles.otpButton,
                                otpButtonDisabled &&
                                    styles.disabledButton
                            ]}
                            onPress={sendOTP}
                            disabled={otpButtonDisabled}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.otpButtonText}>
                                {otpLoading
                                    ? "Sending OTP..."
                                    : cooldown > 0
                                    ? `Wait ${cooldown}s`
                                    : otpSent
                                    ? "Resend OTP"
                                    : "Send OTP"}
                            </Text>
                        </TouchableOpacity>

                        {/* OTP INFO */}

                        {otpSent && (
                            <View style={styles.otpInfo}>
                                <Text style={styles.otpInfoText}>
                                    ✓ OTP sent to your email
                                </Text>
                            </View>
                        )}

                        {/* OTP */}

                        <Text style={styles.label}>
                            OTP
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter 6-digit OTP"
                            placeholderTextColor="#A7A7A7"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!loading}
                        />

                        {/* PASSWORD */}

                        <Text style={styles.label}>
                            Password
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder={
                                isAdmin
                                    ? "Enter admin password"
                                    : "Enter your password"
                            }
                            placeholderTextColor="#A7A7A7"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />

                        {/* LOGIN BUTTON */}

                        <TouchableOpacity
                            style={[
                                styles.loginButton,
                                loading && styles.disabledButton
                            ]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>
                                {loading
                                    ? "Logging in..."
                                    : isAdmin
                                    ? "Admin Login"
                                    : "Login"}
                            </Text>
                        </TouchableOpacity>

                        {/* STUDENT SIGNUP */}

                        {!isAdmin && (
                            <View style={styles.signupRow}>
                                <Text style={styles.signupText}>
                                    Don't have an account?
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        navigation.navigate("Signup")
                                    }
                                >
                                    <Text style={styles.signupLink}>
                                        {" "}Signup
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* FOOTER */}

                    <Text style={styles.footer}>
                        {isAdmin
                            ? "🔒 Authorized administrators only"
                            : "Your celebration starts here ✨"}
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFF8F0"
    },

    keyboardView: {
        flex: 1
    },

    container: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 30
    },

    header: {
        alignItems: "center",
        marginBottom: 25
    },

    logoCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#FFF0D9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12
    },

    logo: {
        fontSize: 38
    },

    brand: {
        fontSize: 32,
        fontWeight: "800",
        color: "#B64216"
    },

    tagline: {
        marginTop: 5,
        fontSize: 14,
        color: "#777"
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8
        },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6
    },

    title: {
        fontSize: 25,
        fontWeight: "700",
        color: "#292929",
        marginBottom: 7
    },

    subtitle: {
        fontSize: 14,
        color: "#777",
        marginBottom: 20
    },

    loginTypeContainer: {
        flexDirection: "row",
        backgroundColor: "#FFF4EA",
        borderRadius: 13,
        padding: 4,
        marginBottom: 8
    },

    typeButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center"
    },

    activeTypeButton: {
        backgroundColor: "#B64216"
    },

    typeButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#777"
    },

    activeTypeButtonText: {
        color: "#FFFFFF"
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#444",
        marginBottom: 8,
        marginTop: 12
    },

    input: {
        height: 52,
        borderWidth: 1,
        borderColor: "#E6DCD2",
        borderRadius: 13,
        paddingHorizontal: 16,
        fontSize: 15,
        color: "#222",
        backgroundColor: "#FFFCF9"
    },

    otpButton: {
        height: 52,
        borderRadius: 13,
        backgroundColor: "#B64216",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 15
    },

    otpButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700"
    },

    otpInfo: {
        marginTop: 12,
        padding: 11,
        borderRadius: 10,
        backgroundColor: "#EAF8EF"
    },

    otpInfoText: {
        color: "#218739",
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center"
    },

    loginButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: "#D3541C",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25
    },

    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700"
    },

    disabledButton: {
        opacity: 0.45
    },

    signupRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },

    signupText: {
        color: "#777",
        fontSize: 14
    },

    signupLink: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "700"
    },

    footer: {
        textAlign: "center",
        color: "#999",
        fontSize: 13,
        marginTop: 22
    }
});