
import React from "react";

import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Image,
    ScrollView,
    Platform,
} from "react-native";

import QRCodeNative from "react-native-qrcode-svg";
import QRCodeWeb from "react-qr-code";
import { useSelector } from "react-redux";

/* ============================================================
   QR CODE — ANDROID + WEB
============================================================ */

function QR({ value, size = 220 }) {
    if (!value) return null;

    if (Platform.OS === "web") {
        return (
            <View style={styles.webQR}>
                <QRCodeWeb
                    value={value}
                    size={size}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="L"
                    style={{
                        width: size,
                        height: size,
                    }}
                />
            </View>
        );
    }

    return (
        <QRCodeNative
            value={value}
            size={size}
            backgroundColor="#FFFFFF"
            ecl="L"
        />
    );
}

/* ============================================================
   PROFILE SCREEN
============================================================ */

export default function Profile() {
    const user = useSelector((state) => state.user);

    /*
    |--------------------------------------------------------------------------
    | QR DATA
    |--------------------------------------------------------------------------
    | Include both image URLs explicitly.
    | url        = profile photo
    | urlAadhar  = Aadhaar image
    */

    const qrData = user
        ? {
              ...user,
              url: user.url || "",
              urlAadhar: user.urlAadhar || "",
          }
        : null;

    const qrValue = qrData ? JSON.stringify(qrData) : "";

    /*
    |--------------------------------------------------------------------------
    | EMPTY STATE
    |--------------------------------------------------------------------------
    */

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        Unable to load profile
                    </Text>

                    <Text style={styles.emptyText}>
                        Student information is not available.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER */}

                <View style={styles.header}>
                    <Text style={styles.title}>My Profile</Text>

                    <Text style={styles.subtitle}>
                        Student Verification
                    </Text>
                </View>

                {/* PROFILE CARD */}

                <View style={styles.profileCard}>
                    {user.url ? (
                        <Image
                            source={{ uri: user.url }}
                            style={styles.profileImage}
                            resizeMode="cover"
                            onError={(error) => {
                                console.log(
                                    "Profile image error:",
                                    user.url,
                                    error.nativeEvent
                                );
                            }}
                        />
                    ) : (
                        <View style={styles.profilePlaceholder}>
                            <Text style={styles.placeholderText}>
                                {user.Name?.charAt(0)?.toUpperCase() || "S"}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.name}>
                        {user.Name || "Student"}
                    </Text>

                    <Text style={styles.branch}>
                        {user.branch?.toUpperCase() || "N/A"}
                        {" • "}
                        Batch {user.batch || "N/A"}
                    </Text>

                    <View
                        style={[
                            styles.statusBadge,
                            user.verified
                                ? styles.verifiedBadge
                                : styles.pendingBadge,
                        ]}
                    >
                        <View
                            style={[
                                styles.statusDot,
                                user.verified
                                    ? styles.verifiedDot
                                    : styles.pendingDot,
                            ]}
                        />

                        <Text
                            style={[
                                styles.statusText,
                                user.verified
                                    ? styles.verifiedText
                                    : styles.pendingText,
                            ]}
                        >
                            {user.verified
                                ? "Verified Student"
                                : "Verification Pending"}
                        </Text>
                    </View>
                </View>

                {/* STUDENT INFORMATION */}

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>
                        Student Information
                    </Text>

                    <InfoRow
                        label="Roll Number"
                        value={user.RollNO}
                    />

                    <InfoRow
                        label="Branch"
                        value={user.branch?.toUpperCase()}
                    />

                    <InfoRow
                        label="Batch"
                        value={user.batch}
                    />

                    <InfoRow
                        label="Mobile"
                        value={user.MobileNo}
                    />

                    <InfoRow
                        label="Verification"
                        value={user.verified ? "Verified" : "Pending"}
                    />
                </View>

                {/* DOCUMENT PREVIEW */}

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>
                        Uploaded Documents
                    </Text>

                    <Text style={styles.documentLabel}>
                        Profile Photo
                    </Text>

                    {user.url ? (
                        <Image
                            source={{ uri: user.url }}
                            style={styles.documentPreview}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={styles.missingDocument}>
                            Profile photo URL is unavailable.
                        </Text>
                    )}

                    <Text style={styles.documentLabel}>
                        Aadhaar Image
                    </Text>

                    {user.urlAadhar ? (
                        <Image
                            source={{ uri: user.urlAadhar }}
                            style={styles.documentPreview}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={styles.missingDocument}>
                            Aadhaar image URL is unavailable.
                        </Text>
                    )}
                </View>

                {/* QR CODE */}

                <View style={styles.qrCard}>
                    <Text style={styles.sectionTitle}>
                        Student QR
                    </Text>

                    <Text style={styles.qrDescription}>
                        Scan this QR code to access the student's
                        information and uploaded document URLs.
                    </Text>

                    <View style={styles.qrContainer}>
                        <QR value={qrValue} size={220} />
                    </View>

                    <Text style={styles.rollText}>
                        {user.RollNO || "N/A"}
                    </Text>

                    <Text style={styles.qrInfo}>
                        Includes student details, profile photo URL,
                        and Aadhaar image URL.
                    </Text>
                </View>

                {/* QR DATA SIZE */}

                <View style={styles.dataCard}>
                    <Text style={styles.dataTitle}>
                        QR Data
                    </Text>

                    <Text style={styles.dataText}>
                        {qrValue.length} characters encoded
                    </Text>

                    <Text style={styles.dataText}>
                        Profile URL: {user.url ? "Included" : "Missing"}
                    </Text>

                    <Text style={styles.dataText}>
                        Aadhaar URL: {user.urlAadhar ? "Included" : "Missing"}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ============================================================
   INFORMATION ROW
============================================================ */

function InfoRow({ label, value }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.label}>{label}</Text>

            <Text style={styles.value}>
                {value === null || value === undefined || value === ""
                    ? "N/A"
                    : String(value)}
            </Text>
        </View>
    );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FB",
    },

    scrollContent: {
        padding: 20,
        paddingBottom: 40,
        width: "100%",
        maxWidth: 760,
        alignSelf: "center",
    },

    header: {
        marginBottom: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
    },

    subtitle: {
        marginTop: 4,
        fontSize: 15,
        color: "#6B7280",
    },

    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 25,
        alignItems: "center",
        marginBottom: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },

    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        backgroundColor: "#E5E7EB",
    },

    profilePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
    },

    placeholderText: {
        fontSize: 38,
        fontWeight: "700",
        color: "#6B7280",
    },

    name: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },

    branch: {
        marginTop: 5,
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },

    verifiedBadge: {
        backgroundColor: "#DCFCE7",
    },

    pendingBadge: {
        backgroundColor: "#FEF3C7",
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 7,
    },

    verifiedDot: {
        backgroundColor: "#16A34A",
    },

    pendingDot: {
        backgroundColor: "#D97706",
    },

    statusText: {
        fontSize: 14,
        fontWeight: "600",
    },

    verifiedText: {
        color: "#15803D",
    },

    pendingText: {
        color: "#B45309",
    },

    infoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 15,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },

    label: {
        fontSize: 14,
        color: "#6B7280",
    },

    value: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        maxWidth: "55%",
        textAlign: "right",
    },

    documentLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
        marginTop: 8,
        marginBottom: 10,
    },

    documentPreview: {
        width: "100%",
        height: 220,
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        marginBottom: 16,
    },

    missingDocument: {
        fontSize: 13,
        color: "#9CA3AF",
        marginBottom: 16,
    },

    qrCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },

    qrDescription: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 20,
    },

    qrContainer: {
        padding: 15,
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    webQR: {
        width: 220,
        height: 220,
        backgroundColor: "#FFFFFF",
    },

    rollText: {
        marginTop: 15,
        fontSize: 15,
        fontWeight: "600",
        color: "#374151",
        letterSpacing: 1,
    },

    qrInfo: {
        marginTop: 8,
        fontSize: 12,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 18,
    },

    dataCard: {
        marginTop: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
    },

    dataTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#374151",
    },

    dataText: {
        marginTop: 5,
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
    },

    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 30,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },

    emptyText: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
    },
});
