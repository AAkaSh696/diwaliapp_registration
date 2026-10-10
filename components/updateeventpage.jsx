import React, {
    useCallback,
    useState
} from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    TextInput,
    Switch,
    ScrollView
} from "react-native";

import {
    useFocusEffect
} from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";

// import { BASE_URL } from "@env";

const BASE_URL = "http://10.162.135.224:5001";
export default function UpdateEvents({
    navigation
}) {

    const [events, setEvents] = useState([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    // ==========================================
    // EDIT STATE
    // ==========================================

    const [editingEvent, setEditingEvent] = useState(null);

    const [title, setTitle] = useState("");
    const [highlight, setHighlight] = useState("");
    const [event, setEvent] = useState("");
    const [info, setInfo] = useState("");
    const [url, setUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [isActive, setIsActive] = useState(true);

    const [updating, setUpdating] = useState(false);


    // ==========================================
    // FETCH EVENTS
    // ==========================================

    const fetchEvents = async (
        showLoader = true
    ) => {

        try {

            if (showLoader) {
                setLoading(true);
            }

            const token =
                await AsyncStorage.getItem(
                    "adminToken"
                );


            // ======================================
            // CHECK TOKEN
            // ======================================

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
            // GET EVENTS
            // ======================================

            const response = await fetch(
                `${BASE_URL}/admin/getadminupdates`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        token: token
                    })
                }
            );


            const result =
                await response.json();


            console.log(
                "Events response:",
                result
            );


            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    "Unable to fetch events."
                );
            }


            // ======================================
            // STORE FRESH DATA
            // ======================================

            const eventData =
                Array.isArray(result?.data)
                    ? result.data
                    : [];


            const sortedEvents =
                [...eventData].sort(
                    (a, b) => {

                        const dateA =
                            new Date(
                                a?.publishedAt || 0
                            ).getTime();

                        const dateB =
                            new Date(
                                b?.publishedAt || 0
                            ).getTime();

                        return dateB - dateA;
                    }
                );


            setEvents(sortedEvents);

        } catch (error) {

            console.log(
                "Fetch events error:",
                error
            );

            Alert.alert(
                "Error",
                error?.message ||
                "Unable to fetch events."
            );

        } finally {

            setLoading(false);

            setRefreshing(false);
        }
    };


    // ==========================================
    // USE FOCUS EFFECT
    // ==========================================

    useFocusEffect(
        useCallback(() => {

            fetchEvents(true);

        }, [])
    );


    // ==========================================
    // REFRESH
    // ==========================================

    const onRefresh = async () => {

        setRefreshing(true);

        await fetchEvents(false);
    };


    // ==========================================
    // OPEN EDIT MODE
    // ==========================================

    const openEdit = (item) => {

        if (!item?._id) {

            Alert.alert(
                "Error",
                "Event ID is missing."
            );

            return;
        }


        setEditingEvent(item);

        setTitle(item?.title || "");

        setHighlight(
            item?.highlight || ""
        );

        setEvent(
            item?.event || ""
        );

        setInfo(
            item?.info || ""
        );

        setUrl(
            item?.url || ""
        );

        setImageUrl(
            item?.imageUrl || ""
        );

        setIsActive(
            item?.isActive !== false
        );


        // Convert existing expiry date
        // to editable date-time string

        if (item?.expiresAt) {

            const date =
                new Date(item.expiresAt);

            if (!isNaN(date.getTime())) {

                setExpiresAt(
                    date
                        .toISOString()
                        .slice(0, 16)
                );

            } else {

                setExpiresAt("");
            }

        } else {

            setExpiresAt("");
        }
    };


    // ==========================================
    // CLOSE EDIT MODE
    // ==========================================

    const closeEdit = () => {

        setEditingEvent(null);

        setTitle("");
        setHighlight("");
        setEvent("");
        setInfo("");
        setUrl("");
        setImageUrl("");
        setExpiresAt("");
        setIsActive(true);
    };


    // ==========================================
    // UPDATE EVENT
    // ==========================================

    const updateEvent = async () => {

        try {

            if (!editingEvent?._id) {

                Alert.alert(
                    "Error",
                    "Event ID is missing."
                );

                return;
            }


            if (!title.trim()) {

                Alert.alert(
                    "Validation",
                    "Event title is required."
                );

                return;
            }


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


            setUpdating(true);


            // ======================================
            // UPDATE BODY
            // ======================================

            const body = {

                token: token,

                id: editingEvent._id,

                title: title.trim(),

                highlight:
                    highlight.trim(),

                event:
                    event.trim(),

                info:
                    info.trim(),

                url:
                    url.trim(),

                imageUrl:
                    imageUrl.trim(),

                isActive:
                    isActive,

                expiresAt:
                    expiresAt.trim()
                        ? expiresAt.trim()
                        : null
            };


            console.log(
                "Update event body:",
                body
            );


            // ======================================
            // UPDATE API
            // ======================================

            const response = await fetch(
                `${BASE_URL}/admin/updateadminupdate`,
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
                "Update event response:",
                result
            );


            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    "Unable to update event."
                );
            }


            // ======================================
            // SUCCESS
            // ======================================

            Alert.alert(
                "Success",
                "Event updated successfully."
            );


            // ======================================
            // CLOSE EDIT MODE
            // ======================================

            closeEdit();


            // ======================================
            // FETCH FRESH DATA
            // ======================================

            await fetchEvents(false);

        } catch (error) {

            console.log(
                "Update event error:",
                error
            );

            Alert.alert(
                "Error",
                error?.message ||
                "Unable to update event."
            );

        } finally {

            setUpdating(false);
        }
    };


    // ==========================================
    // DEACTIVATE EVENT
    // ==========================================

    const deactivateEvent = async (
        eventId
    ) => {

        try {

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


            if (!eventId) {

                Alert.alert(
                    "Error",
                    "Event ID is missing."
                );

                return;
            }


            setDeletingId(eventId);


            const response = await fetch(
                `${BASE_URL}/admin/deleteadminupdate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        token: token,
                        id: eventId
                    })
                }
            );


            const result =
                await response.json();


            console.log(
                "Delete event response:",
                result
            );


            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    "Unable to deactivate event."
                );
            }


            Alert.alert(
                "Success",
                "Event deactivated successfully."
            );


            await fetchEvents(false);

        } catch (error) {

            console.log(
                "Delete event error:",
                error
            );

            Alert.alert(
                "Error",
                error?.message ||
                "Unable to deactivate event."
            );

        } finally {

            setDeletingId(null);
        }
    };


    // ==========================================
    // CONFIRM DEACTIVATION
    // ==========================================

    const confirmDeactivate = (
        item
    ) => {

        Alert.alert(
            "Deactivate Event",

            `Are you sure you want to deactivate "${item?.title || "this event"}"?`,

            [
                {
                    text: "Cancel",
                    style: "cancel"
                },

                {
                    text: "Deactivate",
                    style: "destructive",

                    onPress: () =>
                        deactivateEvent(
                            item?._id
                        )
                }
            ]
        );
    };


    // ==========================================
    // EDIT FORM
    // ==========================================

    const renderEditForm = () => {

        if (!editingEvent) {
            return null;
        }


        return (

            <View style={styles.editContainer}>

                {/* HEADER */}

                <View style={styles.editHeader}>

                    <View>

                        <Text
                            style={
                                styles.editHeading
                            }
                        >
                            Edit Event
                        </Text>

                        <Text
                            style={
                                styles.editSubheading
                            }
                        >
                            Update event details
                        </Text>

                    </View>


                    <TouchableOpacity
                        onPress={closeEdit}
                        disabled={updating}
                    >

                        <Text
                            style={
                                styles.cancelText
                            }
                        >
                            Cancel
                        </Text>

                    </TouchableOpacity>

                </View>


                {/* TITLE */}

                <Text style={styles.label}>
                    Title *
                </Text>

                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter event title"
                    placeholderTextColor="#999"
                    editable={!updating}
                />


                {/* HIGHLIGHT */}

                <Text style={styles.label}>
                    Highlight
                </Text>

                <TextInput
                    style={styles.input}
                    value={highlight}
                    onChangeText={setHighlight}
                    placeholder="Enter highlight"
                    placeholderTextColor="#999"
                    editable={!updating}
                />


                {/* EVENT */}

                <Text style={styles.label}>
                    Event
                </Text>

                <TextInput
                    style={styles.input}
                    value={event}
                    onChangeText={setEvent}
                    placeholder="Enter event name"
                    placeholderTextColor="#999"
                    editable={!updating}
                />


                {/* INFORMATION */}

                <Text style={styles.label}>
                    Information
                </Text>

                <TextInput
                    style={[
                        styles.input,
                        styles.multilineInput
                    ]}
                    value={info}
                    onChangeText={setInfo}
                    placeholder="Enter event information"
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                    editable={!updating}
                />


                {/* EVENT URL */}

                <Text style={styles.label}>
                    Event URL
                </Text>

                <TextInput
                    style={styles.input}
                    value={url}
                    onChangeText={setUrl}
                    placeholder="Enter event URL"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="url"
                    editable={!updating}
                />


                {/* IMAGE URL */}

                <Text style={styles.label}>
                    Image URL
                </Text>

                <TextInput
                    style={styles.input}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="Enter image URL"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="url"
                    editable={!updating}
                />


                {/* EXPIRY */}

                <Text style={styles.label}>
                    Expiry Date & Time
                </Text>

                <TextInput
                    style={styles.input}
                    value={expiresAt}
                    onChangeText={setExpiresAt}
                    placeholder="YYYY-MM-DDTHH:MM"
                    placeholderTextColor="#999"
                    editable={!updating}
                />


                {/* ACTIVE */}

                <View
                    style={
                        styles.switchContainer
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.switchTitle
                            }
                        >
                            Event Active
                        </Text>

                        <Text
                            style={
                                styles.switchSubtitle
                            }
                        >
                            Allow this event to
                            remain visible
                        </Text>

                    </View>


                    <Switch
                        value={isActive}
                        onValueChange={
                            setIsActive
                        }
                        disabled={updating}
                    />

                </View>


                {/* UPDATE BUTTON */}

                <TouchableOpacity
                    style={
                        styles.updateButton
                    }
                    onPress={updateEvent}
                    disabled={updating}
                >

                    {updating ? (

                        <ActivityIndicator
                            color="#FFFFFF"
                        />

                    ) : (

                        <Text
                            style={
                                styles.updateButtonText
                            }
                        >
                            Update Event
                        </Text>

                    )}

                </TouchableOpacity>

            </View>
        );
    };


    // ==========================================
    // RENDER EVENT
    // ==========================================

    const renderEvent = ({
        item
    }) => {

        const isDeleting =
            deletingId === item?._id;


        // ======================================
        // CURRENT EVENT IS BEING EDITED
        // ======================================

        if (
            editingEvent?._id === item?._id
        ) {

            return (
                <View style={styles.card}>
                    {renderEditForm()}
                </View>
            );
        }


        return (

            <View style={styles.card}>

                {/* EVENT HEADER */}

                <View
                    style={
                        styles.eventHeader
                    }
                >

                    <View
                        style={
                            styles.titleContainer
                        }
                    >

                        <Text
                            style={
                                styles.eventTitle
                            }
                        >
                            {item?.title ||
                                "Untitled Event"}
                        </Text>


                        {item?.highlight ? (

                            <Text
                                style={
                                    styles.highlight
                                }
                            >
                                {item.highlight}
                            </Text>

                        ) : null}

                    </View>


                    {/* STATUS */}

                    <View
                        style={
                            item?.isActive
                                ? styles.activeBadge
                                : styles.inactiveBadge
                        }
                    >

                        <Text
                            style={
                                item?.isActive
                                    ? styles.activeText
                                    : styles.inactiveText
                            }
                        >
                            {item?.isActive
                                ? "Active"
                                : "Inactive"}
                        </Text>

                    </View>

                </View>


                {/* EVENT */}

                {item?.event ? (

                    <Text
                        style={
                            styles.eventName
                        }
                    >
                        Event: {item.event}
                    </Text>

                ) : null}


                {/* INFORMATION */}

                {item?.info ? (

                    <Text
                        style={
                            styles.info
                        }
                        numberOfLines={4}
                    >
                        {item.info}
                    </Text>

                ) : null}


                {/* EXPIRY */}

                {item?.expiresAt ? (

                    <Text
                        style={
                            styles.expiry
                        }
                    >
                        Expires:{" "}
                        {new Date(
                            item.expiresAt
                        ).toLocaleString()}
                    </Text>

                ) : (

                    <Text
                        style={
                            styles.expiry
                        }
                    >
                        No expiry date
                    </Text>

                )}


                {/* PUBLISHED */}

                {item?.publishedAt ? (

                    <Text
                        style={
                            styles.date
                        }
                    >
                        Published:{" "}
                        {new Date(
                            item.publishedAt
                        ).toLocaleString()}
                    </Text>

                ) : null}


                {/* ACTIONS */}

                <View
                    style={
                        styles.actions
                    }
                >

                    {/* EDIT */}

                    <TouchableOpacity
                        style={
                            styles.editButton
                        }
                        onPress={() =>
                            openEdit(item)
                        }
                        disabled={
                            isDeleting ||
                            updating
                        }
                    >

                        <Text
                            style={
                                styles.editText
                            }
                        >
                            Edit
                        </Text>

                    </TouchableOpacity>


                    {/* DEACTIVATE */}

                    {item?.isActive && (

                        <TouchableOpacity
                            style={
                                styles.deleteButton
                            }
                            onPress={() =>
                                confirmDeactivate(
                                    item
                                )
                            }
                            disabled={
                                isDeleting ||
                                updating
                            }
                        >

                            {isDeleting ? (

                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />

                            ) : (

                                <Text
                                    style={
                                        styles.deleteText
                                    }
                                >
                                    Deactivate
                                </Text>

                            )}

                        </TouchableOpacity>

                    )}

                </View>

            </View>
        );
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (
        loading &&
        events.length === 0
    ) {

        return (

            <View
                style={
                    styles.loadingContainer
                }
            >

                <ActivityIndicator
                    size="large"
                />

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Loading events...
                </Text>

            </View>
        );
    }


    // ==========================================
    // MAIN UI
    // ==========================================

    return (

        <View style={styles.container}>

            {/* HEADER */}

            <View style={styles.header}>

                <View>

                    <Text
                        style={
                            styles.title
                        }
                    >
                        Update Events
                    </Text>

                    <Text
                        style={
                            styles.subtitle
                        }
                    >
                        {events.length} event
                        {events.length !== 1
                            ? "s"
                            : ""}
                    </Text>

                </View>


                <TouchableOpacity
                    onPress={() => {

                        if (editingEvent) {
                            closeEdit();
                        } else {
                            navigation.goBack();
                        }

                    }}
                    disabled={updating}
                >

                    <Text
                        style={
                            styles.backText
                        }
                    >
                        {editingEvent
                            ? "Cancel"
                            : "Back"}
                    </Text>

                </TouchableOpacity>

            </View>


            {/* EVENT LIST */}

            <FlatList

                data={events}

                keyExtractor={item =>
                    String(item?._id)
                }

                renderItem={
                    renderEvent
                }

                showsVerticalScrollIndicator={
                    false
                }

                refreshControl={

                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            onRefresh
                        }
                    />

                }

                contentContainerStyle={
                    events.length === 0
                        ? styles.emptyContainer
                        : styles.listContainer
                }

                ListEmptyComponent={

                    <View
                        style={
                            styles.emptyView
                        }
                    >

                        <Text
                            style={
                                styles.emptyIcon
                            }
                        >
                            📢
                        </Text>

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No events found
                        </Text>

                        <Text
                            style={
                                styles.emptySubtitle
                            }
                        >
                            Create a new event from
                            the Add Event page.
                        </Text>

                    </View>

                }

            />

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


    loadingContainer: {
        flex: 1,
        backgroundColor: "#FFF8F0",
        justifyContent: "center",
        alignItems: "center"
    },


    loadingText: {
        marginTop: 10,
        color: "#777",
        fontSize: 14
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
    // LIST
    // ==========================================

    listContainer: {
        paddingBottom: 30
    },


    emptyContainer: {
        flexGrow: 1,
        justifyContent: "center"
    },


    // ==========================================
    // CARD
    // ==========================================

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 17,
        marginBottom: 14,

        elevation: 3,

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 3
        },

        shadowOpacity: 0.05,

        shadowRadius: 8
    },


    // ==========================================
    // EVENT HEADER
    // ==========================================

    eventHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start"
    },


    titleContainer: {
        flex: 1,
        paddingRight: 10
    },


    eventTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#292929"
    },


    highlight: {
        fontSize: 13,
        color: "#B64216",
        fontWeight: "700",
        marginTop: 5
    },


    // ==========================================
    // STATUS
    // ==========================================

    activeBadge: {
        backgroundColor: "#E8F7EC",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8
    },


    inactiveBadge: {
        backgroundColor: "#F1F1F1",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8
    },


    activeText: {
        color: "#218838",
        fontSize: 11,
        fontWeight: "800"
    },


    inactiveText: {
        color: "#777",
        fontSize: 11,
        fontWeight: "800"
    },


    // ==========================================
    // CONTENT
    // ==========================================

    eventName: {
        fontSize: 14,
        color: "#444",
        fontWeight: "700",
        marginTop: 13
    },


    info: {
        fontSize: 13,
        lineHeight: 20,
        color: "#666",
        marginTop: 8
    },


    expiry: {
        fontSize: 12,
        color: "#B64216",
        marginTop: 10
    },


    date: {
        fontSize: 11,
        color: "#999",
        marginTop: 5
    },


    // ==========================================
    // ACTIONS
    // ==========================================

    actions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16
    },


    editButton: {
        flex: 1,
        height: 45,
        borderRadius: 11,
        backgroundColor: "#F3E8E1",
        justifyContent: "center",
        alignItems: "center"
    },


    editText: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "800"
    },


    deleteButton: {
        flex: 1,
        height: 45,
        borderRadius: 11,
        backgroundColor: "#C0392B",
        justifyContent: "center",
        alignItems: "center"
    },


    deleteText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800"
    },


    // ==========================================
    // EDIT FORM
    // ==========================================

    editContainer: {
        width: "100%"
    },


    editHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18
    },


    editHeading: {
        fontSize: 21,
        fontWeight: "800",
        color: "#292929"
    },


    editSubheading: {
        fontSize: 12,
        color: "#888",
        marginTop: 3
    },


    cancelText: {
        color: "#B64216",
        fontWeight: "700",
        fontSize: 14
    },


    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#444",
        marginBottom: 6,
        marginTop: 10
    },


    input: {
        minHeight: 45,
        borderWidth: 1,
        borderColor: "#E1D7D0",
        borderRadius: 11,
        backgroundColor: "#FFFDFC",
        paddingHorizontal: 13,
        paddingVertical: 10,
        fontSize: 14,
        color: "#292929"
    },


    multilineInput: {
        minHeight: 100,
        textAlignVertical: "top"
    },


    switchContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 18,
        paddingVertical: 12,
        paddingHorizontal: 4
    },


    switchTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#333"
    },


    switchSubtitle: {
        fontSize: 11,
        color: "#888",
        marginTop: 3,
        maxWidth: 220
    },


    updateButton: {
        height: 48,
        borderRadius: 11,
        backgroundColor: "#B64216",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 14
    },


    updateButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800"
    },


    // ==========================================
    // EMPTY
    // ==========================================

    emptyView: {
        alignItems: "center",
        paddingHorizontal: 20
    },


    emptyIcon: {
        fontSize: 45,
        marginBottom: 12
    },


    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#292929"
    },


    emptySubtitle: {
        fontSize: 13,
        color: "#888",
        marginTop: 6,
        textAlign: "center"
    }

});