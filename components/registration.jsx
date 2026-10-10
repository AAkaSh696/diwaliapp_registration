import React, { useState } from "react";

import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Platform,
    Alert as RNAlert,
    Image
} from "react-native";

import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// One backend (AWS) for web, Android and iOS
const BASE_URL = "http://10.162.135.224:5001";

/* =====================================================
   WEB-SAFE ALERT
   Alert.alert does nothing on web, and its buttons
   (like "Go to Home") never run. This fixes both.
===================================================== */

const Alert = {
    alert: (title, msg, buttons) => {
        if (Platform.OS === "web") {
            window.alert(`${title}\n\n${msg || ""}`);
            const last = buttons && buttons[buttons.length - 1];
            if (last && last.onPress) {
                last.onPress();
            }
        } else {
            RNAlert.alert(title, msg, buttons);
        }
    }
};

/* =====================================================
   APPEND IMAGE TO FORMDATA
   Native: { uri, name, type }
   Web: a real File/Blob (the object form is sent as
   "[object Object]" by browsers, so no file arrives)
===================================================== */

const appendImage = async (formData, fieldName, image, fallbackName) => {
    const name = image.fileName || image.name || fallbackName;
    const type = image.type || image.mimeType || "image/jpeg";

    if (Platform.OS === "web") {
        let file = image.file;

        if (!file) {
            const blob = await (await fetch(image.uri)).blob();
            file = blob;
        }

        formData.append(fieldName, file, name);
    } else {
        formData.append(fieldName, {
            uri: image.uri,
            type,
            name
        });
    }
};

