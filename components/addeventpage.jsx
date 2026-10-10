import React, { useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import AsyncStorage from "@react-native-async-storage/async-storage";
// import { BASE_URL } from "@env";

  const BASE_URL = "http://10.162.135.224:5001";
export default function AddEvent({ navigation }) {
    const [title, setTitle] = useState("");
    const [highlight, setHighlight] = useState("");
    const [event, setEvent] = useState("");
    const [info, setInfo] = useState("");
    const [url, setUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    // ==========================================
    // EXPIRY DATE
    // ==========================================

    const [expiresAt, setExpiresAt] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [loading, setLoading] = useState(false);


    // ==========================================
    // FORMAT DATE FOR DISPLAY
    // ==========================================

    const formatExpiryDate = (date) => {

        if (!date) {
            return "Select expiry date & time";
        }

        return date.toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };


    // ==========================================
    // DATE SELECTED
    // ==========================================

    const handleDateChange = (event, selectedDate) => {

        setShowDatePicker(false);

        if (event.type === "dismissed" || !selectedDate) {
            return;
        }

        const currentDate = expiresAt || new Date();

        const updatedDate = new Date(selectedDate);

        // Keep current selected time
        updatedDate.setHours(
            currentDate.getHours()
        );

        updatedDate.setMinutes(
            currentDate.getMinutes()
        );

        updatedDate.setSeconds(0);
        updatedDate.setMilliseconds(0);

        setExpiresAt(updatedDate);

        // Open time picker after selecting date
        setTimeout(() => {
            setShowTimePicker(true);
        }, 300);
    };


    // ==========================================
    // TIME SELECTED
    // ==========================================

    const handleTimeChange = (event, selectedTime) => {

        setShowTimePicker(false);

        if (event.type === "dismissed" || !selectedTime) {
            return;
        }

        const currentDate = expiresAt || new Date();

        const updatedDate = new Date(currentDate);

        updatedDate.setHours(
            selectedTime.getHours()
        );

        updatedDate.setMinutes(
            selectedTime.getMinutes()
        );

        updatedDate.setSeconds(0);
        updatedDate.setMilliseconds(0);

        setExpiresAt(updatedDate);
    };


    // ==========================================
    // CLEAR EXPIRY
    // ==========================================

    const clearExpiry = () => {
        setExpiresAt(null);
    };


    // ==========================================
    // ADD EVENT
    // ==========================================

    const addEvent = async () => {

        try {

            // ======================================
            // TITLE VALIDATION
            // ======================================

            if (!title.trim()) {

                Alert.alert(
                    "Required",
                    "Please enter an event title."
                );

                return;
            }


            // ======================================
            // GET ADMIN TOKEN
            // ======================================

            const token =
                await AsyncStorage.getItem(
                    "adminToken"
                );


            if (!token) {

                Alert.alert(
                    "Session Expired",
                    "Please login again."
                );

                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: "Login"
                        }
                    ]
                });

                return;
            }


            // ======================================
            // VALIDATE EXPIRY DATE
            // ======================================

            if (expiresAt) {

                if (expiresAt <= new Date()) {

                    Alert.alert(
                        "Invalid Expiry",
                        "Expiry date and time must be in the future."
                    );

                    return;
                }
            }


            setLoading(true);


            // ======================================
            // REQUEST BODY
            // ======================================

            const body = {

                token: token,

                title: title.trim(),

                highlight: highlight.trim(),

                event: event.trim(),

                info: info.trim(),

                url: url.trim(),

                imageUrl: imageUrl.trim(),

                expiresAt: expiresAt
                    ? expiresAt.toISOString()
                    : null
            };


            console.log(
                "Adding event:",
                body
            );


            // ======================================
            // API REQUEST
            // ======================================

            const response = await fetch(
                `${BASE_URL}/admin/createupdate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(body)
                }
            );


            const result =
                await response.json();


            console.log(
                "Add event response:",
                result
            );


            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    "Unable to create event."
                );
            }


            // ======================================
            // SUCCESS
            // ======================================

            Alert.alert(
                "Success",
                "Event published successfully.",
                [
                    {
                        text: "OK",

                        onPress: () => {
                            navigation.goBack();
                        }
                    }
                ]
            );


        } catch (error) {

            console.log(
                "Add event error:",
                error
            );

            Alert.alert(
                "Error",
                error?.message ||
                "Unable to create event."
            );

        } finally {

            setLoading(false);
        }
    };


    return (

        <View style={styles.container}>

            {/* ======================================
                HEADER
            ====================================== */}

            <View style={styles.header}>

                <View>

                    <Text style={styles.title}>
                        Add Event
                    </Text>

                    <Text style={styles.subtitle}>
                        Publish a new event or update
                    </Text>

                </View>


                <TouchableOpacity
                    onPress={() =>
                        navigation.goBack()
                    }
                    disabled={loading}
                >

                    <Text style={styles.backText}>
                        Back
                    </Text>

                </TouchableOpacity>

            </View>


            {/* ======================================
                FORM
            ====================================== */}

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    styles.scrollContent
                }
            >

                {/* ==================================
                    TITLE
                ================================== */}

                <Text style={styles.label}>
                    Title *
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter event title"
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                    editable={!loading}
                />


                {/* ==================================
                    HIGHLIGHT
                ================================== */}

                <Text style={styles.label}>
                    Highlight
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="e.g. Registration open now"
                    placeholderTextColor="#999"
                    value={highlight}
                    onChangeText={setHighlight}
                    editable={!loading}
                />


                {/* ==================================
                    EVENT
                ================================== */}

                <Text style={styles.label}>
                    Event
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter event name"
                    placeholderTextColor="#999"
                    value={event}
                    onChangeText={setEvent}
                    editable={!loading}
                />


                {/* ==================================
                    INFO
                ================================== */}

                <Text style={styles.label}>
                    Information
                </Text>

                <TextInput
                    style={[
                        styles.input,
                        styles.textArea
                    ]}
                    placeholder="Enter complete event information"
                    placeholderTextColor="#999"
                    value={info}
                    onChangeText={setInfo}
                    multiline
                    textAlignVertical="top"
                    editable={!loading}
                />


                {/* ==================================
                    URL
                ================================== */}

                <Text style={styles.label}>
                    Event URL
                </Text>

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


                {/* ==================================
                    IMAGE URL
                ================================== */}

                <Text style={styles.label}>
                    Image URL
                </Text>

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


                {/* ==================================
                    EXPIRY
                ================================== */}

                <Text style={styles.label}>
                    Expiry Date & Time
                </Text>


                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                    disabled={loading}
                >

                    <Text
                        style={[
                            styles.dateButtonText,
                            !expiresAt &&
                                styles.placeholderText
                        ]}
                    >
                        {formatExpiryDate(expiresAt)}
                    </Text>

                </TouchableOpacity>


                {/* DATE PICKER */}

                {showDatePicker && (

                    <DateTimePicker
                        value={
                            expiresAt || new Date()
                        }
                        mode="date"
                        minimumDate={new Date()}
                        onChange={handleDateChange}
                    />

                )}


                {/* TIME PICKER */}

                {showTimePicker && (

                    <DateTimePicker
                        value={
                            expiresAt || new Date()
                        }
                        mode="time"
                        onChange={handleTimeChange}
                    />

                )}


                {/* CLEAR BUTTON */}

                {expiresAt && (

                    <TouchableOpacity
                        onPress={clearExpiry}
                        disabled={loading}
                        style={styles.clearButton}
                    >

                        <Text style={styles.clearText}>
                            Remove expiry date
                        </Text>

                    </TouchableOpacity>

                )}


                <Text style={styles.helperText}>
                    Optional. Select when this event should stop appearing.
                </Text>


                {/* ==================================
                    PUBLISH BUTTON
                ================================== */}

                <TouchableOpacity
                    style={[
                        styles.addButton,
                        loading &&
                            styles.disabledButton
                    ]}
                    onPress={addEvent}
                    disabled={loading}
                >

                    {loading ? (

                        <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                        />

                    ) : (

                        <Text
                            style={
                                styles.addButtonText
                            }
                        >
                            Publish Event
                        </Text>

                    )}

                </TouchableOpacity>


                <View
                    style={
                        styles.bottomSpace
                    }
                />

            </ScrollView>

        </View>
    );
}


const styles = StyleSheet.create({

    // ==========================================
    // CONTAINER
    // ==========================================

    container: {
        flex: 1,
        backgroundColor: "#FFF8F0",
        paddingHorizontal: 20,
        paddingTop: 20
    },


    // ==========================================
    // HEADER
    // ==========================================

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },


    title: {
        fontSize: 25,
        fontWeight: "800",
        color: "#292929"
    },


    subtitle: {
        fontSize: 13,
        color: "#777",
        marginTop: 4
    },


    backText: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "700"
    },


    // ==========================================
    // SCROLL
    // ==========================================

    scrollContent: {
        paddingBottom: 30
    },


    // ==========================================
    // LABEL
    // ==========================================

    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#292929",
        marginBottom: 7,
        marginTop: 12
    },


    // ==========================================
    // INPUT
    // ==========================================

    input: {
        height: 50,
        backgroundColor: "#FFFFFF",
        borderRadius: 13,
        paddingHorizontal: 15,
        fontSize: 14,
        color: "#292929",
        elevation: 2
    },


    textArea: {
        height: 130,
        paddingTop: 15
    },


    // ==========================================
    // DATE BUTTON
    // ==========================================

    dateButton: {
        height: 50,
        backgroundColor: "#FFFFFF",
        borderRadius: 13,
        paddingHorizontal: 15,
        justifyContent: "center",
        elevation: 2
    },


    dateButtonText: {
        fontSize: 14,
        color: "#292929"
    },


    placeholderText: {
        color: "#999"
    },


    clearButton: {
        alignSelf: "flex-end",
        marginTop: 8
    },


    clearText: {
        color: "#B64216",
        fontSize: 12,
        fontWeight: "700"
    },


    helperText: {
        fontSize: 11,
        color: "#888",
        marginTop: 5,
        marginLeft: 3
    },


    // ==========================================
    // BUTTON
    // ==========================================

    addButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: "#B64216",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
        elevation: 3
    },


    disabledButton: {
        opacity: 0.7
    },


    addButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800"
    },


    bottomSpace: {
        height: 30
    }

});