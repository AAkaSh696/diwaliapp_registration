
import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    RefreshControl,
    TextInput,
    Switch,
    Modal,
    ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "";
export default function UpdateEvents({ navigation }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [editingEvent, setEditingEvent] = useState(null);
    const [confirmEvent, setConfirmEvent] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    const [title, setTitle] = useState("");
    const [highlight, setHighlight] = useState("");
    const [event, setEvent] = useState("");
    const [info, setInfo] = useState("");
    const [url, setUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [isActive, setIsActive] = useState(true);

    const showMessage = (heading, message) => {
        setDialog({ heading, message });
    };

    const expireSession = async () => {
        await AsyncStorage.removeItem("adminToken");

        if (navigation) {
            navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
            });
        }
    };

    const toLocalDateTime = (value) => {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        const pad = (number) => String(number).padStart(2, "0");

        return (
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-` +
            `${pad(date.getDate())}T${pad(date.getHours())}:` +
            `${pad(date.getMinutes())}`
        );
    };

    // Fetch events
    const fetchEvents = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);

            const token = await AsyncStorage.getItem("adminToken");

            if (!token) {
                await expireSession();
                return;
            }

            const response = await fetch(
                `${BASE_URL}/admin/getadminupdates`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                }
            );

            const result = await response.json();

            if (response.status === 401 || response.status === 403) {
                await expireSession();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result?.msg || "Unable to fetch events."
                );
            }

            const list = Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.updates)
                    ? result.updates
                    : Array.isArray(result)
                        ? result
                        : [];

            list.sort((a, b) => {
                const dateA = new Date(a?.publishedAt || 0).getTime();
                const dateB = new Date(b?.publishedAt || 0).getTime();
                return dateB - dateA;
            });

            setEvents(list);
        } catch (error) {
            console.error("Fetch events error:", error);
            showMessage(
                "Error",
                error?.message || "Unable to fetch events."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchEvents(true);
        }, [fetchEvents])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEvents(false);
    };

    // Open edit form
    const openEdit = (item) => {
        if (!item?._id) {
            showMessage("Error", "Event ID is missing.");
            return;
        }

        setSuccessMessage("");
        setEditingEvent(item);
        setTitle(item.title || "");
        setHighlight(item.highlight || "");
        setEvent(item.event || "");
        setInfo(item.info || "");
        setUrl(item.url || "");
        setImageUrl(item.imageUrl || "");
        setExpiresAt(toLocalDateTime(item.expiresAt));
        setIsActive(item.isActive !== false);
    };

    const closeEdit = () => {
        if (updating) return;

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

    // Update event
    const updateEvent = async () => {
        if (updating) return;

        if (!editingEvent?._id) {
            showMessage("Error", "Event ID is missing.");
            return;
        }

        if (!title.trim()) {
            showMessage("Validation", "Event title is required.");
            return;
        }

        let expiryDate = null;

        if (expiresAt.trim()) {
            const parsedDate = new Date(expiresAt);

            if (Number.isNaN(parsedDate.getTime())) {
                showMessage(
                    "Invalid date",
                    "Enter a valid expiry date and time."
                );
                return;
            }

            expiryDate = parsedDate.toISOString();
        }

        setUpdating(true);
        setSuccessMessage("");

        try {
            const token = await AsyncStorage.getItem("adminToken");

            if (!token) {
                await expireSession();
                return;
            }

            const payload = {
                token,
                id: editingEvent._id,
                title: title.trim(),
                highlight: highlight.trim(),
                event: event.trim(),
                info: info.trim(),
                url: url.trim(),
                imageUrl: imageUrl.trim(),
                isActive,
                expiresAt: expiryDate,
            };

            const response = await fetch(
                `${BASE_URL}/admin/updateadminupdate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();

            if (response.status === 401 || response.status === 403) {
                await expireSession();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result?.msg || "Unable to update event."
                );
            }

            setEditingEvent(null);
            setSuccessMessage("Event updated successfully!");
            await fetchEvents(false);
        } catch (error) {
            console.error("Update event error:", error);
            showMessage(
                "Error",
                error?.message || "Unable to update event."
            );
        } finally {
            setUpdating(false);
        }
    };

    // Deactivate event
    const deactivateEvent = async () => {
        const item = confirmEvent;

        if (!item?._id || deletingId !== null) return;

        setConfirmEvent(null);
        setDeletingId(String(item._id));
        setSuccessMessage("");

        try {
            const token = await AsyncStorage.getItem("adminToken");

            if (!token) {
                await expireSession();
                return;
            }

            const response = await fetch(
                `${BASE_URL}/admin/deleteadminupdate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        id: item._id,
                    }),
                }
            );

            const result = await response.json();

            if (response.status === 401 || response.status === 403) {
                await expireSession();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result?.msg || "Unable to deactivate event."
                );
            }

            setSuccessMessage("Event deactivated successfully!");
            await fetchEvents(false);
        } catch (error) {
            console.error("Deactivate event error:", error);
            showMessage(
                "Error",
                error?.message || "Unable to deactivate event."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const renderField = (
        label,
        value,
        setter,
        placeholder,
        multiline = false,
        extraProps = {}
    ) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>

            <TextInput
                style={[
                    styles.input,
                    multiline && styles.multilineInput,
                ]}
                value={value}
                onChangeText={setter}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                multiline={multiline}
                textAlignVertical={multiline ? "top" : "center"}
                editable={!updating}
                {...extraProps}
            />
        </View>
    );

    const renderItem = ({ item }) => {
        const active = item?.isActive !== false;
        const deleting = deletingId === String(item?._id);

        return (
            <View style={styles.eventCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <Text style={styles.eventTitle}>
                            {item?.title || "Untitled event"}
                        </Text>

                        {!!item?.highlight && (
                            <Text style={styles.highlight}>
                                {item.highlight}
                            </Text>
                        )}
                    </View>

                    <View
                        style={[
                            styles.badge,
                            active ? styles.activeBadge : styles.inactiveBadge,
                        ]}
                    >
                        <Text
                            style={[
                                styles.badgeText,
                                active ? styles.activeText : styles.inactiveText,
                            ]}
                        >
                            {active ? "Active" : "Inactive"}
                        </Text>
                    </View>
                </View>

                {!!item?.event && (
                    <Text style={styles.description}>{item.event}</Text>
                )}

                {!!item?.info && (
                    <Text style={styles.info} numberOfLines={4}>
                        {item.info}
                    </Text>
                )}

                {!!item?.expiresAt && (
                    <Text style={styles.dateText}>
                        Expires: {toLocalDateTime(item.expiresAt).replace("T", " ")}
                    </Text>
                )}

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.button, styles.editButton]}
                        onPress={() => openEdit(item)}
                        disabled={deletingId !== null}
                    >
                        <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>

                    {active && (
                        <TouchableOpacity
                            style={[styles.button, styles.deleteButton]}
                            onPress={() => setConfirmEvent(item)}
                            disabled={deletingId !== null}
                        >
                            {deleting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Deactivate
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.heading}>Update Events</Text>
                    <Text style={styles.subtitle}>
                        Manage and update published events
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
                    disabled={refreshing || loading}
                >
                    <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {!!successMessage && (
                <View style={styles.successBox}>
                    <Text
                        style={styles.successText}
                        accessibilityLiveRegion="polite"
                    >
                        {successMessage}
                    </Text>
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Loading events...</Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item, index) =>
                        String(item?._id || index)
                    }
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>
                                No events found
                            </Text>
                            <Text style={styles.emptyText}>
                                Events will appear here when available.
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Edit modal */}
            <Modal
                visible={!!editingEvent}
                transparent
                animationType="fade"
                onRequestClose={closeEdit}
            >
                <View style={styles.overlay}>
                    <View style={styles.editModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Event</Text>

                            <TouchableOpacity
                                onPress={closeEdit}
                                disabled={updating}
                            >
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.formScroll}
                            contentContainerStyle={styles.formContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {renderField("Title *", title, setTitle, "Event title")}
                            {renderField("Highlight", highlight, setHighlight, "Highlight")}
                            {renderField("Event", event, setEvent, "Event name")}
                            {renderField("Information", info, setInfo, "Event information", true)}
                            {renderField(
                                "Event URL",
                                url,
                                setUrl,
                                "https://example.com",
                                false,
                                { autoCapitalize: "none", keyboardType: "url" }
                            )}
                            {renderField(
                                "Image URL",
                                imageUrl,
                                setImageUrl,
                                "Image URL",
                                false,
                                { autoCapitalize: "none", keyboardType: "url" }
                            )}
                            {renderField(
                                "Expiry date and time",
                                expiresAt,
                                setExpiresAt,
                                "YYYY-MM-DDTHH:mm",
                                false,
                                { autoCapitalize: "none" }
                            )}

                            <Text style={styles.dateHint}>
                                Example: 2026-12-31T23:59
                            </Text>

                            <View style={styles.switchRow}>
                                <View style={styles.switchCopy}>
                                    <Text style={styles.label}>Event status</Text>
                                    <Text style={styles.switchDescription}>
                                        {isActive ? "Active" : "Inactive"}
                                    </Text>
                                </View>

                                <Switch
                                    value={isActive}
                                    onValueChange={setIsActive}
                                    disabled={updating}
                                />
                            </View>

                            <View style={styles.formActions}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={closeEdit}
                                    disabled={updating}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        styles.saveButton,
                                        updating && styles.disabledButton,
                                    ]}
                                    onPress={updateEvent}
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>
                                            Save Changes
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Deactivation confirmation */}
            <Modal
                visible={!!confirmEvent}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmEvent(null)}
            >
                <View style={styles.overlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.modalTitle}>
                            Deactivate Event?
                        </Text>

                        <Text style={styles.confirmMessage}>
                            Are you sure you want to deactivate{" "}
                            {confirmEvent?.title || "this event"}?
                        </Text>

                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setConfirmEvent(null)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.deleteButton]}
                                onPress={deactivateEvent}
                            >
                                <Text style={styles.buttonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Message dialog */}
            <Modal
                visible={!!dialog}
                transparent
                animationType="fade"
                onRequestClose={() => setDialog(null)}
            >
                <View style={styles.overlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.modalTitle}>
                            {dialog?.heading || "Message"}
                        </Text>

                        <Text style={styles.confirmMessage}>
                            {dialog?.message || ""}
                        </Text>

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, styles.okButton]}
                            onPress={() => setDialog(null)}
                        >
                            <Text style={styles.buttonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f1f5f9",
    },
    header: {
        backgroundColor: "#fff",
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerText: {
        flex: 1,
        marginRight: 10,
    },
    heading: {
        fontSize: 23,
        fontWeight: "700",
        color: "#0f172a",
    },
    subtitle: {
        fontSize: 13,
        color: "#64748b",
        marginTop: 4,
    },
    refreshButton: {
        backgroundColor: "#2563eb",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    refreshText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },
    list: {
        padding: 16,
        paddingBottom: 32,
        flexGrow: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    loadingText: {
        color: "#64748b",
        marginTop: 12,
    },
    empty: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#334155",
    },
    emptyText: {
        color: "#64748b",
        marginTop: 8,
        textAlign: "center",
    },
    eventCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    cardTitleContainer: {
        flex: 1,
        marginRight: 10,
    },
    eventTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0f172a",
    },
    highlight: {
        fontSize: 13,
        color: "#2563eb",
        marginTop: 5,
    },
    badge: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
    },
    activeBadge: {
        backgroundColor: "#dcfce7",
    },
    inactiveBadge: {
        backgroundColor: "#fee2e2",
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    activeText: {
        color: "#166534",
    },
    inactiveText: {
        color: "#991b1b",
    },
    description: {
        color: "#334155",
        fontSize: 14,
        marginTop: 12,
    },
    info: {
        color: "#64748b",
        fontSize: 13,
        marginTop: 8,
        lineHeight: 19,
    },
    dateText: {
        color: "#64748b",
        fontSize: 12,
        marginTop: 12,
    },
    cardActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 16,
    },
    button: {
        minHeight: 40,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        marginBottom: 4,
    },
    editButton: {
        backgroundColor: "#2563eb",
    },
    deleteButton: {
        backgroundColor: "#dc2626",
    },
    saveButton: {
        backgroundColor: "#2563eb",
    },
    cancelButton: {
        backgroundColor: "#e2e8f0",
    },
    buttonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
    cancelText: {
        color: "#334155",
        fontSize: 13,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.6,
    },
    successBox: {
        backgroundColor: "#dcfce7",
        marginHorizontal: 16,
        marginTop: 14,
        padding: 12,
        borderRadius: 8,
    },
    successText: {
        color: "#166534",
        fontSize: 14,
        fontWeight: "600",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    editModal: {
        backgroundColor: "#fff",
        width: "100%",
        maxWidth: 560,
        maxHeight: "90%",
        borderRadius: 14,
        overflow: "hidden",
    },
    modalHeader: {
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalTitle: {
        fontSize: 19,
        fontWeight: "700",
        color: "#0f172a",
        flexShrink: 1,
    },
    closeText: {
        color: "#2563eb",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 10,
    },
    formScroll: {
        flexGrow: 0,
        flexShrink: 1,
    },
    formContent: {
        padding: 18,
        paddingBottom: 24,
    },
    fieldContainer: {
        marginBottom: 14,
    },
    label: {
        color: "#334155",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 7,
    },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#fff",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 14,
        color: "#0f172a",
    },
    multilineInput: {
        minHeight: 95,
        paddingTop: 12,
    },
    dateHint: {
        color: "#64748b",
        fontSize: 12,
        lineHeight: 18,
        marginTop: -5,
        marginBottom: 16,
    },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        marginBottom: 18,
    },
    switchCopy: {
        flex: 1,
        marginRight: 12,
    },
    switchDescription: {
        color: "#64748b",
        fontSize: 12,
        marginTop: 3,
    },
    formActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        marginTop: 8,
    },
    confirmModal: {
        backgroundColor: "#fff",
        width: "100%",
        maxWidth: 420,
        borderRadius: 14,
        padding: 22,
    },
    confirmMessage: {
        color: "#475569",
        fontSize: 14,
        lineHeight: 21,
        marginTop: 12,
        marginBottom: 14,
    },
    okButton: {
        alignSelf: "flex-end",
        minWidth: 80,
        marginTop: 8,
    },
});
