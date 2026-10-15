
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "";

export default function AddEvent({ navigation }) {
    const [title, setTitle] = useState("");
    const [highlight, setHighlight] = useState("");
    const [event, setEvent] = useState("");
    const [info, setInfo] = useState("");
    const [url, setUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const [expiresAt, setExpiresAt] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const formatExpiryDate = (date) => {
        if (!date) return "Select expiry date & time";

        return date.toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleDateChange = (pickerEvent, selectedDate) => {
        setShowDatePicker(false);

        if (pickerEvent?.type === "dismissed" || !selectedDate) {
            return;
        }

        const currentDate = expiresAt || new Date();
        const updatedDate = new Date(selectedDate);

        updatedDate.setHours(currentDate.getHours());
        updatedDate.setMinutes(currentDate.getMinutes());
        updatedDate.setSeconds(0);
        updatedDate.setMilliseconds(0);

        setExpiresAt(updatedDate);

        // On Android, show the time picker after the date picker closes.
        if (Platform.OS === "android") {
            setTimeout(() => setShowTimePicker(true), 250);
        } else {
            setShowTimePicker(true);
        }
    };

    const handleTimeChange = (pickerEvent, selectedTime) => {
        setShowTimePicker(false);

        if (pickerEvent?.type === "dismissed" || !selectedTime) {
            return;
        }

        const currentDate = expiresAt || new Date();
        const updatedDate = new Date(currentDate);

        updatedDate.setHours(selectedTime.getHours());
        updatedDate.setMinutes(selectedTime.getMinutes());
        updatedDate.setSeconds(0);
        updatedDate.setMilliseconds(0);

        setExpiresAt(updatedDate);
    };

    const clearExpiry = () => {
        setExpiresAt(null);
        setShowDatePicker(false);
        setShowTimePicker(false);
    };

    const resetForm = () => {
        setTitle("");
        setHighlight("");
        setEvent("");
        setInfo("");
        setUrl("");
        setImageUrl("");
        setExpiresAt(null);
        setShowDatePicker(false);
        setShowTimePicker(false);
    };

    const goBack = () => {
        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        } else {
            navigation?.navigate?.("AdminDashboard");
        }
    };

    const addEvent = async () => {
        if (loading) return;

        setSuccessMessage("");
        setErrorMessage("");

        if (!title.trim()) {
            setErrorMessage("Please enter an event title.");
            return;
        }

        if (expiresAt && expiresAt.getTime() <= Date.now()) {
            setErrorMessage(
                "Expiry date and time must be in the future."
            );
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem("adminToken");

            if (!token) {
                setErrorMessage("Your session has expired. Please log in again.");

                if (navigation?.reset) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "Login" }],
                    });
                }
                return;
            }

            const body = {
                token,
                title: title.trim(),
                highlight: highlight.trim(),
                event: event.trim(),
                info: info.trim(),
                url: url.trim(),
                imageUrl: imageUrl.trim(),
                expiresAt: expiresAt
                    ? expiresAt.toISOString()
                    : null,
            };

            const response = await fetch(
                `${BASE_URL}/admin/createupdate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                }
            );

            const result = await response.json();

            if (response.status === 401 || response.status === 403) {
                setErrorMessage(
                    result?.msg || "Your session has expired. Please log in again."
                );
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result?.msg || "Unable to create event."
                );
            }

            resetForm();
            setSuccessMessage("Event published successfully!");
        } catch (error) {
            console.error("Add event error:", error);
            setErrorMessage(
                error?.message ||
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>Add Event</Text>
                    <Text style={styles.subtitle}>
                        Publish a new event or update
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={goBack}
                    disabled={loading}
                    style={styles.backButton}
                >
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            </View>

            {/* Success message: no invalid accessibilityRole */}
            {successMessage ? (
                <View style={styles.successAlert}>
                    <View style={styles.successIconContainer}>
                        <Text style={styles.successIcon}>✓</Text>
                    </View>

                    <View style={styles.messageContainer}>
                        <Text style={styles.successTitle}>Success</Text>
                        <Text
                            style={styles.successAlertText}
                            accessibilityLiveRegion="polite"
                        >
                            {successMessage}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setSuccessMessage("")}
                        accessibilityLabel="Dismiss success message"
                    >
                        <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Error message */}
            {errorMessage ? (
                <View style={styles.errorAlert}>
                    <View style={styles.messageContainer}>
                        <Text style={styles.errorTitle}>Please check</Text>
                        <Text style={styles.errorText}>
                            {errorMessage}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setErrorMessage("")}
                        style={styles.closeButton}
                        accessibilityLabel="Dismiss error message"
                    >
                        <Text style={styles.errorCloseText}>×</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter event title"
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                    editable={!loading}
                />

                <Text style={styles.label}>Highlight</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Registration open now"
                    placeholderTextColor="#999"
                    value={highlight}
                    onChangeText={setHighlight}
                    editable={!loading}
                />

                <Text style={styles.label}>Event</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter event name"
                    placeholderTextColor="#999"
                    value={event}
                    onChangeText={setEvent}
                    editable={!loading}
                />

                <Text style={styles.label}>Information</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter complete event information"
                    placeholderTextColor="#999"
                    value={info}
                    onChangeText={setInfo}
                    multiline
                    textAlignVertical="top"
                    editable={!loading}
                />

                <Text style={styles.label}>Event URL</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://example.com"
                    placeholderTextColor="#999"
                    value={url}
                    onChangeText={setUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                    editable={!loading}
                />

                <Text style={styles.label}>Image URL</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor="#999"
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                    editable={!loading}
                />

                {/* Expiry date and time */}
                <Text style={styles.label}>Expiry Date & Time</Text>

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                        setShowTimePicker(false);
                        setShowDatePicker(true);
                    }}
                    disabled={loading}
                >
                    <Text
                        style={[
                            styles.dateButtonText,
                            !expiresAt && styles.placeholderText,
                        ]}
                    >
                        {formatExpiryDate(expiresAt)}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={expiresAt || new Date()}
                        mode="date"
                        minimumDate={new Date()}
                        display={Platform.OS === "web" ? "default" : "default"}
                        onChange={handleDateChange}
                    />
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={expiresAt || new Date()}
                        mode="time"
                        onChange={handleTimeChange}
                    />
                )}

                {expiresAt ? (
                    <TouchableOpacity
                        onPress={clearExpiry}
                        disabled={loading}
                        style={styles.clearButton}
                    >
                        <Text style={styles.clearText}>
                            Remove expiry date
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <Text style={styles.helperText}>
                    Optional. Select when this event should stop appearing.
                </Text>

                <TouchableOpacity
                    style={[
                        styles.addButton,
                        loading && styles.disabledButton,
                    ]}
                    onPress={addEvent}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />
                            <Text style={styles.addButtonText}>
                                Publishing...
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.addButtonText}>
                            Publish Event
                        </Text>
                    )}
                </TouchableOpacity>

                {successMessage ? (
                    <TouchableOpacity
                        style={styles.returnButton}
                        onPress={goBack}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.returnButtonText}>
                            Back to Events
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <View style={styles.bottomSpace} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF8F0",
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    headerTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 25,
        fontWeight: "800",
        color: "#292929",
    },
    subtitle: {
        fontSize: 13,
        color: "#777",
        marginTop: 4,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "700",
    },
    successAlert: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F7EC",
        borderColor: "#B7E4C7",
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 13,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    successIconContainer: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#CDEFD5",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },
    successIcon: {
        fontSize: 20,
        color: "#218838",
        fontWeight: "900",
    },
    messageContainer: {
        flex: 1,
    },
    successTitle: {
        fontSize: 14,
        color: "#218838",
        fontWeight: "800",
        marginBottom: 2,
    },
    successAlertText: {
        fontSize: 13,
        lineHeight: 19,
        color: "#276738",
    },
    closeButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 8,
    },
    closeText: {
        fontSize: 23,
        color: "#218838",
        fontWeight: "600",
    },
    errorAlert: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    errorTitle: {
        color: "#B91C1C",
        fontWeight: "800",
        fontSize: 14,
        marginBottom: 4,
    },
    errorText: {
        color: "#991B1B",
        fontSize: 13,
        lineHeight: 19,
    },
    errorCloseText: {
        color: "#B91C1C",
        fontSize: 23,
        fontWeight: "600",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#292929",
        marginBottom: 7,
        marginTop: 12,
    },
    input: {
        minHeight: 50,
        backgroundColor: "#FFFFFF",
        borderRadius: 13,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        color: "#292929",
        borderWidth: 1,
        borderColor: "#F0E5DC",
    },
    textArea: {
        height: 130,
        paddingTop: 15,
    },
    dateButton: {
        minHeight: 50,
        backgroundColor: "#FFFFFF",
        borderRadius: 13,
        paddingHorizontal: 15,
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#F0E5DC",
    },
    dateButtonText: {
        fontSize: 14,
        color: "#292929",
    },
    placeholderText: {
        color: "#999",
    },
    clearButton: {
        alignSelf: "flex-end",
        marginTop: 8,
    },
    clearText: {
        color: "#B64216",
        fontSize: 12,
        fontWeight: "700",
    },
    helperText: {
        fontSize: 11,
        color: "#888",
        marginTop: 7,
        marginLeft: 3,
        lineHeight: 17,
    },
    addButton: {
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: "#B64216",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginTop: 25,
        paddingHorizontal: 15,
    },
    disabledButton: {
        opacity: 0.7,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        marginLeft: 10,
    },
    returnButton: {
        minHeight: 48,
        borderRadius: 13,
        backgroundColor: "#F3E8E1",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    returnButtonText: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "800",
    },
    bottomSpace: {
        height: 30,
    },
});
