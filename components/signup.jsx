
import React, { useState, useEffect, useRef } from "react";

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
    Alert
} from "react-native";

const BASE_URL = "";

// Cooldown in seconds
const OTP_COOLDOWN_SECONDS = 13;

export default function Signup({ navigation }) {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Prevent duplicate requests and track cooldown expiry
    const inFlightRef = useRef(false);
    const cooldownEndRef = useRef(0);
    const timerRef = useRef(null);

    // ==========================================================
    // CLEAN UP TIMER WHEN SCREEN UNMOUNTS
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
    // START COOLDOWN
    // ==========================================================

    const startCooldown = () => {
        // Remove any previously running timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Store the actual expiry time
        cooldownEndRef.current =
            Date.now() + OTP_COOLDOWN_SECONDS * 1000;

        // Disable the button immediately
        setCooldown(OTP_COOLDOWN_SECONDS);

        // Update the countdown using the real clock
        timerRef.current = setInterval(() => {
            const remaining = Math.max(
                0,
                Math.ceil(
                    (cooldownEndRef.current - Date.now()) / 1000
                )
            );

            setCooldown(remaining);

            if (remaining === 0) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }, 250);
    };

    // ==========================================================
    // SEND OTP
    // ==========================================================

    const sendOTP = async () => {
        // Synchronous guard: blocks rapid taps and active requests
        if (
            inFlightRef.current ||
            Date.now() < cooldownEndRef.current
        ) {
            return;
        }

        if (!email.trim()) {
            Alert.alert(
                "Email required",
                "Please enter your email."
            );
            return;
        }

        // Lock before making the network request
        inFlightRef.current = true;
        setOtpLoading(true);

        // Start cooldown immediately
        startCooldown();

        try {
            const url = `${BASE_URL}/users/mailauth`;

            console.log("BASE_URL:", BASE_URL);
            console.log("OTP URL:", url);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: email.trim()
                })
            });

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
                "Please check your email for the OTP."
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
    // SIGNUP
    // ==========================================================

    const handleSignup = async () => {
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

        if (!username.trim()) {
            Alert.alert(
                "Username required",
                "Please enter a username."
            );
            return;
        }

        if (!password) {
            Alert.alert(
                "Password required",
                "Please enter a password."
            );
            return;
        }

        if (!confirmPassword) {
            Alert.alert(
                "Password required",
                "Please confirm your password."
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(
                "Password mismatch",
                "Passwords do not match."
            );
            return;
        }

        if (password.length < 6) {
            Alert.alert(
                "Weak password",
                "Password must contain at least 6 characters."
            );
            return;
        }

        setLoading(true);

        try {
            const url = `${BASE_URL}/users/signup`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    otp: otp.trim(),
                    username: email.trim(),
                    password: password,
                    type: "user"
                })
            });

            const data = await response.json();

            console.log(
                "SIGNUP RESPONSE:",
                response.status,
                data
            );

            if (!response.ok) {
                Alert.alert(
                    "Signup failed",
                    data.msg || "Unable to create account."
                );
                return;
            }

            Alert.alert(
                "Account Created",
                "Your account has been created successfully.",
                [
                    {
                        text: "Login",
                        onPress: () =>
                            navigation.navigate("Login")
                    }
                ]
            );

            setEmail("");
            setOtp("");
            setUsername("");
            setPassword("");
            setConfirmPassword("");
            setOtpSent(false);
        } catch (error) {
            console.error("SIGNUP ERROR:", error);

            Alert.alert(
                "Signup failed",
                "Unable to connect to the server."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================================
    // OTP BUTTON STATE
    // ==========================================================

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
                            <Text style={styles.logo}>🪔</Text>
                        </View>

                        <Text style={styles.brand}>
                            DiwaliHaat
                        </Text>

                        <Text style={styles.tagline}>
                            Celebrate. Connect. Belong.
                        </Text>
                    </View>

                    {/* SIGNUP CARD */}

                    <View style={styles.card}>
                        <Text style={styles.title}>
                            Create your account
                        </Text>

                        <Text style={styles.subtitle}>
                            Verify your email to join DiwaliHaat
                        </Text>

                        {/* EMAIL */}

                        <Text style={styles.label}>
                            Email Address
                        </Text>

                        <View style={styles.emailRow}>
                            <TextInput
                                style={styles.emailInput}
                                placeholder="Enter your email"
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
                                        ? "Sending..."
                                        : cooldown > 0
                                        ? `Wait ${cooldown}s`
                                        : otpSent
                                        ? "Resend OTP"
                                        : "Send OTP"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* OTP SUCCESS MESSAGE */}

                        {otpSent && (
                            <>
                                <View style={styles.otpInfo}>
                                    <Text style={styles.otpInfoText}>
                                        ✓ OTP sent to your email
                                    </Text>
                                </View>

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

                                {/* USERNAME */}

                                <Text style={styles.label}>
                                    Username
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter username"
                                    placeholderTextColor="#A7A7A7"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                />

                                {/* PASSWORD */}

                                <Text style={styles.label}>
                                    Password
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a password"
                                    placeholderTextColor="#A7A7A7"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    editable={!loading}
                                />

                                {/* CONFIRM PASSWORD */}

                                <Text style={styles.label}>
                                    Confirm Password
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#A7A7A7"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    editable={!loading}
                                />

                                {/* SIGNUP BUTTON */}

                                <TouchableOpacity
                                    style={[
                                        styles.signupButton,
                                        loading &&
                                            styles.disabledButton
                                    ]}
                                    onPress={handleSignup}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.signupButtonText}>
                                        {loading
                                            ? "Verifying & Creating..."
                                            : "Verify OTP & Create Account"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* INSTRUCTIONS */}

                        {!otpSent && (
                            <View style={styles.instructionBox}>
                                <Text style={styles.instructionText}>
                                    Enter your email and tap{" "}
                                    <Text style={styles.instructionBold}>
                                        Send OTP
                                    </Text>{" "}
                                    to continue.
                                </Text>
                            </View>
                        )}

                        {/* LOGIN LINK */}

                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>
                                Already have an account?
                            </Text>

                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate("Login")
                                }
                            >
                                <Text style={styles.loginLink}>
                                    {" "}Login
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* FOOTER */}

                    <Text style={styles.footer}>
                        Your celebration starts here ✨
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

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#444",
        marginBottom: 8,
        marginTop: 12
    },

    emailRow: {
        flexDirection: "row",
        alignItems: "center"
    },

    emailInput: {
        flex: 1,
        minWidth: 0,
        height: 52,
        borderWidth: 1,
        borderColor: "#E6DCD2",
        borderRadius: 13,
        paddingHorizontal: 14,
        fontSize: 15,
        color: "#222",
        backgroundColor: "#FFFCF9"
    },

    otpButton: {
        minHeight: 52,
        paddingHorizontal: 12,
        marginLeft: 8,
        borderRadius: 13,
        backgroundColor: "#B64216",
        justifyContent: "center",
        alignItems: "center"
    },

    otpButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 12
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

    instructionBox: {
        marginTop: 20,
        padding: 14,
        borderRadius: 12,
        backgroundColor: "#FFF5E8"
    },

    instructionText: {
        textAlign: "center",
        color: "#777",
        fontSize: 13,
        lineHeight: 20
    },

    instructionBold: {
        color: "#B64216",
        fontWeight: "700"
    },

    signupButton: {
        minHeight: 54,
        borderRadius: 14,
        backgroundColor: "#D3541C",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
        marginTop: 25
    },

    disabledButton: {
        opacity: 0.45
    },

    signupButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
        textAlign: "center"
    },

    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },

    loginText: {
        color: "#777",
        fontSize: 14
    },

    loginLink: {
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