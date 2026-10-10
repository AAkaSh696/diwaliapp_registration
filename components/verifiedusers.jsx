
import React, {
    useCallback,
    useState
} from "react";

import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert
} from "react-native";

import {
    useFocusEffect
} from "@react-navigation/native";

import AsyncStorage from
    "@react-native-async-storage/async-storage";

// import { BASE_URL } from "@env";
const BASE_URL = "http://10.162.135.224:5001";
export default function VerifiedUsers({
    navigation
}) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ==========================================
    // FETCH VERIFIED USERS
    // ==========================================

    const fetchVerifiedUsers = async (
        isRefreshing = false
    ) => {

        try {

            if (isRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
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

            console.log(
                "Fetching verified users..."
            );

            const response = await fetch(
                `${BASE_URL}/admin/adminverifieddata`,
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
                "VERIFIED USERS RESPONSE:",
                result
            );

            if (!response.ok) {

                Alert.alert(
                    "Error",
                    result.msg ||
                        "Unable to fetch verified users."
                );

                return;
            }

            setUsers(
                Array.isArray(result.data)
                    ? result.data
                    : []
            );

        } catch (error) {

            console.error(
                "FETCH VERIFIED USERS ERROR:",
                error
            );

            Alert.alert(
                "Connection Error",
                "Unable to connect to the server."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };

    // ==========================================
    // FETCH WHEN PAGE OPENS
    // ==========================================

    useFocusEffect(
        useCallback(() => {

            fetchVerifiedUsers();

        }, [])
    );

    // ==========================================
    // REFRESH
    // ==========================================

    const onRefresh = () => {
        fetchVerifiedUsers(true);
    };

    // ==========================================
    // USER CARD
    // ==========================================

    const renderUser = ({
        item
    }) => {

        const isOutsider =
            item?.batch === "outsider";

        return (
            <View style={styles.card}>

                {/* HEADER */}

                <View style={styles.headerRow}>

                    <View style={styles.avatar}>

                        <Text style={styles.avatarText}>
                            {item?.Name
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                        </Text>

                    </View>

                    <View style={styles.nameContainer}>

                        <Text style={styles.name}>
                            {item?.Name || "N/A"}
                        </Text>

                        <View
                            style={
                                styles.verifiedBadge
                            }
                        >
                            <Text
                                style={
                                    styles.verifiedText
                                }
                            >
                                ✓ Verified
                            </Text>
                        </View>

                    </View>

                </View>

                {/* DETAILS */}

                <View style={styles.detailsContainer}>

                    {/* ROLL NO */}

                    {!isOutsider && (
                        <View style={styles.detailRow}>

                            <Text
                                style={
                                    styles.detailLabel
                                }
                            >
                                Roll No
                            </Text>

                            <Text
                                style={
                                    styles.detailValue
                                }
                            >
                                {item?.RollNO ||
                                    "N/A"}
                            </Text>

                        </View>
                    )}

                    {/* BRANCH */}

                    {!isOutsider && (
                        <View style={styles.detailRow}>

                            <Text
                                style={
                                    styles.detailLabel
                                }
                            >
                                Branch
                            </Text>

                            <Text
                                style={
                                    styles.detailValue
                                }
                            >
                                {item?.branch ||
                                    "N/A"}
                            </Text>

                        </View>
                    )}

                    {/* BATCH */}

                    <View style={styles.detailRow}>

                        <Text
                            style={
                                styles.detailLabel
                            }
                        >
                            Batch
                        </Text>

                        <Text
                            style={
                                styles.detailValue
                            }
                        >
                            {item?.batch || "N/A"}
                        </Text>

                    </View>

                    {/* MOBILE */}

                    <View style={styles.detailRow}>

                        <Text
                            style={
                                styles.detailLabel
                            }
                        >
                            Mobile
                        </Text>

                        <Text
                            style={
                                styles.detailValue
                            }
                        >
                            {item?.MobileNo ||
                                "N/A"}
                        </Text>

                    </View>

                    {/* AADHAAR */}

                    <View style={styles.detailRow}>

                        <Text
                            style={
                                styles.detailLabel
                            }
                        >
                            Aadhaar
                        </Text>

                        <Text
                            style={
                                styles.detailValue
                            }
                        >
                            {item?.Aadhar
                                ? `XXXX XXXX ${item.Aadhar.slice(-4)}`
                                : "N/A"}
                        </Text>

                    </View>

                    {/* VERIFIED DATE */}

                    <View style={styles.detailRow}>

                        <Text
                            style={
                                styles.detailLabel
                            }
                        >
                            Verified At
                        </Text>

                        <Text
                            style={
                                styles.detailValue
                            }
                        >
                            {item?.verifiedAt
                                ? new Date(
                                      item.verifiedAt
                                  ).toLocaleString()
                                : "N/A"}
                        </Text>

                    </View>

                </View>

                {/* OUTSIDER */}

                {isOutsider && (
                    <View
                        style={
                            styles.outsiderBadge
                        }
                    >
                        <Text
                            style={
                                styles.outsiderText
                            }
                        >
                            Outsider
                        </Text>
                    </View>
                )}

            </View>
        );
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (
        loading &&
        users.length === 0
    ) {

        return (
            <View
                style={
                    styles.loadingContainer
                }
            >

                <ActivityIndicator
                    size="large"
                    color="#B64216"
                />

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Loading verified users...
                </Text>

            </View>
        );
    }

    // ==========================================
    // UI
    // ==========================================

    return (
        <View style={styles.container}>

            {/* HEADER */}

            <View style={styles.topSection}>

                <TouchableOpacity
                    style={
                        styles.backButton
                    }
                    onPress={() =>
                        navigation.goBack()
                    }
                >
                    <Text
                        style={
                            styles.backText
                        }
                    >
                        ←
                    </Text>
                </TouchableOpacity>

                <View>

                    <Text
                        style={styles.title}
                    >
                        Verified Users
                    </Text>

                    <Text
                        style={
                            styles.subtitle
                        }
                    >
                        Users verified by you
                    </Text>

                </View>

            </View>

            {/* COUNT */}

            <View
                style={styles.countCard}
            >

                <View>

                    <Text
                        style={
                            styles.countLabel
                        }
                    >
                        Total Verified
                    </Text>

                    <Text
                        style={
                            styles.countNumber
                        }
                    >
                        {users.length}
                    </Text>

                </View>

                <Text
                    style={
                        styles.countIcon
                    }
                >
                    ✓
                </Text>

            </View>

            {/* USERS */}

            <FlatList
                data={users}

                keyExtractor={(item) =>
                    String(item?._id)
                }

                renderItem={renderUser}

                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            onRefresh
                        }
                        tintColor="#B64216"
                    />
                }

                showsVerticalScrollIndicator={
                    false
                }

                contentContainerStyle={
                    users.length === 0
                        ? styles.emptyList
                        : styles.list
                }

                ListEmptyComponent={

                    <View
                        style={
                            styles.emptyContainer
                        }
                    >

                        <Text
                            style={
                                styles.emptyIcon
                            }
                        >
                            ✓
                        </Text>

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No Verified Users
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            You haven't verified
                            any users yet.
                        </Text>

                    </View>
                }
            />

        </View>
    );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#FFF8F0",
        paddingHorizontal: 20,
        paddingTop: 20
    },

    topSection: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#FFF0E5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },

    backText: {
        fontSize: 26,
        color: "#B64216"
    },

    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#292929"
    },

    subtitle: {
        fontSize: 13,
        color: "#777",
        marginTop: 3
    },

    countCard: {
        backgroundColor: "#B64216",
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    countLabel: {
        color: "#FFE9D7",
        fontSize: 13,
        marginBottom: 3
    },

    countNumber: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "800"
    },

    countIcon: {
        color: "#FFFFFF",
        fontSize: 42,
        fontWeight: "700"
    },

    list: {
        paddingBottom: 30
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,

        elevation: 3,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.08,
        shadowRadius: 8
    },

    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15
    },

    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#FFF0E5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },

    avatarText: {
        fontSize: 21,
        fontWeight: "800",
        color: "#B64216"
    },

    nameContainer: {
        flex: 1
    },

    name: {
        fontSize: 18,
        fontWeight: "700",
        color: "#292929",
        marginBottom: 6
    },

    verifiedBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#E8F7EC",
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 10
    },

    verifiedText: {
        color: "#218739",
        fontSize: 11,
        fontWeight: "700"
    },

    detailsContainer: {
        borderTopWidth: 1,
        borderTopColor: "#F2ECE7",
        paddingTop: 6
    },

    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F2ECE7"
    },

    detailLabel: {
        fontSize: 13,
        color: "#888"
    },

    detailValue: {
        fontSize: 13,
        color: "#333",
        fontWeight: "600",
        maxWidth: "62%",
        textAlign: "right"
    },

    outsiderBadge: {
        alignSelf: "flex-start",
        marginTop: 12,
        backgroundColor: "#FFF1D6",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10
    },

    outsiderText: {
        color: "#A66A00",
        fontSize: 11,
        fontWeight: "700"
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF8F0"
    },

    loadingText: {
        marginTop: 12,
        color: "#777",
        fontSize: 14
    },

    emptyList: {
        flexGrow: 1
    },

    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30
    },

    emptyIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#E8F7EC",
        color: "#218739",
        fontSize: 40,
        fontWeight: "700",
        textAlign: "center",
        textAlignVertical: "center",
        marginBottom: 15
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333"
    },

    emptyText: {
        marginTop: 7,
        fontSize: 14,
        color: "#888",
        textAlign: "center"
    }
});