export default function Registration({ navigation }) {
    const [Name, setName] = useState("");
    const [batch, setBatch] = useState("");
    const [Aadhar, setAadhar] = useState("");
    const [RollNO, setRollNO] = useState("");
    const [branch, setBranch] = useState("");
    const [MobileNo, setMobileNo] = useState("");

    const [studentPhoto, setStudentPhoto] = useState(null);
    const [aadharPhoto, setAadharPhoto] = useState(null);

    const [loading, setLoading] = useState(false);

    /* =====================================================
       PICK A PHOTO
    ===================================================== */

    const pickPhoto = (setPhoto) => {
        launchImageLibrary(
            {
                mediaType: "photo",
                quality: 0.8
            },
            response => {
                if (response.didCancel) {
                    return;
                }

                if (response.errorCode) {
                    Alert.alert(
                        "Error",
                        response.errorMessage ||
                        "Unable to select image."
                    );
                    return;
                }

                if (response.assets?.length > 0) {
                    setPhoto(response.assets[0]);
                }
            }
        );
    };

    const selectStudentPhoto = () => pickPhoto(setStudentPhoto);
    const selectAadharPhoto = () => pickPhoto(setAadharPhoto);

    /* =====================================================
       REGISTER STUDENT
    ===================================================== */

    const handleRegister = async () => {

        /* ================= VALIDATION ================= */

        if (
            !Name.trim() ||
            !batch ||
            !Aadhar.trim() ||
            !RollNO.trim() ||
            !branch ||
            !MobileNo.trim()
        ) {
            Alert.alert(
                "Required",
                "Please fill all required fields."
            );
            return;
        }

        if (MobileNo.length !== 10) {
            Alert.alert(
                "Invalid Mobile Number",
                "Please enter a valid 10 digit mobile number."
            );
            return;
        }

        if (Aadhar.length !== 12) {
            Alert.alert(
                "Invalid Aadhaar",
                "Please enter a valid 12 digit Aadhaar number."
            );
            return;
        }

        if (!studentPhoto) {
            Alert.alert(
                "Student Photo Required",
                "Please upload your photograph."
            );
            return;
        }

        if (!aadharPhoto) {
            Alert.alert(
                "Aadhaar Photo Required",
                "Please upload your Aadhaar card image."
            );
            return;
        }

        setLoading(true);

        try {

            /* ================= GET TOKEN ================= */

            const token = await AsyncStorage.getItem("token");

            /* ================= FORM DATA ================= */

            const formData = new FormData();

            formData.append("Name", Name.trim());
            formData.append("batch", batch);
            formData.append("Aadhar", Aadhar.trim());
            formData.append("RollNO", RollNO.trim());
            formData.append("branch", branch);
            formData.append("MobileNo", MobileNo.trim());

            // Only append token if it exists
            if (token) {
                formData.append("token", token);
            }

            // Student photo and Aadhaar photo (web-safe)
            await appendImage(
                formData,
                "pic",
                studentPhoto,
                "student_photo.jpg"
            );

            await appendImage(
                formData,
                "picAadhar",
                aadharPhoto,
                "aadhar_photo.jpg"
            );

            if (Platform.OS === "web") {
                for (const [key, value] of formData.entries()) {
                    console.log(
                        "FORMDATA:",
                        key,
                        value instanceof File
                            ? `File(${value.name}, ${value.size} bytes)`
                            : value
                    );
                }
            }

            /* ================= API REQUEST ================= */

            // Do NOT set Content-Type manually. The browser / React Native
            // adds multipart/form-data with the correct boundary.

            const response = await fetch(
                `${BASE_URL}/registration/`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            console.log(
                "Registration response:",
                response.status,
                data
            );

            if (!response.ok) {
                Alert.alert(
                    "Registration Failed",
                    data?.msg ||
                    "Unable to register student."
                );
                return;
            }

            Alert.alert(
                "Registration Successful",
                "Your registration has been submitted successfully.",
                [
                    {
                        text: "Go to Home",
                        onPress: () => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "Home" }]
                            });
                        }
                    }
                ]
            );

        } catch (error) {

            console.error("Registration error:", error);

            Alert.alert(
                "Connection Error",
                "Unable to connect to the server. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       UI
    ===================================================== */

    return (
        <SafeAreaView style={styles.safeArea}>

            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFF8F0"
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >

                {/* HEADER */}

                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logo}>🪔</Text>
                    </View>

                    <View>
                        <Text style={styles.brand}>DiwaliGhaat</Text>
                        <Text style={styles.subtitle}>Student Registration</Text>
                    </View>
                </View>

                {/* HERO */}

                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>🎓</Text>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>
                            Complete Your Profile
                        </Text>

                        <Text style={styles.heroText}>
                            Submit your details and documents for
                            administrator verification.
                        </Text>
                    </View>
                </View>

                {/* PERSONAL INFORMATION */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Personal Information
                    </Text>

                    <Text style={styles.label}>Full Name *</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#999"
                        value={Name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <Text style={styles.label}>Mobile Number *</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter 10 digit mobile number"
                        placeholderTextColor="#999"
                        value={MobileNo}
                        onChangeText={text => {
                            setMobileNo(text.replace(/[^0-9]/g, ""));
                        }}
                        keyboardType="number-pad"
                        maxLength={10}
                    />

                    <Text style={styles.label}>Aadhaar Number *</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter 12 digit Aadhaar number"
                        placeholderTextColor="#999"
                        value={Aadhar}
                        onChangeText={text => {
                            setAadhar(text.replace(/[^0-9]/g, ""));
                        }}
                        keyboardType="number-pad"
                        maxLength={12}
                        secureTextEntry
                    />
                </View>

                {/* ACADEMIC INFORMATION */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Academic Information
                    </Text>

                    <Text style={styles.label}>Roll Number *</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter Roll Number"
                        placeholderTextColor="#999"
                        value={RollNO}
                        onChangeText={setRollNO}
                        autoCapitalize="characters"
                    />

                    <Text style={styles.label}>Batch *</Text>

                    <View style={styles.options}>
                        {["2027", "2028", "2029", "2030", "outsider"].map(item => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.option,
                                    batch === item && styles.optionActive
                                ]}
                                onPress={() => setBatch(item)}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        batch === item && styles.optionTextActive
                                    ]}
                                >
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Branch *</Text>

                    <View style={styles.options}>
                        {[
                            "cse",
                            "ece",
                            "biotech",
                            "mechanical",
                            "civil",
                            "eco",
                            "AI/ML"
                        ].map(item => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.option,
                                    branch === item && styles.optionActive
                                ]}
                                onPress={() => setBranch(item)}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        branch === item && styles.optionTextActive
                                    ]}
                                >
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* DOCUMENT UPLOAD */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Upload Documents
                    </Text>

                    <Text style={styles.documentHint}>
                        Upload clear and readable photographs.
                    </Text>

                    <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={selectStudentPhoto}
                        activeOpacity={0.8}
                    >
                        {studentPhoto ? (
                            <Image
                                source={{ uri: studentPhoto.uri }}
                                style={styles.preview}
                            />
                        ) : (
                            <>
                                <Text style={styles.uploadIcon}>📷</Text>
                                <Text style={styles.uploadTitle}>
                                    Upload Student Photo
                                </Text>
                                <Text style={styles.uploadText}>
                                    Tap to select your photograph
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.uploadBox, { marginTop: 14 }]}
                        onPress={selectAadharPhoto}
                        activeOpacity={0.8}
                    >
                        {aadharPhoto ? (
                            <Image
                                source={{ uri: aadharPhoto.uri }}
                                style={styles.preview}
                            />
                        ) : (
                            <>
                                <Text style={styles.uploadIcon}>🪪</Text>
                                <Text style={styles.uploadTitle}>
                                    Upload Aadhaar Card
                                </Text>
                                <Text style={styles.uploadText}>
                                    Tap to select Aadhaar image
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* INFORMATION BOX */}

                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>🔐</Text>

                    <Text style={styles.infoText}>
                        Your registration will remain unverified
                        until an administrator reviews and approves
                        your submitted information.
                    </Text>
                </View>

                {/* SUBMIT BUTTON */}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Submitting..." : "Submit Registration"}
                    </Text>

                    {!loading && <Text style={styles.arrow}>→</Text>}
                </TouchableOpacity>

                {/* FOOTER */}

                <Text style={styles.footer}>
                    🪔 Celebrate. Connect. Belong.
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#FFF8F0" },
    container: { padding: 20, paddingBottom: 40 },

    header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    logoCircle: {
        width: 55, height: 55, borderRadius: 28, backgroundColor: "#FFF0E0",
        justifyContent: "center", alignItems: "center", marginRight: 12
    },
    logo: { fontSize: 27 },
    brand: { fontSize: 26, fontWeight: "800", color: "#B64216" },
    subtitle: { fontSize: 12, color: "#888", marginTop: 2 },

    hero: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#B64216",
        borderRadius: 22, padding: 18, marginBottom: 18
    },
    heroEmoji: { fontSize: 35, marginRight: 14 },
    heroTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
    heroText: { color: "#FFE8D8", fontSize: 11, lineHeight: 17, marginTop: 4 },

    card: {
        backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18,
        marginBottom: 16, elevation: 3
    },
    sectionTitle: { fontSize: 17, fontWeight: "800", color: "#292929", marginBottom: 3 },
    documentHint: { color: "#999", fontSize: 11, marginBottom: 5 },

    label: { fontSize: 13, fontWeight: "700", color: "#444", marginTop: 15, marginBottom: 7 },
    input: {
        height: 50, borderWidth: 1, borderColor: "#E6DCD2", borderRadius: 13,
        paddingHorizontal: 14, fontSize: 14, color: "#222", backgroundColor: "#FFFCF9"
    },

    options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    option: {
        minWidth: 72, height: 42, paddingHorizontal: 14, borderRadius: 11,
        borderWidth: 1, borderColor: "#E5DAD0", justifyContent: "center",
        alignItems: "center", backgroundColor: "#FFFCF9"
    },
    optionActive: { backgroundColor: "#FFF0E4", borderColor: "#B64216" },
    optionText: { color: "#777", fontSize: 12, fontWeight: "600" },
    optionTextActive: { color: "#B64216", fontWeight: "800" },

    uploadBox: {
        height: 170, borderRadius: 17, borderWidth: 1.5, borderColor: "#E5D4C7",
        borderStyle: "dashed", backgroundColor: "#FFFBF7", justifyContent: "center",
        alignItems: "center", overflow: "hidden"
    },
    uploadIcon: { fontSize: 32, marginBottom: 8 },
    uploadTitle: { fontSize: 14, fontWeight: "800", color: "#444" },
    uploadText: { fontSize: 11, color: "#999", marginTop: 4 },
    preview: { width: "100%", height: "100%", resizeMode: "cover" },

    infoBox: {
        flexDirection: "row", backgroundColor: "#FFF6DF", borderRadius: 16,
        padding: 15, marginBottom: 17
    },
    infoIcon: { fontSize: 21, marginRight: 10 },
    infoText: { flex: 1, fontSize: 11, lineHeight: 17, color: "#78663D" },

    button: {
        height: 56, borderRadius: 15, backgroundColor: "#B64216",
        justifyContent: "center", alignItems: "center", flexDirection: "row", elevation: 5
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
    arrow: { color: "#FFFFFF", fontSize: 22, marginLeft: 10 },

    footer: { textAlign: "center", color: "#999", fontSize: 12, marginTop: 22 }
});
