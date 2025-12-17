// src/services/googleDriveService.ts
import { gapi } from 'gapi-script';
import { excelService } from './excelService';

// REPLACE WITH YOUR CLIENT ID
const CLIENT_ID = "867988307145-8crht6cl2gjap5oj48netctpggmb756p.apps.googleusercontent.com"; 
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const FOLDER_NAME = "Restaurant_POS_Data"; // Main Folder Name
const FILE_NAME = "Master_Backup.xlsx";

export const googleDriveService = {
  initClient: () => {
    return new Promise<void>((resolve, reject) => {
      gapi.load('client:auth2', () => {
        gapi.client.init({ clientId: CLIENT_ID, scope: SCOPES })
          .then(() => resolve())
          .catch((err: any) => reject(err));
      });
    });
  },

  signIn: async () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) await authInstance.signIn();
    return authInstance.currentUser.get();
  },

  // Helper: Find or Create Folder
  getOrCreateFolder: async () => {
    const accessToken = gapi.auth.getToken().access_token;
    
    // 1. Search for folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id; // Folder exists
    }

    // 2. Create folder if not exists
    const meta = {
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder"
    };
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meta)
    });
    const folderData = await createRes.json();
    return folderData.id;
  },

  syncDataToDrive: async () => {
    try {
      const auth = gapi.auth2.getAuthInstance();
      if (!auth.isSignedIn.get()) return { success: false, message: "Not Signed In" };

      // 1. Get Folder ID
      const folderId = await googleDriveService.getOrCreateFolder();
      
      // 2. Prepare File
      const excelBuffer = await excelService.exportSalesData();
      const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const accessToken = gapi.auth.getToken().access_token;

      // 3. Search for File INSIDE that folder
      const fileSearch = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const fileResult = await fileSearch.json();
      const existingFile = fileResult.files?.[0];

      // 4. Upload / Patch
      const metadata = { name: FILE_NAME, parents: [folderId] }; // Put inside folder
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', fileData);

      let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';

      if (existingFile) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
        method = 'PATCH';
      }

      const res = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });

      if (!res.ok) throw new Error("Upload failed");
      return { success: true, message: "Synced Successfully" };

    } catch (error: any) {
      console.error("Sync Error:", error);
      return { success: false, message: error.message };
    }
  }
};