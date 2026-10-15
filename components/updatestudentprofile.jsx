
import React, { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    SafeAreaView,
    StatusBar,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";

// Change this to your backend's reachable IP address.
const BASE_URL = "";

/*
|--------------------------------------------------------------------------
| Cross-platform helpers
|--------------------------------------------------------------------------
*/

const notify = (title, message) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(`${title}\n\n${message}`);
        return;
    }

    Alert.alert(title, message);
};

const getResponseData = async (response) => {
    const text = await response.text();

    let result = {};

    try {
        result = text ? JSON.parse(text) : {};
    } catch {
        result = { message: text };
    }

    if (!response.ok) {
        throw new Error(
            result?.msg ||
            result?.message ||
            result?.error ||
            `Request failed with status ${response.status}`
        );
    }

    if (result?.success === false) {
        throw new Error(
            result?.msg ||
            result?.message ||
            "The operation was unsuccessful."
        );
    }

    return result;
};

/*
|--------------------------------------------------------------------------
| Cross-platform image upload
|--------------------------------------------------------------------------
|
| Web: sends a real File/Blob.
| Android: sends { uri, type, name }.
|
| Never manually set multipart Content-Type.
*/

const uploadImageCrossPlatform = async ({
    token,
    asset,
    fieldName,
    endpoint,
}) => {
    if (!asset) {
        return null;
    }

    const formData = new FormData();

    formData.append("token", token);

    if (Platform.OS === "web") {
        let file = asset.file;

        if (
            !file &&
            typeof File !== "undefined" &&
            asset instanceof File
        ) {
            file = asset;
        }

        if (!file && asset.uri) {
            const imageResponse = await fetch(asset.uri);

            if (!imageResponse.ok) {
                throw new Error(
                    "Could not read the selected image."
                );
            }

            const blob = await imageResponse.blob();

            if (!blob.size) {
                throw new Error(
                    "The selected image is empty."
                );
            }

            if (typeof File !== "undefined") {
                file = new File(
                    [blob],
                    asset.fileName || "upload.jpg",
                    {
                        type:
                            asset.type ||
                            blob.type ||
                            "image/jpeg",
                    }
                );
            } else {
                formData.append(
                    fieldName,
                    blob,
                    asset.fileName || "upload.jpg"
                );
            }
        }

        if (file) {
            formData.append(
                fieldName,
                file,
                file.name || asset.fileName || "upload.jpg"
            );
        } else if (!asset.uri) {
            throw new Error(
                "Please select the image again."
            );
        } else if (typeof File !== "undefined") {
            throw new Error(
                "The selected image could not be prepared for upload."
            );
        }
    } else {
        if (!asset.uri) {
            throw new Error(
                "The selected image has no valid URI."
            );
        }

        formData.append(fieldName, {
            uri: asset.uri,
            type: asset.type || "image/jpeg",
            name: asset.fileName || "upload.jpg",
        });
    }

    const response = await fetch(
        `${BASE_URL}${endpoint}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: formData,
        }
    );

    return getResponseData(response);
};

/*
|--------------------------------------------------------------------------
| UpdateStudent component
|--------------------------------------------------------------------------
*/

export default function UpdateStudent({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [profileImage, setProfileImage] = useState(null);
    const [aadharImage, setAadharImage] = useState(null);

    const [currentProfileImage, setCurrentProfileImage] =
        useState("");

    const [currentAadharImage, setCurrentAadharImage] =
        useState("");

    const [form, setForm] = useState({
        Name: "",
        batch: "",
        Aadhar: "",
        RollNO: "",
        branch: "",
        MobileNo: "",
    });

    const [originalData, setOriginalData] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | Fetch current student data
    |--------------------------------------------------------------------------
    */

    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            const response = await fetch(
                `${BASE_URL}/registration/getuserdata`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                }
            );

            const result = await getResponseData(response);

            const user = result?.data;

            if (!user) {
                throw new Error(
                    "Student details could not be found."
                );
            }

            const studentData = {
                Name: user.Name || "",
                batch: user.batch || "",
                Aadhar: user.Aadhar || "",
                RollNO: user.RollNO || "",
                branch: user.branch || "",
                MobileNo: user.MobileNo || "",
            };

            setForm(studentData);
            setOriginalData(studentData);

            setCurrentProfileImage(user.url || "");
            setCurrentAadharImage(user.urlAadhar || "");

            setProfileImage(null);
            setAadharImage(null);
        } catch (error) {
            console.error("FETCH STUDENT ERROR:", error);

            notify(
                "Unable to Load Profile",
                error.message || "Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    /*
    |--------------------------------------------------------------------------
    | Form fields
    |--------------------------------------------------------------------------
    */

    const updateField = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const selectImage = async (type) => {
        try {
            const result = await launchImageLibrary({
                mediaType: "photo",
                selectionLimit: 1,
                quality: 0.8,
            });

            if (result.didCancel) {
                return;
            }

            if (result.errorCode) {
                throw new Error(
                    result.errorMessage ||
                    result.errorCode ||
                    "Could not open the image library."
                );
            }

            const asset = result.assets?.[0];

            if (!asset?.uri) {
                throw new Error(
                    "No usable image was selected."
                );
            }

            if (type === "profile") {
                setProfileImage(asset);
            } else {
                setAadharImage(asset);
            }
        } catch (error) {
            console.error("IMAGE PICKER ERROR:", error);

            notify(
                "Image Selection Failed",
                error.message || "Please select the image again."
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Change detection
    |--------------------------------------------------------------------------
    */

    const hasTextChanges = () => {
        if (!originalData) {
            return false;
        }

        return Object.keys(form).some((key) => {
            return (
                String(form[key] ?? "").trim() !==
                String(originalData[key] ?? "").trim()
            );
        });
    };

    const hasAnyChanges = () => {
        return (
            hasTextChanges() ||
            !!profileImage ||
            !!aadharImage
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Form validation
    |--------------------------------------------------------------------------
    */

    const validateForm = () => {
        if (!form.Name.trim()) {
            notify("Validation", "Please enter your full name.");
            return false;
        }

        if (!form.batch.trim()) {
            notify("Validation", "Please enter your batch.");
            return false;
        }

        const aadhar = form.Aadhar.trim();

        if (aadhar && !/^\d{12}$/.test(aadhar)) {
            notify(
                "Validation",
                "Aadhaar number must contain exactly 12 digits."
            );
            return false;
        }

        const mobile = form.MobileNo.trim();

        if (mobile && !/^\d{10}$/.test(mobile)) {
            notify(
                "Validation",
                "Mobile number must contain exactly 10 digits."
            );
            return false;
        }

        if (form.batch.toLowerCase() !== "outsider") {
            if (!form.RollNO.trim()) {
                notify(
                    "Validation",
                    "Please enter your roll number."
                );
                return false;
            }

            if (!form.branch.trim()) {
                notify(
                    "Validation",
                    "Please enter your branch."
                );
                return false;
            }
        }

        return true;
    };

    /*
    |--------------------------------------------------------------------------
    | Update text fields
    |--------------------------------------------------------------------------
    */

    const updateTextData = async (token) => {
        if (!hasTextChanges()) {
            return;
        }

        const payload = {
            token,
            Name: form.Name.trim(),
            batch: form.batch.trim(),
            Aadhar: form.Aadhar.trim(),
            MobileNo: form.MobileNo.trim(),
        };

        if (form.batch.toLowerCase() !== "outsider") {
            payload.RollNO = form.RollNO.trim();
            payload.branch = form.branch.trim();
        }

        const response = await fetch(
            `${BASE_URL}/registration/update`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }
        );

        return getResponseData(response);
    };

    /*
    |--------------------------------------------------------------------------
    | Update profile picture
    |--------------------------------------------------------------------------
    */

    const updateProfileImage = async (token) => {
        // Important: do not require a new picture for a text-only update.
        if (!profileImage) {
            return null;
        }

        return uploadImageCrossPlatform({
            token,
            asset: profileImage,
            fieldName: "pic",
            endpoint: "/registration/imageupdate",
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Update Aadhaar picture
    |--------------------------------------------------------------------------
    */

    const updateAadharImage = async (token) => {
        // Important: do not require a new Aadhaar picture for other updates.
        if (!aadharImage) {
            return null;
        }

        return uploadImageCrossPlatform({
            token,
            asset: aadharImage,
            fieldName: "picAadhar",
            endpoint: "/registration/Aadharimageupdate",
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Save all changes
    |--------------------------------------------------------------------------
    */

    const updateData = async () => {
        if (updating) {
            return;
        }

        if (!hasAnyChanges()) {
            notify(
                "No Changes",
                "You have not changed any profile information."
            );
            return;
        }

        if (hasTextChanges() && !validateForm()) {
            return;
        }

        try {
            setUpdating(true);

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            // Only changed fields/images trigger their respective requests.
            await updateTextData(token);
            await updateProfileImage(token);
            await updateAadharImage(token);

            // Fetch fresh data from the backend after saving.
            await fetchUserData();

            notify(
                "Success",
                "Your profile has been updated successfully."
            );

            if (navigation?.goBack) {
                navigation.goBack();
            }
        } catch (error) {
            console.error("UPDATE ERROR:", error);

            notify(
                "Update Failed",
                error.message ||
                    "Unable to update your profile. Please try again."
            );
        } finally {
            setUpdating(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Loading screen
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="#FFF8F0"
                />

                <ActivityIndicator
                    size="large"
                    color="#B64216"
                />

                <Text style={styles.loadingText}>
                    Loading your profile...
                </Text>
            </SafeAreaView>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Main screen
    |--------------------------------------------------------------------------
    */

    const profilePreview =
        profileImage?.uri || currentProfileImage;

    const aadharPreview =
        aadharImage?.uri || currentAadharImage;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFF8F0"
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation?.goBack?.()}
                    >
                        <Text style={styles.backButtonText}>
                            {"‹"}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.heading}>
                            Update Profile
                        </Text>

                        <Text style={styles.subtitle}>
                            Keep your student information up to date.
                        </Text>
                    </View>
                </View>

                {/* Profile picture */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Profile Picture
                    </Text>

                    <View style={styles.imageSection}>
                        {profilePreview ? (
                            <Image
                                source={{ uri: profilePreview }}
                                style={styles.profileImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <Text style={styles.placeholderText}>
                                    No Photo
                                </Text>
                            </View>
                        )}

                        <View style={styles.imageDetails}>
                            <Text style={styles.imageTitle}>
                                Your profile photo
                            </Text>

                            <Text style={styles.imageDescription}>
                                Choose a clear image of yourself.
                            </Text>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => selectImage("profile")}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    {profileImage
                                        ? "Change Photo"
                                        : "Choose Photo"}
                                </Text>
                            </TouchableOpacity>

                            {profileImage ? (
                                <Text style={styles.selectedText}>
                                    New photo selected
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* Personal details */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Personal Information
                    </Text>

                    <FormField
                        label="Full Name"
                        value={form.Name}
                        onChangeText={(value) =>
                            updateField("Name", value)
                        }
                        placeholder="Enter your full name"
                    />

                    <FormField
                        label="Batch"
                        value={form.batch}
                        onChangeText={(value) =>
                            updateField("batch", value)
                        }
                        placeholder="e.g. 2027 or outsider"
                        autoCapitalize="none"
                    />

                    <FormField
                        label="Roll Number"
                        value={form.RollNO}
                        onChangeText={(value) =>
                            updateField("RollNO", value)
                        }
                        placeholder="Enter your roll number"
                    />

                    <FormField
                        label="Branch"
                        value={form.branch}
                        onChangeText={(value) =>
                            updateField("branch", value)
                        }
                        placeholder="e.g. cse"
                    />

                    <FormField
                        label="Mobile Number"
                        value={form.MobileNo}
                        onChangeText={(value) =>
                            updateField(
                                "MobileNo",
                                value.replace(/\D/g, "").slice(0, 10)
                            )
                        }
                        placeholder="Enter 10-digit mobile number"
                        keyboardType="phone-pad"
                        maxLength={10}
                    />

                    <FormField
                        label="Aadhaar Number"
                        value={form.Aadhar}
                        onChangeText={(value) =>
                            updateField(
                                "Aadhar",
                                value.replace(/\D/g, "").slice(0, 12)
                            )
                        }
                        placeholder="Enter 12-digit Aadhaar number"
                        keyboardType="number-pad"
                        maxLength={12}
                    />
                </View>

                {/* Aadhaar document */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Aadhaar Image
                    </Text>

                    <Text style={styles.imageDescription}>
                        Select your Aadhaar image if you need to replace
                        the existing document.
                    </Text>

                    {aadharPreview ? (
                        <Image
                            source={{ uri: aadharPreview }}
                            style={styles.aadharImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.aadharPlaceholder}>
                            <Text style={styles.placeholderText}>
                                No Aadhaar image available
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => selectImage("aadhar")}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {aadharImage
                                ? "Change Aadhaar Image"
                                : "Choose Aadhaar Image"}
                        </Text>
                    </TouchableOpacity>

                    {aadharImage ? (
                        <Text style={styles.selectedText}>
                            New Aadhaar image selected
                        </Text>
                    ) : null}
                </View>

                {/* Save */}
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        updating && styles.disabledButton,
                    ]}
                    onPress={updateData}
                    disabled={updating}
                    activeOpacity={0.85}
                >
                    {updating ? (
                        <View style={styles.savingContent}>
                            <ActivityIndicator
                                color="#FFFFFF"
                                size="small"
                            />

                            <Text style={styles.saveButtonText}>
                                Saving Changes...
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.saveButtonText}>
                            Save Changes
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    Your changes will be saved to your student profile.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

/*
|--------------------------------------------------------------------------
| Reusable input component
|--------------------------------------------------------------------------
*/

function FormField({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    maxLength,
    autoCapitalize = "words",
}) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>

            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9B918B"
                keyboardType={keyboardType}
                maxLength={maxLength}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
            />
        </View>
    );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFF8F0",
    },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF8F0",
    },

    loadingText: {
        marginTop: 14,
        color: "#6E625B",
        fontSize: 15,
    },

    scrollContent: {
        width: "100%",
        maxWidth: 760,
        alignSelf: "center",
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 40,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#F0E4D9",
        marginRight: 14,
    },

    backButtonText: {
        color: "#B64216",
        fontSize: 34,
        lineHeight: 38,
        marginTop: -4,
    },

    headerTextContainer: {
        flex: 1,
    },

    heading: {
        fontSize: 25,
        fontWeight: "800",
        color: "#30241F",
    },

    subtitle: {
        color: "#7D6C62",
        fontSize: 13,
        marginTop: 5,
        lineHeight: 19,
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 20,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#F0E4D9",
        ...(Platform.OS === "web"
            ? { boxShadow: "0px 3px 12px rgba(70, 35, 15, 0.05)" }
            : {
                  elevation: 2,
              }),
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#30241F",
        marginBottom: 18,
    },

    imageSection: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },

    profileImage: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: "#F3E8DF",
        marginRight: 18,
        marginBottom: 8,
    },

    profilePlaceholder: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: "#F3E8DF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 18,
        marginBottom: 8,
    },

    placeholderText: {
        fontSize: 12,
        color: "#8A7467",
        textAlign: "center",
        paddingHorizontal: 8,
    },

    imageDetails: {
        flex: 1,
        minWidth: 180,
        paddingVertical: 8,
    },

    imageTitle: {
        color: "#30241F",
        fontWeight: "700",
        fontSize: 15,
        marginBottom: 5,
    },

    imageDescription: {
        color: "#7D6C62",
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 12,
    },

    secondaryButton: {
        alignSelf: "flex-start",
        backgroundColor: "#FFF1E8",
        borderColor: "#F1D0BC",
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginTop: 4,
    },

    secondaryButtonText: {
        color: "#A53A13",
        fontWeight: "700",
        fontSize: 13,
    },

    selectedText: {
        color: "#267346",
        fontSize: 12,
        marginTop: 8,
        fontWeight: "600",
    },

    fieldContainer: {
        marginBottom: 17,
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#57453B",
        marginBottom: 8,
    },

    input: {
        width: "100%",
        minHeight: 48,
        backgroundColor: "#FFFCF9",
        borderWidth: 1,
        borderColor: "#E8DCD1",
        borderRadius: 11,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === "ios" ? 13 : 10,
        fontSize: 15,
        color: "#30241F",
    },

    aadharImage: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        backgroundColor: "#FFF8F0",
        marginBottom: 12,
    },

    aadharPlaceholder: {
        width: "100%",
        minHeight: 130,
        borderRadius: 12,
        backgroundColor: "#FFF8F0",
        borderWidth: 1,
        borderColor: "#F0E4D9",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },

    saveButton: {
        minHeight: 52,
        backgroundColor: "#B64216",
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
        paddingHorizontal: 16,
    },

    disabledButton: {
        opacity: 0.7,
    },

    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },

    savingContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },

    footerText: {
        fontSize: 12,
        color: "#8A796E",
        textAlign: "center",
        marginTop: 14,
        lineHeight: 18,
    },
});
