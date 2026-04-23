import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export type ExportAction = 'save' | 'print';

export const exportPDF = async (
  html: string,
  filename: string,
  action: ExportAction = 'save'
): Promise<void> => {
  try {
    if (action === 'print') {
      await Print.printAsync({ html });
      return;
    }

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${filename}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF Ready', `Your PDF has been generated and is ready to share.`);
    }
  } catch (e: any) {
    Alert.alert('Export Failed', e?.message ?? 'Could not generate PDF. Please try again.');
  }
};

export const promptExportAction = (html: string, filename: string): void => {
  Alert.alert(
    'Export PDF',
    'What would you like to do with this report?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: '🖨  Print', onPress: () => exportPDF(html, filename, 'print') },
      { text: '📤  Save / Share', onPress: () => exportPDF(html, filename, 'save') },
    ]
  );
};
