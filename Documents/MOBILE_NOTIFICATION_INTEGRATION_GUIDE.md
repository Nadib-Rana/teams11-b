# Notification System - Mobile App Integration Guide

Complete guide for mobile app developers (Flutter/React Native) to integrate with the Teams11 notification system.

---

## Table of Contents

1. [Overview](#overview)
2. [Firebase Setup](#firebase-setup)
3. [Device Registration](#device-registration)
4. [Handling Push Notifications](#handling-push-notifications)
5. [Notification Settings](#notification-settings)
6. [Device Management](#device-management)
7. [Deep Link Navigation](#deep-link-navigation)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The notification system supports:

- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Email**: Received in user email inbox
- **SMS**: Received as text messages
- **In-App Notifications**: Displayed as list in app

### Notification Flow

```
Backend sends notification
    ↓
Firebase Cloud Messaging
    ↓
Mobile device receives push
    ↓
App shows notification
    ↓
User taps notification
    ↓
App navigates via deep link
```

---

## Firebase Setup

### For Flutter

**1. Add Firebase Dependencies**

```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.6.0
```

**2. Initialize Firebase**

```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const MyApp());
}
```

**3. Get FCM Token**

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<String> getFCMToken() async {
    try {
      String? token = await _messaging.getToken();
      print('FCM Token: $token');
      return token ?? '';
    } catch (e) {
      print('Error getting FCM token: $e');
      return '';
    }
  }
}
```

### For React Native

**1. Add Firebase Dependencies**

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**2. Initialize Firebase**

```javascript
import { initializeApp } from "@react-native-firebase/app";
import messaging from "@react-native-firebase/messaging";

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase config
};

// Async function to initialize
async function initializeFirebase() {
  try {
    await messaging().requestUserPermission();
    console.log("Firebase initialized");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
}

initializeFirebase();
```

**3. Get FCM Token**

```javascript
import messaging from "@react-native-firebase/messaging";

async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}
```

---

## Device Registration

Register your device on app startup to receive push notifications.

### Flutter Implementation

```dart
class AuthService {
  final ApiClient _apiClient = ApiClient();
  final NotificationService _notificationService = NotificationService();

  Future<void> loginUser(String email, String password) async {
    // Login logic...

    // After successful login, register device
    await _registerDevice();
  }

  Future<void> _registerDevice() async {
    try {
      String fcmToken = await _notificationService.getFCMToken();
      String deviceId = await _getDeviceId(); // Unique device ID

      await _apiClient.post('/notifications/devices', {
        'deviceId': deviceId,
        'fcmToken': fcmToken,
        'deviceType': 'android', // or 'ios'
        'deviceName': await _getDeviceModel(),
      });

      print('Device registered successfully');
    } catch (e) {
      print('Failed to register device: $e');
    }
  }

  Future<String> _getDeviceId() async {
    // Use device_info_plus package
    DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      return androidInfo.id;
    } else if (Platform.isIOS) {
      IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
      return iosInfo.identifierForVendor ?? '';
    }
    return '';
  }
}
```

### React Native Implementation

```javascript
import messaging from "@react-native-firebase/messaging";
import DeviceInfo from "react-native-device-info";

export async function registerDevice(token) {
  try {
    const fcmToken = await messaging().getToken();
    const deviceId = await DeviceInfo.getUniqueId();
    const deviceName = await DeviceInfo.getModel();

    const response = await fetch("/notifications/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        fcmToken: fcmToken,
        deviceType: Platform.OS, // 'android' or 'ios'
        deviceName: deviceName,
      }),
    });

    if (response.ok) {
      console.log("Device registered successfully");
    }
  } catch (error) {
    console.error("Failed to register device:", error);
  }
}
```

---

## Handling Push Notifications

### Flutter - Listen for Notifications

```dart
class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  void initializeNotifications() {
    // Handle notification when app is in foreground
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received notification in foreground:');
      print('Title: ${message.notification?.title}');
      print('Body: ${message.notification?.body}');
      print('Data: ${message.data}');

      // Show local notification
      _showLocalNotification(message);
    });

    // Handle notification when app is in background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Notification opened app:');
      print('Data: ${message.data}');

      // Handle deep link
      _handleNotificationTap(message);
    });

    // Handle token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      print('FCM Token refreshed: $newToken');
      _updateFCMToken(newToken);
    });
  }

  Future<void> _updateFCMToken(String newToken) async {
    try {
      String deviceId = await _getDeviceId();

      await ApiClient().patch(
        '/notifications/devices/$deviceId',
        {'fcmToken': newToken},
      );

      print('FCM token updated successfully');
    } catch (e) {
      print('Failed to update FCM token: $e');
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    String? deepLink = message.data['deepLink'];

    if (deepLink != null) {
      // Navigate using deep link
      _navigateToScreen(deepLink);
    }
  }
}
```

### Flutter - Show Local Notification

```dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  void _showLocalNotification(RemoteMessage message) {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'default_channel',
      'Default Channel',
      importance: Importance.max,
      priority: Priority.high,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
    );

    _flutterLocalNotificationsPlugin.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      details,
      payload: jsonEncode(message.data),
    );
  }
}
```

### React Native - Listen for Notifications

```javascript
import messaging from "@react-native-firebase/messaging";
import { useEffect } from "react";

