import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { initializeApp } from "firebase-admin/app";
import { logger } from "firebase-functions";

// Initialize Firebase Admin SDK
initializeApp();

// Custom databaseId assigned to our applet
const databaseId = "ai-studio-a27d6130-c443-4832-8d80-83d1012e39bc";

/**
 * Scheduled Cloud Function that runs every 5 minutes
 * and purges all temporary files that have expired (uploaded > 1 hour ago)
 */
export const cleanupExpiredFiles = onSchedule({
  schedule: "every 5 minutes",
  timeZone: "UTC",
  memory: "256MiB"
}, async () => {
  logger.info("Starting scheduled cleanup of expired files...");
  
  const db = getFirestore(databaseId);
  const storage = getStorage();
  const now = Date.now();
  
  try {
    // Retrieve all files where expiresAt has already passed
    const expiredSnapshot = await db.collection("files")
      .where("expiresAt", "<=", now)
      .get();
      
    if (expiredSnapshot.empty) {
      logger.info("No expired files found in this run.");
      return;
    }
    
    logger.info(`Found ${expiredSnapshot.size} expired file(s) to clean up.`);
    
    for (const doc of expiredSnapshot.docs) {
      const data = doc.data();
      const fileId = doc.id;
      const storagePath = data.storagePath;
      
      logger.info(`Cleaning up expired file: ID = ${fileId}, Name = "${data.filename}"`);
      
      // 1. Delete file from Cloud Storage bucket
      if (storagePath) {
        try {
          const bucket = storage.bucket();
          const file = bucket.file(storagePath);
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            logger.info(`Deleted storage object for file: ${storagePath}`);
          } else {
            logger.warn(`Storage file did not exist in bucket: ${storagePath}`);
          }
        } catch (storageErr) {
          logger.error(`Failed to delete storage file "${storagePath}" for record ${fileId}:`, storageErr);
        }
      }
      
      // 2. Delete the Firestore document
      await doc.ref.delete();
      logger.info(`Deleted Firestore document for file: ${fileId}`);
    }
    
    logger.info("Finished scheduled cleanup of expired files successfully.");
  } catch (err) {
    logger.error("Fatal error during expired files cleanup job:", err);
  }
});
