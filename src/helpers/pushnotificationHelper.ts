import admin from "firebase-admin";
import config from "../config";

if (!admin.apps.length) {
  if (config.firebase_service_account_base64) {
    try {
      const serviceAccountJson = Buffer.from(config.firebase_service_account_base64, "base64").toString("utf8");
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      console.log("Firebase Admin initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
    }
  } else {
    console.warn("Firebase service account base64 is missing. Push notifications will not work.");
  }
}

export const sendPushNotification = async (
  target: string, // deviceToken or topic
  title: string,
  body: string,
  data: Record<string, any>,
  icon?: string,
  isTopic: boolean = false
) => {
  if (!admin.apps.length) {
    console.warn("Firebase Admin not initialized. Skipping push notification.");
    return;
  }

  // FCM data object only accepts strings, so we stringify any non-string values
  const formattedData: { [key: string]: string } = {};
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") {
      formattedData[key] = data[key];
    } else {
      formattedData[key] = JSON.stringify(data[key]);
    }
  });

  const message: any = {
    notification: { title, body },
    data: formattedData,
    ...(icon && {
      android: {
        notification: { icon },
      },
    }),
    apns: {
      payload: {
        aps: {
          'mutable-content': 1,
        },
      },
    },
  };

  if (isTopic) {
    message.topic = target;
  } else {
    message.token = target;
  }

  try {
    const response = await admin.messaging().send(message as admin.messaging.Message);
    console.log(`Successfully sent message to ${isTopic ? 'topic' : 'token'}:`, response);
  } catch (error: any) {
    console.error('Error sending message:', error?.message, error);
  }
};