export function setupNotificationHandlers() {
  // Handle notification when app is in foreground
  const unsubscribeForeground = messaging().onMessage(async (message) => {
    console.log("Received notification in foreground:", message);

    // Show local notification
    showLocalNotification(message);
  });

  // Handle notification when app is opened from background
  messaging().onNotificationOpenedApp((message) => {
    console.log("Notification opened app:", message);

    if (message?.data?.deepLink) {
      navigateToScreen(message.data.deepLink);
    }
  });

  // Get initial message (app was closed when notification received)
  messaging()
    .getInitialNotification()
    .then((message) => {
      if (message?.data?.deepLink) {
        navigateToScreen(message.data.deepLink);
      }
    });

  // Handle token refresh
  const unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
    console.log("FCM Token refreshed:", token);
    updateFCMToken(token);
  });

  return () => {
    unsubscribeForeground();
    unsubscribeTokenRefresh();
  };
}

function initializeNotificationHandlers() {
  useEffect(() => {
    return setupNotificationHandlers();
  }, []);
}
```

---

## Notification Settings

Allow users to manage notification preferences.

### Flutter

```dart
class NotificationSettingsScreen extends StatefulWidget {
  @override
  State<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _emailEnabled = true;
  bool _smsEnabled = true;
  bool _pushEnabled = true;
  bool _reminder24h = true;
  bool _reminder1h = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final response = await ApiClient().get('/notifications/settings');
      setState(() {
        _emailEnabled = response['emailNotification'] ?? true;
        _smsEnabled = response['smsNotification'] ?? true;
        _pushEnabled = response['pushNotification'] ?? true;
        _reminder24h = response['reminder24h'] ?? true;
        _reminder1h = response['reminder1h'] ?? true;
      });
    } catch (e) {
      print('Error loading settings: $e');
    }
  }

  Future<void> _updateSettings() async {
    try {
      await ApiClient().patch('/notifications/settings', {
        'emailNotification': _emailEnabled,
        'smsNotification': _smsEnabled,
        'pushNotification': _pushEnabled,
        'reminder24h': _reminder24h,
        'reminder1h': _reminder1h,
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings updated successfully')),
      );
    } catch (e) {
      print('Error updating settings: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notification Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            title: const Text('Email Notifications'),
            value: _emailEnabled,
            onChanged: (value) {
              setState(() => _emailEnabled = value);
              _updateSettings();
            },
          ),
          SwitchListTile(
            title: const Text('SMS Notifications'),
            value: _smsEnabled,
            onChanged: (value) {
              setState(() => _smsEnabled = value);
              _updateSettings();
            },
          ),
          SwitchListTile(
            title: const Text('Push Notifications'),
            value: _pushEnabled,
            onChanged: (value) {
              setState(() => _pushEnabled = value);
              _updateSettings();
            },
          ),
          const Divider(),
          const Text('Reminders', style: TextStyle(fontWeight: FontWeight.bold)),
          SwitchListTile(
            title: const Text('24-Hour Reminder'),
            value: _reminder24h,
            onChanged: (value) {
              setState(() => _reminder24h = value);
              _updateSettings();
            },
          ),
          SwitchListTile(
            title: const Text('1-Hour Reminder'),
            value: _reminder1h,
            onChanged: (value) {
              setState(() => _reminder1h = value);
              _updateSettings();
            },
          ),
        ],
      ),
    );
  }
}
```

### React Native

```javascript
import React, { useState, useEffect } from "react";
import { View, Switch, Text, ScrollView } from "react-native";

export function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({
    emailNotification: true,
    smsNotification: true,
    pushNotification: true,
    reminder24h: true,
    reminder1h: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/notifications/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const updateSettings = async (updatedSettings) => {
    try {
      await fetch("/notifications/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedSettings),
      });
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const toggleSetting = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    updateSettings(updated);
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
        Notification Settings
      </Text>

      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text>Email Notifications</Text>
          <Switch
            value={settings.emailNotification}
            onValueChange={() => toggleSetting("emailNotification")}
          />
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text>SMS Notifications</Text>
          <Switch
            value={settings.smsNotification}
            onValueChange={() => toggleSetting("smsNotification")}
          />
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text>Push Notifications</Text>
          <Switch
            value={settings.pushNotification}
            onValueChange={() => toggleSetting("pushNotification")}
          />
        </View>
      </View>

      <Text
        style={{
          fontSize: 14,
          fontWeight: "bold",
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Reminders
      </Text>

      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text>24-Hour Reminder</Text>
          <Switch
            value={settings.reminder24h}
            onValueChange={() => toggleSetting("reminder24h")}
          />
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text>1-Hour Reminder</Text>
          <Switch
            value={settings.reminder1h}
            onValueChange={() => toggleSetting("reminder1h")}
          />
        </View>
      </View>
    </ScrollView>
  );
}
```

---

## Device Management

### Flutter - Manage Multiple Devices

```dart
class DeviceManagementScreen extends StatefulWidget {
  @override
  State<DeviceManagementScreen> createState() => _DeviceManagementScreenState();
}

class _DeviceManagementScreenState extends State<DeviceManagementScreen> {
  List<Map<String, dynamic>> _devices = [];

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  Future<void> _loadDevices() async {
    try {
      final response = await ApiClient().get('/notifications/devices');
      setState(() {
        _devices = List<Map<String, dynamic>>.from(response);
      });
    } catch (e) {
      print('Error loading devices: $e');
    }
  }

  Future<void> _removeDevice(String deviceId) async {
    try {
      await ApiClient().delete('/notifications/devices/$deviceId');
      _loadDevices();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Device removed')),
      );
    } catch (e) {
      print('Error removing device: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage Devices')),
      body: ListView.builder(
        itemCount: _devices.length,
        itemBuilder: (context, index) {
          final device = _devices[index];
          return ListTile(
            title: Text(device['deviceName'] ?? 'Unknown Device'),
            subtitle: Text('Type: ${device['deviceType'] ?? 'Unknown'}'),
            trailing: IconButton(
              icon: const Icon(Icons.delete),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Remove Device'),
                    content: const Text('Are you sure?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () {
                          _removeDevice(device['deviceId']);
                          Navigator.pop(context);
                        },
                        child: const Text('Remove'),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
```

---

## Deep Link Navigation

Handle deep links when notifications are tapped.

### Flutter

```dart
void _navigateToScreen(String deepLink) {
  // Parse deep link format: teams11://page/param
  Uri uri = Uri.parse(deepLink);

  switch (uri.host) {
    case 'booking':
      final bookingId = uri.pathSegments.isNotEmpty ? uri.pathSegments[0] : null;
      if (bookingId != null) {
        Navigator.pushNamed(context, '/booking-details', arguments: bookingId);
      }
      break;

    case 'profile':
      Navigator.pushNamed(context, '/profile');
      break;

    case 'messages':
      Navigator.pushNamed(context, '/messages');
      break;

    default:
      print('Unknown deep link: $deepLink');
  }
}
```

### React Native

```javascript
import { useNavigation } from "@react-navigation/native";

export function handleDeepLink(deepLink) {
  // Parse deep link format: teams11://page/param
  const url = new URL(deepLink);

  const navigation = useNavigation();

  switch (url.hostname) {
    case "booking":
      const bookingId = url.pathname.split("/")[1];
      if (bookingId) {
        navigation.navigate("BookingDetails", { bookingId });
      }
      break;

    case "profile":
      navigation.navigate("Profile");
      break;

    case "messages":
      navigation.navigate("Messages");
      break;

    default:
      console.log("Unknown deep link:", deepLink);
  }
}
```

---

## Testing

### Manual Testing

1. **Register Device**
   - Log in to app
   - Check device is registered in dashboard

2. **Send Test Notification**

   ```bash
   curl -X POST http://localhost:3000/notifications/booking-reminder \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"bookingId": "booking_id"}'
   ```

3. **Verify Receipt**
   - Check device receives notification
   - Verify notification displays correctly
   - Tap notification and verify deep link navigation

### Automated Testing

```dart
testWidgets('Notification registration works', (WidgetTester tester) async {
  await tester.pumpWidget(const MyApp());

  final notificationService = NotificationService();
  final fcmToken = await notificationService.getFCMToken();

  expect(fcmToken, isNotEmpty);

  // Test API integration
  final registered = await _apiClient.post('/notifications/devices', {
    'deviceId': 'test_device',
    'fcmToken': fcmToken,
  });

  expect(registered, isNotNull);
});
```

---

## Troubleshooting

### Issue: FCM Token Not Generated

**Solution:**

- Ensure Firebase is initialized
- Check Firebase credentials in google-services.json (Android)
- Check GoogleService-Info.plist (iOS)
- Verify internet connection

### Issue: Notifications Not Received

**Solution:**

- Verify device is registered with FCM token
- Check notification settings are enabled
- Ensure app has notification permissions
- Check device has internet connection

### Issue: Deep Links Not Working

**Solution:**

- Verify deep link format: `teams11://page/param`
- Ensure navigation routes are configured
- Check notification data payload format
- Verify payload is passed to handler

### Issue: Token Refresh Not Working

**Solution:**

- Ensure `onTokenRefresh` listener is set up
- Verify API endpoint for updating token
- Check device is still registered
- Review FCM credentials

---

## Checklist for Implementation

- [ ] Firebase initialized
- [ ] FCM token obtained
- [ ] Device registered with API
- [ ] Foreground notifications display
- [ ] Background notifications handled
- [ ] Deep links configured
- [ ] Token refresh implemented
- [ ] Settings page functional
- [ ] Device management working
- [ ] Error handling in place
- [ ] Testing completed
- [ ] Documentation updated

---

**Last Updated**: April 5, 2026
